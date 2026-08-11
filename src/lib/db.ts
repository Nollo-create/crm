import "server-only";
import mysql from "mysql2/promise";
import { leadScore } from "@/lib/crm/pipeline";
import { buildCompanyOrderBy, pageBounds } from "@/lib/crm/company-query";
import { buildContactOrderBy } from "@/lib/crm/contact-query";
import { buildLeadOrderBy } from "@/lib/crm/leads";

// The CMS/CRM's OWN database — a separate MySQL database on the same server. It
// never joins across into the webapp's tables; anything from there comes through
// the Sajtpress client (sajtpress.ts). Self-healing schema: CREATE IF NOT EXISTS
// on first use, memoised for the process.

const globalForDb = globalThis as unknown as { __cmsPool?: mysql.Pool; __crmSchema?: Promise<void>; __crmAuthSchema?: Promise<void> };

export function getPool(): mysql.Pool {
  if (!globalForDb.__cmsPool) {
    globalForDb.__cmsPool = mysql.createPool({
      host: process.env.DB_HOST || "localhost",
      port: Number(process.env.DB_PORT || 3306),
      user: process.env.DB_USER || "",
      password: process.env.DB_PASSWORD || "",
      database: process.env.DB_NAME || "",
      waitForConnections: true,
      connectionLimit: 5,
      charset: "utf8mb4_general_ci",
    });
  }
  return globalForDb.__cmsPool;
}

export async function dbHealth(): Promise<boolean> {
  if (!process.env.DB_NAME) return false;
  try {
    await getPool().query("SELECT 1");
    return true;
  } catch {
    return false;
  }
}

/** Add a column only if it's missing — MySQL has no reliable ADD COLUMN IF NOT
 *  EXISTS, so we check information_schema first. Idempotent for the existing prod
 *  DB (which predates multi-tenancy). */
async function ensureColumn(pool: mysql.Pool, table: string, column: string, ddl: string): Promise<void> {
  const [rows] = await pool.query<mysql.RowDataPacket[]>(
    "SELECT COUNT(*) AS n FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?",
    [table, column]
  );
  if (Number(rows[0]?.n ?? 0) === 0) {
    await pool.query(`ALTER TABLE \`${table}\` ADD COLUMN ${ddl}`);
  }
}

export function ensureSchema(): Promise<void> {
  if (!globalForDb.__crmSchema) {
    globalForDb.__crmSchema = (async () => {
      const pool = getPool();
      await pool.query(`
        CREATE TABLE IF NOT EXISTS crm_companies (
          id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
          organization_id INT UNSIGNED NOT NULL DEFAULT 0,
          name VARCHAR(190) NOT NULL DEFAULT '',
          industry VARCHAR(120) NOT NULL DEFAULT '',
          city VARCHAR(120) NOT NULL DEFAULT '',
          website VARCHAR(300) NOT NULL DEFAULT '',
          employees INT UNSIGNED NULL,
          annual_value INT UNSIGNED NOT NULL DEFAULT 0,
          status VARCHAR(20) NOT NULL DEFAULT 'lead',
          account_manager VARCHAR(120) NOT NULL DEFAULT '',
          industry_match TINYINT(1) NOT NULL DEFAULT 0,
          lead_score TINYINT UNSIGNED NOT NULL DEFAULT 0,
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_company_status (status, name),
          INDEX idx_company_org (organization_id, updated_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
      `);
      await pool.query(`
        CREATE TABLE IF NOT EXISTS crm_contacts (
          id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
          organization_id INT UNSIGNED NOT NULL DEFAULT 0,
          company_id INT UNSIGNED NOT NULL,
          name VARCHAR(190) NOT NULL DEFAULT '',
          role VARCHAR(120) NOT NULL DEFAULT '',
          email VARCHAR(190) NOT NULL DEFAULT '',
          phone VARCHAR(60) NOT NULL DEFAULT '',
          department VARCHAR(60) NOT NULL DEFAULT '',
          influence VARCHAR(20) NOT NULL DEFAULT 'none',
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          INDEX idx_contact_company (company_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
      `);
      await pool.query(`
        CREATE TABLE IF NOT EXISTS crm_deals (
          id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
          organization_id INT UNSIGNED NOT NULL DEFAULT 0,
          company_id INT UNSIGNED NOT NULL,
          title VARCHAR(190) NOT NULL DEFAULT '',
          value INT UNSIGNED NOT NULL DEFAULT 0,
          stage VARCHAR(20) NOT NULL DEFAULT 'new',
          probability TINYINT UNSIGNED NULL,
          expected_close DATE NULL,
          owner VARCHAR(120) NOT NULL DEFAULT '',
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_deal_company (company_id),
          INDEX idx_deal_stage (stage)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
      `);
      await pool.query(`
        CREATE TABLE IF NOT EXISTS crm_activities (
          id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
          organization_id INT UNSIGNED NOT NULL DEFAULT 0,
          company_id INT UNSIGNED NOT NULL,
          contact_id INT UNSIGNED NULL,
          type VARCHAR(20) NOT NULL DEFAULT 'note',
          summary VARCHAR(500) NOT NULL DEFAULT '',
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          INDEX idx_activity_company (company_id, id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
      `);
      await pool.query(`
        CREATE TABLE IF NOT EXISTS crm_leads (
          id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
          organization_id INT UNSIGNED NOT NULL DEFAULT 0,
          name VARCHAR(190) NOT NULL DEFAULT '',
          company VARCHAR(190) NOT NULL DEFAULT '',
          title VARCHAR(120) NOT NULL DEFAULT '',
          email VARCHAR(190) NOT NULL DEFAULT '',
          phone VARCHAR(60) NOT NULL DEFAULT '',
          source VARCHAR(30) NOT NULL DEFAULT 'other',
          status VARCHAR(20) NOT NULL DEFAULT 'new',
          industry VARCHAR(120) NOT NULL DEFAULT '',
          website VARCHAR(300) NOT NULL DEFAULT '',
          employees INT UNSIGNED NULL,
          annual_value INT UNSIGNED NOT NULL DEFAULT 0,
          industry_match TINYINT(1) NOT NULL DEFAULT 0,
          lead_score TINYINT UNSIGNED NOT NULL DEFAULT 0,
          notes VARCHAR(500) NOT NULL DEFAULT '',
          converted_company_id INT UNSIGNED NULL,
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_lead_org (organization_id, lead_score),
          INDEX idx_lead_status (organization_id, status)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
      `);
      // Multi-tenancy: add organization_id to tables that predate it (existing
      // prod DB). New installs already have it from the CREATE statements above.
      await ensureColumn(pool, "crm_companies", "organization_id", "organization_id INT UNSIGNED NOT NULL DEFAULT 0");
      await ensureColumn(pool, "crm_contacts", "organization_id", "organization_id INT UNSIGNED NOT NULL DEFAULT 0");
      await ensureColumn(pool, "crm_deals", "organization_id", "organization_id INT UNSIGNED NOT NULL DEFAULT 0");
      await ensureColumn(pool, "crm_activities", "organization_id", "organization_id INT UNSIGNED NOT NULL DEFAULT 0");
      // Denormalised lead score (kept in sync by createCompany/updateCompany) so
      // the table can sort + paginate by it server-side.
      await ensureColumn(pool, "crm_companies", "lead_score", "lead_score TINYINT UNSIGNED NOT NULL DEFAULT 0");
    })().catch((err) => {
      globalForDb.__crmSchema = undefined;
      throw err;
    });
  }
  return globalForDb.__crmSchema;
}

// ---------------------------------------------------------------- row types

export interface CompanyRow extends mysql.RowDataPacket {
  id: number;
  name: string;
  industry: string;
  city: string;
  website: string;
  employees: number | null;
  annual_value: number;
  status: string;
  account_manager: string;
  industry_match: number;
  created_at: Date;
  updated_at: Date;
}
export interface ContactRow extends mysql.RowDataPacket {
  id: number;
  company_id: number;
  name: string;
  role: string;
  email: string;
  phone: string;
  department: string;
  influence: string;
  created_at: Date;
}
export interface DealRow extends mysql.RowDataPacket {
  id: number;
  company_id: number;
  title: string;
  value: number;
  stage: string;
  probability: number | null;
  expected_close: Date | null;
  owner: string;
  created_at: Date;
  updated_at: Date;
}
export interface ActivityRow extends mysql.RowDataPacket {
  id: number;
  company_id: number;
  contact_id: number | null;
  type: string;
  summary: string;
  created_at: Date;
}

// ---------------------------------------------------------------- companies

export interface CompanyInput {
  name: string;
  industry?: string;
  city?: string;
  website?: string;
  employees?: number | null;
  annualValue?: number;
  status?: string;
  accountManager?: string;
  industryMatch?: boolean;
}

/** The denormalised lead score for a company input — the one place it's
 *  computed on write, so the stored column can never drift from leadScore(). */
function scoreOf(c: CompanyInput): number {
  return leadScore({ hasWebsite: !!(c.website ?? "").trim(), employees: c.employees ?? null, industryMatch: !!c.industryMatch, annualValue: c.annualValue ?? 0 });
}

export async function createCompany(orgId: number, c: CompanyInput): Promise<number> {
  await ensureSchema();
  const [res] = await getPool().query<mysql.ResultSetHeader>(
    `INSERT INTO crm_companies (organization_id, name, industry, city, website, employees, annual_value, status, account_manager, industry_match, lead_score)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      orgId,
      c.name.slice(0, 190),
      (c.industry ?? "").slice(0, 120),
      (c.city ?? "").slice(0, 120),
      (c.website ?? "").slice(0, 300),
      c.employees ?? null,
      c.annualValue ?? 0,
      (c.status ?? "lead").slice(0, 20),
      (c.accountManager ?? "").slice(0, 120),
      c.industryMatch ? 1 : 0,
      scoreOf(c),
    ]
  );
  return res.insertId;
}

export async function listCompanies(orgId: number, opts: { q?: string; status?: string } = {}): Promise<CompanyRow[]> {
  await ensureSchema();
  const where: string[] = ["organization_id = ?"];
  const params: (string | number)[] = [orgId];
  if (opts.q) {
    where.push("(name LIKE ? OR industry LIKE ? OR city LIKE ?)");
    const like = `%${opts.q}%`;
    params.push(like, like, like);
  }
  if (opts.status) {
    where.push("status = ?");
    params.push(opts.status);
  }
  const [rows] = await getPool().query<CompanyRow[]>(
    `SELECT * FROM crm_companies WHERE ${where.join(" AND ")} ORDER BY updated_at DESC LIMIT 500`,
    params
  );
  return rows;
}

export async function getCompany(orgId: number, id: number): Promise<CompanyRow | null> {
  await ensureSchema();
  const [rows] = await getPool().query<CompanyRow[]>(
    "SELECT * FROM crm_companies WHERE id = ? AND organization_id = ? LIMIT 1",
    [id, orgId]
  );
  return rows[0] ?? null;
}

export async function updateCompany(orgId: number, id: number, c: CompanyInput): Promise<void> {
  await ensureSchema();
  await getPool().query(
    `UPDATE crm_companies SET name=?, industry=?, city=?, website=?, employees=?, annual_value=?, status=?, account_manager=?, industry_match=?, lead_score=? WHERE id=? AND organization_id=?`,
    [
      c.name.slice(0, 190),
      (c.industry ?? "").slice(0, 120),
      (c.city ?? "").slice(0, 120),
      (c.website ?? "").slice(0, 300),
      c.employees ?? null,
      c.annualValue ?? 0,
      (c.status ?? "lead").slice(0, 20),
      (c.accountManager ?? "").slice(0, 120),
      c.industryMatch ? 1 : 0,
      scoreOf(c),
      id,
      orgId,
    ]
  );
}

export async function deleteCompany(orgId: number, id: number): Promise<void> {
  await ensureSchema();
  const pool = getPool();
  await pool.query("DELETE FROM crm_activities WHERE company_id = ? AND organization_id = ?", [id, orgId]);
  await pool.query("DELETE FROM crm_deals WHERE company_id = ? AND organization_id = ?", [id, orgId]);
  await pool.query("DELETE FROM crm_contacts WHERE company_id = ? AND organization_id = ?", [id, orgId]);
  await pool.query("DELETE FROM crm_companies WHERE id = ? AND organization_id = ?", [id, orgId]);
}

export interface CompanyStatsRow extends CompanyRow {
  contacts: number;
  open_deals: number;
  open_value: number;
  last_activity: Date | null;
}

/** Companies + per-row aggregates for the table (contacts, open deals + value,
 *  last activity). Subqueries are fine at this scale (≤500 rows); server-side
 *  pagination is a scale-up item. */
export interface CompaniesPageResult {
  rows: CompanyStatsRow[];
  total: number;
  page: number;
  pageCount: number;
}

/** One page of companies + per-row aggregates, sorted and counted server-side.
 *  Sort is allowlisted (buildCompanyOrderBy). `health_rank` mirrors the health()
 *  heuristic in companies/page.tsx — keep the two buckets in sync. */
export async function listCompaniesPage(
  orgId: number,
  opts: { q?: string; status?: string; sortKey: string; sortDir: 1 | -1; page: number; pageSize: number }
): Promise<CompaniesPageResult> {
  await ensureSchema();
  const where: string[] = ["c.organization_id = ?"];
  const params: (string | number)[] = [orgId];
  if (opts.q) {
    where.push("(c.name LIKE ? OR c.industry LIKE ? OR c.city LIKE ?)");
    const like = `%${opts.q}%`;
    params.push(like, like, like);
  }
  if (opts.status) {
    where.push("c.status = ?");
    params.push(opts.status);
  }
  const whereSql = `WHERE ${where.join(" AND ")}`;
  const pool = getPool();

  const [countRows] = await pool.query<mysql.RowDataPacket[]>(`SELECT COUNT(*) AS n FROM crm_companies c ${whereSql}`, params);
  const total = Number(countRows[0]?.n ?? 0);
  const { offset, pageSize, page, pageCount } = pageBounds(opts.page, opts.pageSize, total);
  const orderBy = buildCompanyOrderBy(opts.sortKey, opts.sortDir);

  const [rows] = await pool.query<CompanyStatsRow[]>(
    `SELECT c.*,
       (SELECT COUNT(*) FROM crm_contacts ct WHERE ct.company_id = c.id) AS contacts,
       (SELECT COUNT(*) FROM crm_deals d WHERE d.company_id = c.id AND d.stage NOT IN ('won','lost')) AS open_deals,
       (SELECT COALESCE(SUM(d.value),0) FROM crm_deals d WHERE d.company_id = c.id AND d.stage NOT IN ('won','lost')) AS open_value,
       (SELECT MAX(a.created_at) FROM crm_activities a WHERE a.company_id = c.id) AS last_activity,
       (CASE
          WHEN (SELECT MAX(a.created_at) FROM crm_activities a WHERE a.company_id = c.id) IS NULL THEN 2
          WHEN (SELECT MAX(a.created_at) FROM crm_activities a WHERE a.company_id = c.id) < (NOW() - INTERVAL 30 DAY) THEN 0
          WHEN (SELECT COALESCE(SUM(d.value),0) FROM crm_deals d WHERE d.company_id = c.id AND d.stage NOT IN ('won','lost')) > 0
               AND (SELECT MAX(a.created_at) FROM crm_activities a WHERE a.company_id = c.id) >= (NOW() - INTERVAL 14 DAY) THEN 3
          ELSE 1
        END) AS health_rank
       FROM crm_companies c
       ${whereSql}
       ${orderBy}
       LIMIT ? OFFSET ?`,
    [...params, pageSize, offset]
  );
  return { rows, total, page, pageCount };
}

export async function bulkDeleteCompanies(orgId: number, ids: number[]): Promise<void> {
  const clean = ids.filter((n) => Number.isInteger(n)).slice(0, 500);
  if (!clean.length) return;
  await ensureSchema();
  const ph = clean.map(() => "?").join(",");
  const pool = getPool();
  await pool.query(`DELETE FROM crm_activities WHERE organization_id = ? AND company_id IN (${ph})`, [orgId, ...clean]);
  await pool.query(`DELETE FROM crm_deals WHERE organization_id = ? AND company_id IN (${ph})`, [orgId, ...clean]);
  await pool.query(`DELETE FROM crm_contacts WHERE organization_id = ? AND company_id IN (${ph})`, [orgId, ...clean]);
  await pool.query(`DELETE FROM crm_companies WHERE organization_id = ? AND id IN (${ph})`, [orgId, ...clean]);
}

export async function bulkSetCompanyStatus(orgId: number, ids: number[], status: string): Promise<void> {
  const clean = ids.filter((n) => Number.isInteger(n)).slice(0, 500);
  if (!clean.length) return;
  await ensureSchema();
  const ph = clean.map(() => "?").join(",");
  await getPool().query(`UPDATE crm_companies SET status = ? WHERE organization_id = ? AND id IN (${ph})`, [status.slice(0, 20), orgId, ...clean]);
}

// ----------------------------------------------------------------- contacts

export interface ContactInput {
  name: string;
  role?: string;
  email?: string;
  phone?: string;
  department?: string;
  influence?: string;
}

export async function addContact(orgId: number, companyId: number, c: ContactInput): Promise<number> {
  await ensureSchema();
  const [res] = await getPool().query<mysql.ResultSetHeader>(
    `INSERT INTO crm_contacts (organization_id, company_id, name, role, email, phone, department, influence) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      orgId,
      companyId,
      c.name.slice(0, 190),
      (c.role ?? "").slice(0, 120),
      (c.email ?? "").slice(0, 190),
      (c.phone ?? "").slice(0, 60),
      (c.department ?? "").slice(0, 60),
      (c.influence ?? "none").slice(0, 20),
    ]
  );
  return res.insertId;
}

export async function listContacts(orgId: number, companyId: number): Promise<ContactRow[]> {
  await ensureSchema();
  const [rows] = await getPool().query<ContactRow[]>(
    "SELECT * FROM crm_contacts WHERE company_id = ? AND organization_id = ? ORDER BY id ASC",
    [companyId, orgId]
  );
  return rows;
}

export async function deleteContact(orgId: number, id: number): Promise<void> {
  await ensureSchema();
  await getPool().query("DELETE FROM crm_contacts WHERE id = ? AND organization_id = ?", [id, orgId]);
}

export interface ContactStatsRow extends ContactRow {
  company_name: string;
}

export interface ContactsPageResult {
  rows: ContactStatsRow[];
  total: number;
  page: number;
  pageCount: number;
}

/** One page of the cross-company contacts directory, joined to the company,
 *  filtered/sorted/counted server-side. Sort is allowlisted (buildContactOrderBy). */
export async function listContactsPage(
  orgId: number,
  opts: { q?: string; influence?: string; sortKey: string; sortDir: 1 | -1; page: number; pageSize: number }
): Promise<ContactsPageResult> {
  await ensureSchema();
  const where: string[] = ["ct.organization_id = ?"];
  const params: (string | number)[] = [orgId];
  if (opts.q) {
    where.push("(ct.name LIKE ? OR ct.email LIKE ? OR ct.role LIKE ? OR co.name LIKE ?)");
    const like = `%${opts.q}%`;
    params.push(like, like, like, like);
  }
  if (opts.influence) {
    where.push("ct.influence = ?");
    params.push(opts.influence);
  }
  const joinSql = "FROM crm_contacts ct JOIN crm_companies co ON co.id = ct.company_id AND co.organization_id = ct.organization_id";
  const whereSql = `WHERE ${where.join(" AND ")}`;
  const pool = getPool();

  const [countRows] = await pool.query<mysql.RowDataPacket[]>(`SELECT COUNT(*) AS n ${joinSql} ${whereSql}`, params);
  const total = Number(countRows[0]?.n ?? 0);
  const { offset, pageSize, page, pageCount } = pageBounds(opts.page, opts.pageSize, total);
  const orderBy = buildContactOrderBy(opts.sortKey, opts.sortDir);

  const [rows] = await pool.query<ContactStatsRow[]>(
    `SELECT ct.*, co.name AS company_name ${joinSql} ${whereSql} ${orderBy} LIMIT ? OFFSET ?`,
    [...params, pageSize, offset]
  );
  return { rows, total, page, pageCount };
}

// -------------------------------------------------------------------- deals

export interface DealInput {
  title: string;
  value?: number;
  stage?: string;
  probability?: number | null;
  expectedClose?: string | null;
  owner?: string;
}

export async function createDeal(orgId: number, companyId: number, d: DealInput): Promise<number> {
  await ensureSchema();
  const [res] = await getPool().query<mysql.ResultSetHeader>(
    `INSERT INTO crm_deals (organization_id, company_id, title, value, stage, probability, expected_close, owner) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      orgId,
      companyId,
      d.title.slice(0, 190),
      d.value ?? 0,
      (d.stage ?? "new").slice(0, 20),
      d.probability ?? null,
      d.expectedClose || null,
      (d.owner ?? "").slice(0, 120),
    ]
  );
  return res.insertId;
}

export async function listDeals(orgId: number, opts: { companyId?: number } = {}): Promise<DealRow[]> {
  await ensureSchema();
  if (opts.companyId != null) {
    const [rows] = await getPool().query<DealRow[]>(
      "SELECT * FROM crm_deals WHERE organization_id = ? AND company_id = ? ORDER BY updated_at DESC",
      [orgId, opts.companyId]
    );
    return rows;
  }
  const [rows] = await getPool().query<DealRow[]>(
    "SELECT * FROM crm_deals WHERE organization_id = ? ORDER BY updated_at DESC LIMIT 1000",
    [orgId]
  );
  return rows;
}

export async function updateDeal(
  orgId: number,
  id: number,
  patch: { title?: string; value?: number; stage?: string; probability?: number | null; expectedClose?: string | null; owner?: string }
): Promise<void> {
  await ensureSchema();
  const sets: string[] = [];
  const vals: (string | number | null)[] = [];
  if (patch.title !== undefined) { sets.push("title=?"); vals.push(patch.title.slice(0, 190)); }
  if (patch.value !== undefined) { sets.push("value=?"); vals.push(patch.value); }
  if (patch.stage !== undefined) { sets.push("stage=?"); vals.push(patch.stage.slice(0, 20)); }
  if (patch.probability !== undefined) { sets.push("probability=?"); vals.push(patch.probability); }
  if (patch.expectedClose !== undefined) { sets.push("expected_close=?"); vals.push(patch.expectedClose || null); }
  if (patch.owner !== undefined) { sets.push("owner=?"); vals.push(patch.owner.slice(0, 120)); }
  if (!sets.length) return;
  vals.push(id, orgId);
  await getPool().query(`UPDATE crm_deals SET ${sets.join(", ")} WHERE id = ? AND organization_id = ?`, vals);
}

export async function deleteDeal(orgId: number, id: number): Promise<void> {
  await ensureSchema();
  await getPool().query("DELETE FROM crm_deals WHERE id = ? AND organization_id = ?", [id, orgId]);
}

// --------------------------------------------------------------- activities

export interface ActivityInput {
  companyId: number;
  contactId?: number | null;
  type?: string;
  summary: string;
}

export async function addActivity(orgId: number, a: ActivityInput): Promise<number> {
  await ensureSchema();
  const [res] = await getPool().query<mysql.ResultSetHeader>(
    `INSERT INTO crm_activities (organization_id, company_id, contact_id, type, summary) VALUES (?, ?, ?, ?, ?)`,
    [orgId, a.companyId, a.contactId ?? null, (a.type ?? "note").slice(0, 20), a.summary.slice(0, 500)]
  );
  return res.insertId;
}

export async function listActivities(orgId: number, companyId: number, limit = 50): Promise<ActivityRow[]> {
  await ensureSchema();
  const [rows] = await getPool().query<ActivityRow[]>(
    "SELECT * FROM crm_activities WHERE company_id = ? AND organization_id = ? ORDER BY id DESC LIMIT ?",
    [companyId, orgId, limit]
  );
  return rows;
}

// -------------------------------------------------------------------- leads

export interface LeadRow extends mysql.RowDataPacket {
  id: number;
  organization_id: number;
  name: string;
  company: string;
  title: string;
  email: string;
  phone: string;
  source: string;
  status: string;
  industry: string;
  website: string;
  employees: number | null;
  annual_value: number;
  industry_match: number;
  lead_score: number;
  notes: string;
  converted_company_id: number | null;
  created_at: Date;
  updated_at: Date;
}

export interface LeadInput {
  name: string;
  company?: string;
  title?: string;
  email?: string;
  phone?: string;
  source?: string;
  status?: string;
  industry?: string;
  website?: string;
  employees?: number | null;
  industryMatch?: boolean;
  annualValue?: number;
  notes?: string;
}

function leadScoreOf(l: { website?: string; employees?: number | null; industryMatch?: boolean; annualValue?: number }): number {
  return leadScore({ hasWebsite: !!(l.website ?? "").trim(), employees: l.employees ?? null, industryMatch: !!l.industryMatch, annualValue: l.annualValue ?? 0 });
}

export async function createLead(orgId: number, l: LeadInput): Promise<number> {
  await ensureSchema();
  const [res] = await getPool().query<mysql.ResultSetHeader>(
    `INSERT INTO crm_leads (organization_id, name, company, title, email, phone, source, status, industry, website, employees, annual_value, industry_match, lead_score, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      orgId,
      l.name.slice(0, 190),
      (l.company ?? "").slice(0, 190),
      (l.title ?? "").slice(0, 120),
      (l.email ?? "").slice(0, 190),
      (l.phone ?? "").slice(0, 60),
      (l.source ?? "other").slice(0, 30),
      (l.status ?? "new").slice(0, 20),
      (l.industry ?? "").slice(0, 120),
      (l.website ?? "").slice(0, 300),
      l.employees ?? null,
      l.annualValue ?? 0,
      l.industryMatch ? 1 : 0,
      leadScoreOf(l),
      (l.notes ?? "").slice(0, 500),
    ]
  );
  return res.insertId;
}

export interface LeadsPageResult {
  rows: LeadRow[];
  total: number;
  page: number;
  pageCount: number;
}

export async function listLeadsPage(
  orgId: number,
  opts: { q?: string; status?: string; source?: string; sortKey: string; sortDir: 1 | -1; page: number; pageSize: number }
): Promise<LeadsPageResult> {
  await ensureSchema();
  const where: string[] = ["l.organization_id = ?"];
  const params: (string | number)[] = [orgId];
  if (opts.q) {
    where.push("(l.name LIKE ? OR l.company LIKE ? OR l.email LIKE ?)");
    const like = `%${opts.q}%`;
    params.push(like, like, like);
  }
  if (opts.status) {
    where.push("l.status = ?");
    params.push(opts.status);
  }
  if (opts.source) {
    where.push("l.source = ?");
    params.push(opts.source);
  }
  const whereSql = `WHERE ${where.join(" AND ")}`;
  const pool = getPool();

  const [countRows] = await pool.query<mysql.RowDataPacket[]>(`SELECT COUNT(*) AS n FROM crm_leads l ${whereSql}`, params);
  const total = Number(countRows[0]?.n ?? 0);
  const { offset, pageSize, page, pageCount } = pageBounds(opts.page, opts.pageSize, total);
  const orderBy = buildLeadOrderBy(opts.sortKey, opts.sortDir);

  const [rows] = await pool.query<LeadRow[]>(`SELECT l.* FROM crm_leads l ${whereSql} ${orderBy} LIMIT ? OFFSET ?`, [...params, pageSize, offset]);
  return { rows, total, page, pageCount };
}

export async function setLeadStatus(orgId: number, id: number, status: string): Promise<void> {
  await ensureSchema();
  await getPool().query("UPDATE crm_leads SET status = ? WHERE id = ? AND organization_id = ?", [status.slice(0, 20), id, orgId]);
}

export async function deleteLead(orgId: number, id: number): Promise<void> {
  await ensureSchema();
  await getPool().query("DELETE FROM crm_leads WHERE id = ? AND organization_id = ?", [id, orgId]);
}

/** Convert a lead into a company (+ a contact if it has a person), atomically.
 *  Returns the new (or already-converted) company id, or null if not found. */
export async function convertLead(orgId: number, id: number): Promise<number | null> {
  await ensureSchema();
  const conn = await getPool().getConnection();
  try {
    await conn.beginTransaction();
    const [leadRows] = await conn.query<LeadRow[]>("SELECT * FROM crm_leads WHERE id = ? AND organization_id = ? FOR UPDATE", [id, orgId]);
    const lead = leadRows[0];
    if (!lead) {
      await conn.rollback();
      return null;
    }
    if (lead.converted_company_id) {
      await conn.commit();
      return lead.converted_company_id;
    }

    const score = leadScoreOf({ website: lead.website, employees: lead.employees, industryMatch: !!lead.industry_match, annualValue: lead.annual_value });
    const [companyRes] = await conn.query<mysql.ResultSetHeader>(
      `INSERT INTO crm_companies (organization_id, name, industry, city, website, employees, annual_value, status, account_manager, industry_match, lead_score)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'active', '', ?, ?)`,
      [orgId, (lead.company || lead.name).slice(0, 190), lead.industry.slice(0, 120), "", lead.website.slice(0, 300), lead.employees, lead.annual_value, lead.industry_match, score]
    );
    const companyId = companyRes.insertId;

    if (lead.name.trim()) {
      await conn.query(
        `INSERT INTO crm_contacts (organization_id, company_id, name, role, email, phone, department, influence)
           VALUES (?, ?, ?, ?, ?, ?, '', 'none')`,
        [orgId, companyId, lead.name.slice(0, 190), lead.title.slice(0, 120), lead.email.slice(0, 190), lead.phone.slice(0, 60)]
      );
    }

    await conn.query("UPDATE crm_leads SET status = 'converted', converted_company_id = ? WHERE id = ? AND organization_id = ?", [companyId, id, orgId]);
    await conn.commit();
    return companyId;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

// ====================================================================
// Auth & tenancy storage (organizations, users, sessions)
//
// Kept in its OWN memoised init, isolated from the CRM schema: a fresh process
// (every deploy restarts Passenger) re-runs these CREATE IF NOT EXISTS, and an
// issue in one schema half never blocks the other. Passwords are hashed by
// lib/auth/password; sessions store only the SHA-256 of the token.
// ====================================================================

export function ensureAuthSchema(): Promise<void> {
  if (!globalForDb.__crmAuthSchema) {
    globalForDb.__crmAuthSchema = (async () => {
      const pool = getPool();
      await pool.query(`
        CREATE TABLE IF NOT EXISTS crm_organizations (
          id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(190) NOT NULL DEFAULT '',
          slug VARCHAR(120) NOT NULL DEFAULT '',
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          UNIQUE KEY uq_org_slug (slug)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
      `);
      await pool.query(`
        CREATE TABLE IF NOT EXISTS crm_users (
          id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
          organization_id INT UNSIGNED NOT NULL,
          email VARCHAR(190) NOT NULL,
          name VARCHAR(190) NOT NULL DEFAULT '',
          password_hash VARCHAR(255) NOT NULL DEFAULT '',
          role VARCHAR(20) NOT NULL DEFAULT 'member',
          status VARCHAR(20) NOT NULL DEFAULT 'active',
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          last_login_at TIMESTAMP NULL,
          UNIQUE KEY uq_user_email (email),
          INDEX idx_user_org (organization_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
      `);
      await pool.query(`
        CREATE TABLE IF NOT EXISTS crm_sessions (
          id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
          user_id INT UNSIGNED NOT NULL,
          organization_id INT UNSIGNED NOT NULL,
          token_hash CHAR(64) NOT NULL,
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          expires_at TIMESTAMP NOT NULL,
          UNIQUE KEY uq_session_token (token_hash),
          INDEX idx_session_user (user_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
      `);
      await pool.query(`
        CREATE TABLE IF NOT EXISTS crm_audit_logs (
          id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
          organization_id INT UNSIGNED NOT NULL,
          user_id INT UNSIGNED NULL,
          actor_email VARCHAR(190) NOT NULL DEFAULT '',
          action VARCHAR(40) NOT NULL DEFAULT '',
          entity VARCHAR(40) NOT NULL DEFAULT '',
          entity_id INT UNSIGNED NULL,
          summary VARCHAR(255) NOT NULL DEFAULT '',
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          INDEX idx_audit_org (organization_id, id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
      `);
    })().catch((err) => {
      globalForDb.__crmAuthSchema = undefined;
      throw err;
    });
  }
  return globalForDb.__crmAuthSchema;
}

export interface OrganizationRow extends mysql.RowDataPacket {
  id: number;
  name: string;
  slug: string;
  created_at: Date;
}
export interface UserRow extends mysql.RowDataPacket {
  id: number;
  organization_id: number;
  email: string;
  name: string;
  password_hash: string;
  role: string;
  status: string;
  created_at: Date;
  last_login_at: Date | null;
}
export interface SessionRow extends mysql.RowDataPacket {
  id: number;
  user_id: number;
  organization_id: number;
  token_hash: string;
  created_at: Date;
  expires_at: Date;
}

// -------- organizations & users

export async function countUsers(): Promise<number> {
  await ensureAuthSchema();
  const [rows] = await getPool().query<mysql.RowDataPacket[]>("SELECT COUNT(*) AS n FROM crm_users");
  return Number(rows[0]?.n ?? 0);
}

export async function createOrganization(name: string, slug: string): Promise<number> {
  await ensureAuthSchema();
  const [res] = await getPool().query<mysql.ResultSetHeader>(
    "INSERT INTO crm_organizations (name, slug) VALUES (?, ?)",
    [name.slice(0, 190), slug.slice(0, 120)]
  );
  return res.insertId;
}

export interface NewUser {
  organizationId: number;
  email: string;
  name?: string;
  passwordHash: string;
  role?: string;
}

export async function createUser(u: NewUser): Promise<number> {
  await ensureAuthSchema();
  const [res] = await getPool().query<mysql.ResultSetHeader>(
    "INSERT INTO crm_users (organization_id, email, name, password_hash, role) VALUES (?, ?, ?, ?, ?)",
    [u.organizationId, u.email.toLowerCase().slice(0, 190), (u.name ?? "").slice(0, 190), u.passwordHash.slice(0, 255), (u.role ?? "member").slice(0, 20)]
  );
  return res.insertId;
}

export async function getUserByEmail(email: string): Promise<UserRow | null> {
  await ensureAuthSchema();
  const [rows] = await getPool().query<UserRow[]>(
    "SELECT * FROM crm_users WHERE email = ? AND status = 'active' LIMIT 1",
    [email.toLowerCase()]
  );
  return rows[0] ?? null;
}

export async function getUserById(id: number): Promise<UserRow | null> {
  await ensureAuthSchema();
  const [rows] = await getPool().query<UserRow[]>("SELECT * FROM crm_users WHERE id = ? LIMIT 1", [id]);
  return rows[0] ?? null;
}

export async function setUserLastLogin(id: number): Promise<void> {
  await ensureAuthSchema();
  await getPool().query("UPDATE crm_users SET last_login_at = CURRENT_TIMESTAMP WHERE id = ?", [id]);
}

export async function listUsers(orgId: number): Promise<UserRow[]> {
  await ensureAuthSchema();
  const [rows] = await getPool().query<UserRow[]>(
    "SELECT * FROM crm_users WHERE organization_id = ? ORDER BY created_at ASC",
    [orgId]
  );
  return rows;
}

/** Active owners in an org — used to refuse demoting/disabling the last one. */
export async function countActiveOwners(orgId: number): Promise<number> {
  await ensureAuthSchema();
  const [rows] = await getPool().query<mysql.RowDataPacket[]>(
    "SELECT COUNT(*) AS n FROM crm_users WHERE organization_id = ? AND role = 'owner' AND status = 'active'",
    [orgId]
  );
  return Number(rows[0]?.n ?? 0);
}

export async function updateUserRole(orgId: number, userId: number, role: string): Promise<void> {
  await ensureAuthSchema();
  await getPool().query("UPDATE crm_users SET role = ? WHERE id = ? AND organization_id = ?", [role.slice(0, 20), userId, orgId]);
}

export async function setUserStatus(orgId: number, userId: number, status: string): Promise<void> {
  await ensureAuthSchema();
  await getPool().query("UPDATE crm_users SET status = ? WHERE id = ? AND organization_id = ?", [status.slice(0, 20), userId, orgId]);
}

// -------- sessions

export interface NewSession {
  userId: number;
  organizationId: number;
  tokenHash: string;
  expiresAt: Date;
}

export async function createSession(s: NewSession): Promise<void> {
  await ensureAuthSchema();
  await getPool().query(
    "INSERT INTO crm_sessions (user_id, organization_id, token_hash, expires_at) VALUES (?, ?, ?, ?)",
    [s.userId, s.organizationId, s.tokenHash, s.expiresAt]
  );
}

export async function getSessionByTokenHash(tokenHash: string): Promise<SessionRow | null> {
  await ensureAuthSchema();
  const [rows] = await getPool().query<SessionRow[]>(
    "SELECT * FROM crm_sessions WHERE token_hash = ? AND expires_at > CURRENT_TIMESTAMP LIMIT 1",
    [tokenHash]
  );
  return rows[0] ?? null;
}

export async function deleteSessionByTokenHash(tokenHash: string): Promise<void> {
  await ensureAuthSchema();
  await getPool().query("DELETE FROM crm_sessions WHERE token_hash = ?", [tokenHash]);
}

export async function deleteExpiredSessions(): Promise<void> {
  await ensureAuthSchema();
  await getPool().query("DELETE FROM crm_sessions WHERE expires_at <= CURRENT_TIMESTAMP");
}

// -------- audit log

export interface AuditRow extends mysql.RowDataPacket {
  id: number;
  organization_id: number;
  user_id: number | null;
  actor_email: string;
  action: string;
  entity: string;
  entity_id: number | null;
  summary: string;
  created_at: Date;
}

export interface AuditEntry {
  organizationId: number;
  userId: number | null;
  actorEmail: string;
  action: string;
  entity: string;
  entityId?: number | null;
  summary?: string;
}

export async function writeAudit(e: AuditEntry): Promise<void> {
  await ensureAuthSchema();
  await getPool().query(
    "INSERT INTO crm_audit_logs (organization_id, user_id, actor_email, action, entity, entity_id, summary) VALUES (?, ?, ?, ?, ?, ?, ?)",
    [e.organizationId, e.userId, e.actorEmail.slice(0, 190), e.action.slice(0, 40), e.entity.slice(0, 40), e.entityId ?? null, (e.summary ?? "").slice(0, 255)]
  );
}

export async function listAuditLogs(orgId: number, limit = 100): Promise<AuditRow[]> {
  await ensureAuthSchema();
  const [rows] = await getPool().query<AuditRow[]>(
    "SELECT * FROM crm_audit_logs WHERE organization_id = ? ORDER BY id DESC LIMIT ?",
    [orgId, limit]
  );
  return rows;
}
