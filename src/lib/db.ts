import "server-only";
import mysql from "mysql2/promise";
import { leadScore } from "@/lib/crm/pipeline";
import { buildCompanyOrderBy, pageBounds } from "@/lib/crm/company-query";
import { buildContactOrderBy } from "@/lib/crm/contact-query";
import { buildLeadOrderBy } from "@/lib/crm/leads";
import { buildDealOrderBy } from "@/lib/crm/deal-query";
import { buildTaskOrderBy } from "@/lib/crm/tasks";
import { buildActivityOrderBy } from "@/lib/crm/activities";
import { buildProductOrderBy } from "@/lib/crm/products";
import { buildQuoteOrderBy } from "@/lib/crm/quotes";

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
      await pool.query(`
        CREATE TABLE IF NOT EXISTS crm_tasks (
          id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
          organization_id INT UNSIGNED NOT NULL DEFAULT 0,
          company_id INT UNSIGNED NULL,
          title VARCHAR(300) NOT NULL DEFAULT '',
          notes VARCHAR(500) NOT NULL DEFAULT '',
          due_date DATE NULL,
          priority VARCHAR(10) NOT NULL DEFAULT 'normal',
          done TINYINT(1) NOT NULL DEFAULT 0,
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_task_org (organization_id, done, due_date)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
      `);
      await pool.query(`
        CREATE TABLE IF NOT EXISTS crm_products (
          id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
          organization_id INT UNSIGNED NOT NULL DEFAULT 0,
          name VARCHAR(190) NOT NULL DEFAULT '',
          sku VARCHAR(60) NOT NULL DEFAULT '',
          description VARCHAR(500) NOT NULL DEFAULT '',
          price_cents INT UNSIGNED NOT NULL DEFAULT 0,
          billing VARCHAR(20) NOT NULL DEFAULT 'onetime',
          active TINYINT(1) NOT NULL DEFAULT 1,
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_product_org (organization_id, name)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
      `);
      await pool.query(`
        CREATE TABLE IF NOT EXISTS crm_quotes (
          id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
          organization_id INT UNSIGNED NOT NULL DEFAULT 0,
          company_id INT UNSIGNED NOT NULL,
          status VARCHAR(20) NOT NULL DEFAULT 'draft',
          notes VARCHAR(500) NOT NULL DEFAULT '',
          valid_until DATE NULL,
          total_cents INT UNSIGNED NOT NULL DEFAULT 0,
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_quote_org (organization_id, status),
          INDEX idx_quote_company (company_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
      `);
      await pool.query(`
        CREATE TABLE IF NOT EXISTS crm_quote_items (
          id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
          organization_id INT UNSIGNED NOT NULL DEFAULT 0,
          quote_id INT UNSIGNED NOT NULL,
          product_id INT UNSIGNED NULL,
          name VARCHAR(190) NOT NULL DEFAULT '',
          unit_price_cents INT UNSIGNED NOT NULL DEFAULT 0,
          quantity INT UNSIGNED NOT NULL DEFAULT 1,
          line_total_cents INT UNSIGNED NOT NULL DEFAULT 0,
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          INDEX idx_qitem_quote (quote_id, id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
      `);
      await pool.query(`
        CREATE TABLE IF NOT EXISTS crm_automations (
          id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
          organization_id INT UNSIGNED NOT NULL DEFAULT 0,
          template_key VARCHAR(40) NOT NULL DEFAULT '',
          name VARCHAR(190) NOT NULL DEFAULT '',
          params TEXT NULL,
          enabled TINYINT(1) NOT NULL DEFAULT 1,
          last_run_at TIMESTAMP NULL,
          created_count INT UNSIGNED NOT NULL DEFAULT 0,
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_automation_org (organization_id, enabled)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
      `);
      await pool.query(`
        CREATE TABLE IF NOT EXISTS crm_automation_runs (
          id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
          organization_id INT UNSIGNED NOT NULL DEFAULT 0,
          automation_id INT UNSIGNED NOT NULL,
          created_count INT UNSIGNED NOT NULL DEFAULT 0,
          summary VARCHAR(255) NOT NULL DEFAULT '',
          ran_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          INDEX idx_arun_org (organization_id, id)
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
      // Contact detail fields (Phase 1A — surfaced on the contact profile).
      await ensureColumn(pool, "crm_contacts", "mobile", "mobile VARCHAR(40) NOT NULL DEFAULT ''");
      await ensureColumn(pool, "crm_contacts", "linkedin", "linkedin VARCHAR(200) NOT NULL DEFAULT ''");
      await ensureColumn(pool, "crm_contacts", "notes", "notes TEXT NULL");
      // Company account fields (Phase 1B — descriptive; patched via updateCompanyDetails,
      // isolated from the scoring/status path so lead_score never recomputes off them).
      await ensureColumn(pool, "crm_companies", "legal_name", "legal_name VARCHAR(190) NOT NULL DEFAULT ''");
      await ensureColumn(pool, "crm_companies", "phone", "phone VARCHAR(60) NOT NULL DEFAULT ''");
      await ensureColumn(pool, "crm_companies", "email", "email VARCHAR(190) NOT NULL DEFAULT ''");
      await ensureColumn(pool, "crm_companies", "country", "country VARCHAR(120) NOT NULL DEFAULT ''");
      await ensureColumn(pool, "crm_companies", "address", "address VARCHAR(300) NOT NULL DEFAULT ''");
      await ensureColumn(pool, "crm_companies", "vat_id", "vat_id VARCHAR(40) NOT NULL DEFAULT ''");
      await ensureColumn(pool, "crm_companies", "description", "description TEXT NULL");
      // Lead management fields (Phase 2A — priority + owner on the lead profile).
      await ensureColumn(pool, "crm_leads", "priority", "priority VARCHAR(12) NOT NULL DEFAULT 'normal'");
      await ensureColumn(pool, "crm_leads", "owner", "owner VARCHAR(120) NOT NULL DEFAULT ''");
      // Deal fields (Phase 3A — primary contact + notes on the deal profile).
      await ensureColumn(pool, "crm_deals", "contact_id", "contact_id INT UNSIGNED NULL");
      await ensureColumn(pool, "crm_deals", "notes", "notes TEXT NULL");
      // Deal-scoped activities (Phase 3A — a deal's own timeline).
      await ensureColumn(pool, "crm_activities", "deal_id", "deal_id INT UNSIGNED NULL");
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
  legal_name: string;
  phone: string;
  email: string;
  country: string;
  address: string;
  vat_id: string;
  description: string | null;
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
  mobile: string;
  linkedin: string;
  notes: string | null;
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
  contact_id: number | null;
  notes: string | null;
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

export interface CompanyDetailsInput {
  legalName: string;
  phone: string;
  email: string;
  country: string;
  address: string;
  vatId: string;
  description: string;
}

/** Patches only the descriptive account fields — deliberately separate from
 *  updateCompany so it never touches status or recomputes lead_score. */
export async function updateCompanyDetails(orgId: number, id: number, d: CompanyDetailsInput): Promise<void> {
  await ensureSchema();
  await getPool().query(
    `UPDATE crm_companies SET legal_name=?, phone=?, email=?, country=?, address=?, vat_id=?, description=? WHERE id=? AND organization_id=?`,
    [
      d.legalName.slice(0, 190),
      d.phone.slice(0, 60),
      d.email.slice(0, 190),
      d.country.slice(0, 120),
      d.address.slice(0, 300),
      d.vatId.slice(0, 40),
      (d.description ?? "").slice(0, 2000),
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
  opts: { q?: string; status?: string; statuses?: string[]; sortKey: string; sortDir: 1 | -1; page: number; pageSize: number }
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
  if (opts.statuses && opts.statuses.length) {
    where.push(`c.status IN (${opts.statuses.map(() => "?").join(", ")})`);
    params.push(...opts.statuses);
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

export interface CustomerStats {
  customers: number;
  atRisk: number;
  arr: number;
  won: number;
}

/** Aggregates for the Customers header: active + at-risk counts, recurring
 *  annual value of the base, and total won revenue. */
export async function customerStats(orgId: number): Promise<CustomerStats> {
  await ensureSchema();
  const pool = getPool();
  const [c] = await pool.query<mysql.RowDataPacket[]>(
    `SELECT
       COALESCE(SUM(status = 'customer'), 0) AS customers,
       COALESCE(SUM(status = 'at_risk'), 0) AS at_risk,
       COALESCE(SUM(CASE WHEN status IN ('customer', 'at_risk') THEN annual_value ELSE 0 END), 0) AS arr
     FROM crm_companies WHERE organization_id = ?`,
    [orgId]
  );
  const [d] = await pool.query<mysql.RowDataPacket[]>(
    `SELECT COALESCE(SUM(value), 0) AS won FROM crm_deals WHERE organization_id = ? AND stage = 'won'`,
    [orgId]
  );
  return {
    customers: Number(c[0]?.customers ?? 0),
    atRisk: Number(c[0]?.at_risk ?? 0),
    arr: Number(c[0]?.arr ?? 0),
    won: Number(d[0]?.won ?? 0),
  };
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
  mobile?: string;
  linkedin?: string;
  notes?: string;
}

export async function addContact(orgId: number, companyId: number, c: ContactInput): Promise<number> {
  await ensureSchema();
  const [res] = await getPool().query<mysql.ResultSetHeader>(
    `INSERT INTO crm_contacts (organization_id, company_id, name, role, email, phone, department, influence, mobile, linkedin, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      orgId,
      companyId,
      c.name.slice(0, 190),
      (c.role ?? "").slice(0, 120),
      (c.email ?? "").slice(0, 190),
      (c.phone ?? "").slice(0, 60),
      (c.department ?? "").slice(0, 60),
      (c.influence ?? "none").slice(0, 20),
      (c.mobile ?? "").slice(0, 40),
      (c.linkedin ?? "").slice(0, 200),
      (c.notes ?? "").slice(0, 2000),
    ]
  );
  return res.insertId;
}

/** One contact joined to its company name — for the contact profile. Org-scoped. */
export interface ContactWithCompanyRow extends ContactRow {
  company_name: string;
}
export async function getContact(orgId: number, id: number): Promise<ContactWithCompanyRow | null> {
  await ensureSchema();
  const [rows] = await getPool().query<ContactWithCompanyRow[]>(
    `SELECT ct.*, COALESCE(co.name, '') AS company_name
       FROM crm_contacts ct
       LEFT JOIN crm_companies co ON co.id = ct.company_id AND co.organization_id = ct.organization_id
      WHERE ct.id = ? AND ct.organization_id = ? LIMIT 1`,
    [id, orgId]
  );
  return rows[0] ?? null;
}

export async function updateContact(orgId: number, id: number, c: ContactInput): Promise<void> {
  await ensureSchema();
  await getPool().query(
    `UPDATE crm_contacts SET name=?, role=?, email=?, phone=?, department=?, influence=?, mobile=?, linkedin=?, notes=?
       WHERE id=? AND organization_id=?`,
    [
      c.name.slice(0, 190),
      (c.role ?? "").slice(0, 120),
      (c.email ?? "").slice(0, 190),
      (c.phone ?? "").slice(0, 60),
      (c.department ?? "").slice(0, 60),
      (c.influence ?? "none").slice(0, 20),
      (c.mobile ?? "").slice(0, 40),
      (c.linkedin ?? "").slice(0, 200),
      (c.notes ?? "").slice(0, 2000),
      id,
      orgId,
    ]
  );
}

/** Activities logged against a specific contact (their own timeline). Org-scoped. */
export async function listContactActivities(orgId: number, contactId: number, limit = 50): Promise<ActivityRow[]> {
  await ensureSchema();
  const [rows] = await getPool().query<ActivityRow[]>(
    "SELECT * FROM crm_activities WHERE contact_id = ? AND organization_id = ? ORDER BY id DESC LIMIT ?",
    [contactId, orgId, limit]
  );
  return rows;
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
  contactId?: number | null;
  notes?: string;
}

export async function createDeal(orgId: number, companyId: number, d: DealInput): Promise<number> {
  await ensureSchema();
  const [res] = await getPool().query<mysql.ResultSetHeader>(
    `INSERT INTO crm_deals (organization_id, company_id, title, value, stage, probability, expected_close, owner, contact_id, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      orgId,
      companyId,
      d.title.slice(0, 190),
      d.value ?? 0,
      (d.stage ?? "new").slice(0, 20),
      d.probability ?? null,
      d.expectedClose || null,
      (d.owner ?? "").slice(0, 120),
      d.contactId ?? null,
      (d.notes ?? "").slice(0, 2000),
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
  patch: { title?: string; value?: number; stage?: string; probability?: number | null; expectedClose?: string | null; owner?: string; contactId?: number | null; notes?: string }
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
  if (patch.contactId !== undefined) { sets.push("contact_id=?"); vals.push(patch.contactId ?? null); }
  if (patch.notes !== undefined) { sets.push("notes=?"); vals.push((patch.notes ?? "").slice(0, 2000)); }
  if (!sets.length) return;
  vals.push(id, orgId);
  await getPool().query(`UPDATE crm_deals SET ${sets.join(", ")} WHERE id = ? AND organization_id = ?`, vals);
}

/** One deal joined to its company + (optional) primary-contact name, for the
 *  deal profile. Org-scoped. */
export interface DealWithRefsRow extends DealRow {
  company_name: string;
  contact_name: string | null;
}
export async function getDeal(orgId: number, id: number): Promise<DealWithRefsRow | null> {
  await ensureSchema();
  const [rows] = await getPool().query<DealWithRefsRow[]>(
    `SELECT d.*, COALESCE(co.name, '') AS company_name, ct.name AS contact_name
       FROM crm_deals d
       LEFT JOIN crm_companies co ON co.id = d.company_id AND co.organization_id = d.organization_id
       LEFT JOIN crm_contacts ct ON ct.id = d.contact_id AND ct.organization_id = d.organization_id
      WHERE d.id = ? AND d.organization_id = ? LIMIT 1`,
    [id, orgId]
  );
  return rows[0] ?? null;
}

/** Activities logged against a specific deal (its own timeline). Org-scoped. */
export async function listDealActivities(orgId: number, dealId: number, limit = 50): Promise<ActivityRow[]> {
  await ensureSchema();
  const [rows] = await getPool().query<ActivityRow[]>(
    "SELECT * FROM crm_activities WHERE deal_id = ? AND organization_id = ? ORDER BY id DESC LIMIT ?",
    [dealId, orgId, limit]
  );
  return rows;
}

/** Deals whose primary contact is this person — for the contact profile. */
export async function listDealsForContact(orgId: number, contactId: number): Promise<DealRow[]> {
  await ensureSchema();
  const [rows] = await getPool().query<DealRow[]>(
    "SELECT * FROM crm_deals WHERE contact_id = ? AND organization_id = ? ORDER BY updated_at DESC LIMIT 50",
    [contactId, orgId]
  );
  return rows;
}

export async function deleteDeal(orgId: number, id: number): Promise<void> {
  await ensureSchema();
  await getPool().query("DELETE FROM crm_deals WHERE id = ? AND organization_id = ?", [id, orgId]);
}

export interface DealStatsRow extends DealRow {
  company_name: string;
}

export interface DealsPageResult {
  rows: DealStatsRow[];
  total: number;
  page: number;
  pageCount: number;
}

/** One page of the cross-company deals list, joined to the company, filtered/
 *  sorted/counted server-side. Sort is allowlisted (buildDealOrderBy). */
export async function listDealsPage(
  orgId: number,
  opts: { q?: string; stage?: string; sortKey: string; sortDir: 1 | -1; page: number; pageSize: number }
): Promise<DealsPageResult> {
  await ensureSchema();
  const where: string[] = ["d.organization_id = ?"];
  const params: (string | number)[] = [orgId];
  if (opts.q) {
    where.push("(d.title LIKE ? OR co.name LIKE ?)");
    const like = `%${opts.q}%`;
    params.push(like, like);
  }
  if (opts.stage) {
    where.push("d.stage = ?");
    params.push(opts.stage);
  }
  const joinSql = "FROM crm_deals d JOIN crm_companies co ON co.id = d.company_id AND co.organization_id = d.organization_id";
  const whereSql = `WHERE ${where.join(" AND ")}`;
  const pool = getPool();

  const [countRows] = await pool.query<mysql.RowDataPacket[]>(`SELECT COUNT(*) AS n ${joinSql} ${whereSql}`, params);
  const total = Number(countRows[0]?.n ?? 0);
  const { offset, pageSize, page, pageCount } = pageBounds(opts.page, opts.pageSize, total);
  const orderBy = buildDealOrderBy(opts.sortKey, opts.sortDir);

  const [rows] = await pool.query<DealStatsRow[]>(
    `SELECT d.*, co.name AS company_name ${joinSql} ${whereSql} ${orderBy} LIMIT ? OFFSET ?`,
    [...params, pageSize, offset]
  );
  return { rows, total, page, pageCount };
}

// --------------------------------------------------------------- activities

export interface ActivityInput {
  companyId: number;
  contactId?: number | null;
  dealId?: number | null;
  type?: string;
  summary: string;
}

export async function addActivity(orgId: number, a: ActivityInput): Promise<number> {
  await ensureSchema();
  const [res] = await getPool().query<mysql.ResultSetHeader>(
    `INSERT INTO crm_activities (organization_id, company_id, contact_id, deal_id, type, summary) VALUES (?, ?, ?, ?, ?, ?)`,
    [orgId, a.companyId, a.contactId ?? null, a.dealId ?? null, (a.type ?? "note").slice(0, 20), a.summary.slice(0, 500)]
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

export interface ActivityStatsRow extends ActivityRow {
  company_name: string;
}

export interface ActivitiesPageResult {
  rows: ActivityStatsRow[];
  total: number;
  page: number;
  pageCount: number;
}

/** One page of the cross-company activity feed, joined to the company,
 *  filtered/sorted/counted server-side. Sort is allowlisted. */
export async function listActivitiesPage(
  orgId: number,
  opts: { q?: string; type?: string; sortKey: string; sortDir: 1 | -1; page: number; pageSize: number }
): Promise<ActivitiesPageResult> {
  await ensureSchema();
  const where: string[] = ["a.organization_id = ?"];
  const params: (string | number)[] = [orgId];
  if (opts.q) {
    where.push("(a.summary LIKE ? OR co.name LIKE ?)");
    const like = `%${opts.q}%`;
    params.push(like, like);
  }
  if (opts.type) {
    where.push("a.type = ?");
    params.push(opts.type);
  }
  const joinSql = "FROM crm_activities a JOIN crm_companies co ON co.id = a.company_id AND co.organization_id = a.organization_id";
  const whereSql = `WHERE ${where.join(" AND ")}`;
  const pool = getPool();

  const [countRows] = await pool.query<mysql.RowDataPacket[]>(`SELECT COUNT(*) AS n ${joinSql} ${whereSql}`, params);
  const total = Number(countRows[0]?.n ?? 0);
  const { offset, pageSize, page, pageCount } = pageBounds(opts.page, opts.pageSize, total);
  const orderBy = buildActivityOrderBy(opts.sortKey, opts.sortDir);

  const [rows] = await pool.query<ActivityStatsRow[]>(
    `SELECT a.*, co.name AS company_name ${joinSql} ${whereSql} ${orderBy} LIMIT ? OFFSET ?`,
    [...params, pageSize, offset]
  );
  return { rows, total, page, pageCount };
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
  priority: string;
  owner: string;
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
  priority?: string;
  owner?: string;
}

function leadScoreOf(l: { website?: string; employees?: number | null; industryMatch?: boolean; annualValue?: number }): number {
  return leadScore({ hasWebsite: !!(l.website ?? "").trim(), employees: l.employees ?? null, industryMatch: !!l.industryMatch, annualValue: l.annualValue ?? 0 });
}

export async function createLead(orgId: number, l: LeadInput): Promise<number> {
  await ensureSchema();
  const [res] = await getPool().query<mysql.ResultSetHeader>(
    `INSERT INTO crm_leads (organization_id, name, company, title, email, phone, source, status, industry, website, employees, annual_value, industry_match, lead_score, notes, priority, owner)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
      (l.priority ?? "normal").slice(0, 12),
      (l.owner ?? "").slice(0, 120),
    ]
  );
  return res.insertId;
}

export async function getLead(orgId: number, id: number): Promise<LeadRow | null> {
  await ensureSchema();
  const [rows] = await getPool().query<LeadRow[]>("SELECT * FROM crm_leads WHERE id = ? AND organization_id = ? LIMIT 1", [id, orgId]);
  return rows[0] ?? null;
}

/** Full lead edit (everything except status — see setLeadStatus — and the
 *  convert link). Recomputes lead_score from the scoring inputs, same as create. */
export async function updateLead(orgId: number, id: number, l: LeadInput): Promise<void> {
  await ensureSchema();
  await getPool().query(
    `UPDATE crm_leads SET name=?, company=?, title=?, email=?, phone=?, source=?, industry=?, website=?, employees=?, annual_value=?, industry_match=?, lead_score=?, notes=?, priority=?, owner=?
       WHERE id=? AND organization_id=?`,
    [
      l.name.slice(0, 190),
      (l.company ?? "").slice(0, 190),
      (l.title ?? "").slice(0, 120),
      (l.email ?? "").slice(0, 190),
      (l.phone ?? "").slice(0, 60),
      (l.source ?? "other").slice(0, 30),
      (l.industry ?? "").slice(0, 120),
      (l.website ?? "").slice(0, 300),
      l.employees ?? null,
      l.annualValue ?? 0,
      l.industryMatch ? 1 : 0,
      leadScoreOf(l),
      (l.notes ?? "").slice(0, 500),
      (l.priority ?? "normal").slice(0, 12),
      (l.owner ?? "").slice(0, 120),
      id,
      orgId,
    ]
  );
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

export interface ConvertLeadOptions {
  /** Convert into this existing company (verified in-org). Omit/null => create a new one. */
  companyId?: number | null;
  /** Optionally open a deal on the resulting company. */
  deal?: { title: string; value?: number; stage?: string } | null;
}
export interface ConvertLeadResult {
  companyId: number;
  dealId: number | null;
  createdCompany: boolean;
}

/** Convert a lead into a company (+ a contact if it has a person, + an optional
 *  deal), atomically. Uses an existing company when one is given (no duplicate —
 *  Rule 8); otherwise creates one. Returns null if the lead isn't found. */
export async function convertLead(orgId: number, id: number, opts: ConvertLeadOptions = {}): Promise<ConvertLeadResult | null> {
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
      return { companyId: lead.converted_company_id, dealId: null, createdCompany: false };
    }

    // Target company: an existing one (verified in this org) or a fresh one.
    let companyId = 0;
    if (opts.companyId) {
      const [existing] = await conn.query<mysql.RowDataPacket[]>("SELECT id FROM crm_companies WHERE id = ? AND organization_id = ? LIMIT 1", [opts.companyId, orgId]);
      if (existing[0]) companyId = Number(existing[0].id);
    }
    const createdCompany = companyId === 0;
    if (createdCompany) {
      const score = leadScoreOf({ website: lead.website, employees: lead.employees, industryMatch: !!lead.industry_match, annualValue: lead.annual_value });
      const [companyRes] = await conn.query<mysql.ResultSetHeader>(
        `INSERT INTO crm_companies (organization_id, name, industry, city, website, employees, annual_value, status, account_manager, industry_match, lead_score)
           VALUES (?, ?, ?, ?, ?, ?, ?, 'active', '', ?, ?)`,
        [orgId, (lead.company || lead.name).slice(0, 190), lead.industry.slice(0, 120), "", lead.website.slice(0, 300), lead.employees, lead.annual_value, lead.industry_match, score]
      );
      companyId = companyRes.insertId;
    }

    // Add the lead's person as a contact, unless that company already has one with the same email.
    if (lead.name.trim()) {
      let dupe = false;
      if (lead.email.trim()) {
        const [c] = await conn.query<mysql.RowDataPacket[]>("SELECT id FROM crm_contacts WHERE company_id = ? AND organization_id = ? AND email = ? LIMIT 1", [companyId, orgId, lead.email]);
        dupe = !!c[0];
      }
      if (!dupe) {
        await conn.query(
          `INSERT INTO crm_contacts (organization_id, company_id, name, role, email, phone, department, influence)
             VALUES (?, ?, ?, ?, ?, ?, '', 'none')`,
          [orgId, companyId, lead.name.slice(0, 190), lead.title.slice(0, 120), lead.email.slice(0, 190), lead.phone.slice(0, 60)]
        );
      }
    }

    // Optional deal on the resulting company.
    let dealId: number | null = null;
    if (opts.deal && opts.deal.title.trim()) {
      const [dealRes] = await conn.query<mysql.ResultSetHeader>(
        `INSERT INTO crm_deals (organization_id, company_id, title, value, stage, probability, expected_close, owner) VALUES (?, ?, ?, ?, ?, NULL, NULL, '')`,
        [orgId, companyId, opts.deal.title.slice(0, 190), opts.deal.value ?? 0, (opts.deal.stage ?? "new").slice(0, 20)]
      );
      dealId = dealRes.insertId;
    }

    await conn.query("UPDATE crm_leads SET status = 'converted', converted_company_id = ? WHERE id = ? AND organization_id = ?", [companyId, id, orgId]);
    await conn.commit();
    return { companyId, dealId, createdCompany };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

// -------------------------------------------------------------------- tasks

export interface TaskRow extends mysql.RowDataPacket {
  id: number;
  organization_id: number;
  company_id: number | null;
  title: string;
  notes: string;
  due_date: Date | null;
  priority: string;
  done: number;
  created_at: Date;
  updated_at: Date;
}

export interface TaskStatsRow extends TaskRow {
  company_name: string | null;
}

export interface TaskInput {
  title: string;
  notes?: string;
  dueDate?: string | null;
  priority?: string;
  companyId?: number | null;
}

export async function createTask(orgId: number, t: TaskInput): Promise<number> {
  await ensureSchema();
  const [res] = await getPool().query<mysql.ResultSetHeader>(
    `INSERT INTO crm_tasks (organization_id, company_id, title, notes, due_date, priority) VALUES (?, ?, ?, ?, ?, ?)`,
    [orgId, t.companyId ?? null, t.title.slice(0, 300), (t.notes ?? "").slice(0, 500), t.dueDate || null, (t.priority ?? "normal").slice(0, 10)]
  );
  return res.insertId;
}

export interface TasksPageResult {
  rows: TaskStatsRow[];
  total: number;
  page: number;
  pageCount: number;
}

export async function listTasksPage(
  orgId: number,
  opts: { q?: string; done?: boolean; priority?: string; sortKey: string; sortDir: 1 | -1; page: number; pageSize: number }
): Promise<TasksPageResult> {
  await ensureSchema();
  const where: string[] = ["t.organization_id = ?"];
  const params: (string | number)[] = [orgId];
  if (opts.q) {
    where.push("t.title LIKE ?");
    params.push(`%${opts.q}%`);
  }
  if (opts.done !== undefined) {
    where.push("t.done = ?");
    params.push(opts.done ? 1 : 0);
  }
  if (opts.priority) {
    where.push("t.priority = ?");
    params.push(opts.priority);
  }
  const joinSql = "FROM crm_tasks t LEFT JOIN crm_companies co ON co.id = t.company_id AND co.organization_id = t.organization_id";
  const whereSql = `WHERE ${where.join(" AND ")}`;
  const pool = getPool();

  const [countRows] = await pool.query<mysql.RowDataPacket[]>(`SELECT COUNT(*) AS n ${joinSql} ${whereSql}`, params);
  const total = Number(countRows[0]?.n ?? 0);
  const { offset, pageSize, page, pageCount } = pageBounds(opts.page, opts.pageSize, total);
  const orderBy = buildTaskOrderBy(opts.sortKey, opts.sortDir);

  const [rows] = await pool.query<TaskStatsRow[]>(
    `SELECT t.*, co.name AS company_name ${joinSql} ${whereSql} ${orderBy} LIMIT ? OFFSET ?`,
    [...params, pageSize, offset]
  );
  return { rows, total, page, pageCount };
}

export async function setTaskDone(orgId: number, id: number, done: boolean): Promise<void> {
  await ensureSchema();
  await getPool().query("UPDATE crm_tasks SET done = ? WHERE id = ? AND organization_id = ?", [done ? 1 : 0, id, orgId]);
}

export async function deleteTask(orgId: number, id: number): Promise<void> {
  await ensureSchema();
  await getPool().query("DELETE FROM crm_tasks WHERE id = ? AND organization_id = ?", [id, orgId]);
}

// ----------------------------------------------------------------- products

export interface ProductRow extends mysql.RowDataPacket {
  id: number;
  organization_id: number;
  name: string;
  sku: string;
  description: string;
  price_cents: number;
  billing: string;
  active: number;
  created_at: Date;
  updated_at: Date;
}

export interface ProductInput {
  name: string;
  sku?: string;
  description?: string;
  priceCents?: number;
  billing?: string;
  active?: boolean;
}

export async function createProduct(orgId: number, p: ProductInput): Promise<number> {
  await ensureSchema();
  const [res] = await getPool().query<mysql.ResultSetHeader>(
    `INSERT INTO crm_products (organization_id, name, sku, description, price_cents, billing, active) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [orgId, p.name.slice(0, 190), (p.sku ?? "").slice(0, 60), (p.description ?? "").slice(0, 500), Math.max(0, Math.round(p.priceCents ?? 0)), (p.billing ?? "onetime").slice(0, 20), p.active === false ? 0 : 1]
  );
  return res.insertId;
}

export async function updateProduct(orgId: number, id: number, p: ProductInput): Promise<void> {
  await ensureSchema();
  await getPool().query(
    `UPDATE crm_products SET name=?, sku=?, description=?, price_cents=?, billing=?, active=? WHERE id=? AND organization_id=?`,
    [p.name.slice(0, 190), (p.sku ?? "").slice(0, 60), (p.description ?? "").slice(0, 500), Math.max(0, Math.round(p.priceCents ?? 0)), (p.billing ?? "onetime").slice(0, 20), p.active === false ? 0 : 1, id, orgId]
  );
}

export async function setProductActive(orgId: number, id: number, active: boolean): Promise<void> {
  await ensureSchema();
  await getPool().query("UPDATE crm_products SET active = ? WHERE id = ? AND organization_id = ?", [active ? 1 : 0, id, orgId]);
}

export async function deleteProduct(orgId: number, id: number): Promise<void> {
  await ensureSchema();
  await getPool().query("DELETE FROM crm_products WHERE id = ? AND organization_id = ?", [id, orgId]);
}

export interface ProductsPageResult {
  rows: ProductRow[];
  total: number;
  page: number;
  pageCount: number;
}

export async function listProductsPage(
  orgId: number,
  opts: { q?: string; active?: boolean; billing?: string; sortKey: string; sortDir: 1 | -1; page: number; pageSize: number }
): Promise<ProductsPageResult> {
  await ensureSchema();
  const where: string[] = ["p.organization_id = ?"];
  const params: (string | number)[] = [orgId];
  if (opts.q) {
    where.push("(p.name LIKE ? OR p.sku LIKE ?)");
    const like = `%${opts.q}%`;
    params.push(like, like);
  }
  if (opts.active !== undefined) {
    where.push("p.active = ?");
    params.push(opts.active ? 1 : 0);
  }
  if (opts.billing) {
    where.push("p.billing = ?");
    params.push(opts.billing);
  }
  const whereSql = `WHERE ${where.join(" AND ")}`;
  const pool = getPool();

  const [countRows] = await pool.query<mysql.RowDataPacket[]>(`SELECT COUNT(*) AS n FROM crm_products p ${whereSql}`, params);
  const total = Number(countRows[0]?.n ?? 0);
  const { offset, pageSize, page, pageCount } = pageBounds(opts.page, opts.pageSize, total);
  const orderBy = buildProductOrderBy(opts.sortKey, opts.sortDir);

  const [rows] = await pool.query<ProductRow[]>(`SELECT p.* FROM crm_products p ${whereSql} ${orderBy} LIMIT ? OFFSET ?`, [...params, pageSize, offset]);
  return { rows, total, page, pageCount };
}

// ------------------------------------------------------------------- quotes

export interface QuoteRow extends mysql.RowDataPacket {
  id: number;
  organization_id: number;
  company_id: number;
  status: string;
  notes: string;
  valid_until: Date | null;
  total_cents: number;
  created_at: Date;
  updated_at: Date;
}
export interface QuoteStatsRow extends QuoteRow {
  company_name: string;
}
export interface QuoteItemRow extends mysql.RowDataPacket {
  id: number;
  organization_id: number;
  quote_id: number;
  product_id: number | null;
  name: string;
  unit_price_cents: number;
  quantity: number;
  line_total_cents: number;
  created_at: Date;
}

export async function createQuote(orgId: number, companyId: number, opts: { notes?: string; validUntil?: string | null } = {}): Promise<number> {
  await ensureSchema();
  const [res] = await getPool().query<mysql.ResultSetHeader>(
    `INSERT INTO crm_quotes (organization_id, company_id, notes, valid_until) VALUES (?, ?, ?, ?)`,
    [orgId, companyId, (opts.notes ?? "").slice(0, 500), opts.validUntil || null]
  );
  return res.insertId;
}

export interface QuotesPageResult {
  rows: QuoteStatsRow[];
  total: number;
  page: number;
  pageCount: number;
}

export async function listQuotesPage(
  orgId: number,
  opts: { q?: string; status?: string; sortKey: string; sortDir: 1 | -1; page: number; pageSize: number }
): Promise<QuotesPageResult> {
  await ensureSchema();
  const where: string[] = ["q.organization_id = ?"];
  const params: (string | number)[] = [orgId];
  if (opts.q) {
    where.push("co.name LIKE ?");
    params.push(`%${opts.q}%`);
  }
  if (opts.status) {
    where.push("q.status = ?");
    params.push(opts.status);
  }
  const joinSql = "FROM crm_quotes q JOIN crm_companies co ON co.id = q.company_id AND co.organization_id = q.organization_id";
  const whereSql = `WHERE ${where.join(" AND ")}`;
  const pool = getPool();

  const [countRows] = await pool.query<mysql.RowDataPacket[]>(`SELECT COUNT(*) AS n ${joinSql} ${whereSql}`, params);
  const total = Number(countRows[0]?.n ?? 0);
  const { offset, pageSize, page, pageCount } = pageBounds(opts.page, opts.pageSize, total);
  const orderBy = buildQuoteOrderBy(opts.sortKey, opts.sortDir);

  const [rows] = await pool.query<QuoteStatsRow[]>(`SELECT q.*, co.name AS company_name ${joinSql} ${whereSql} ${orderBy} LIMIT ? OFFSET ?`, [...params, pageSize, offset]);
  return { rows, total, page, pageCount };
}

export async function getQuote(orgId: number, id: number): Promise<{ quote: QuoteStatsRow; items: QuoteItemRow[] } | null> {
  await ensureSchema();
  const pool = getPool();
  const [qRows] = await pool.query<QuoteStatsRow[]>(
    "SELECT q.*, co.name AS company_name FROM crm_quotes q JOIN crm_companies co ON co.id = q.company_id AND co.organization_id = q.organization_id WHERE q.id = ? AND q.organization_id = ? LIMIT 1",
    [id, orgId]
  );
  const quote = qRows[0];
  if (!quote) return null;
  const [items] = await pool.query<QuoteItemRow[]>("SELECT * FROM crm_quote_items WHERE quote_id = ? AND organization_id = ? ORDER BY id ASC", [id, orgId]);
  return { quote, items };
}

export async function updateQuote(orgId: number, id: number, patch: { status?: string; notes?: string; validUntil?: string | null }): Promise<void> {
  await ensureSchema();
  const sets: string[] = [];
  const vals: (string | number | null)[] = [];
  if (patch.status !== undefined) { sets.push("status=?"); vals.push(patch.status.slice(0, 20)); }
  if (patch.notes !== undefined) { sets.push("notes=?"); vals.push(patch.notes.slice(0, 500)); }
  if (patch.validUntil !== undefined) { sets.push("valid_until=?"); vals.push(patch.validUntil || null); }
  if (!sets.length) return;
  vals.push(id, orgId);
  await getPool().query(`UPDATE crm_quotes SET ${sets.join(", ")} WHERE id = ? AND organization_id = ?`, vals);
}

export async function deleteQuote(orgId: number, id: number): Promise<void> {
  await ensureSchema();
  const pool = getPool();
  await pool.query("DELETE FROM crm_quote_items WHERE quote_id = ? AND organization_id = ?", [id, orgId]);
  await pool.query("DELETE FROM crm_quotes WHERE id = ? AND organization_id = ?", [id, orgId]);
}

/** Recompute a quote's stored total from its line items. */
async function recomputeQuoteTotal(orgId: number, quoteId: number): Promise<void> {
  await getPool().query(
    "UPDATE crm_quotes SET total_cents = (SELECT COALESCE(SUM(line_total_cents), 0) FROM crm_quote_items WHERE quote_id = ? AND organization_id = ?) WHERE id = ? AND organization_id = ?",
    [quoteId, orgId, quoteId, orgId]
  );
}

export async function addQuoteItem(
  orgId: number,
  quoteId: number,
  item: { productId?: number | null; name: string; unitPriceCents: number; quantity: number }
): Promise<void> {
  await ensureSchema();
  const qty = Math.max(1, Math.round(item.quantity || 1));
  const unit = Math.max(0, Math.round(item.unitPriceCents || 0));
  await getPool().query(
    `INSERT INTO crm_quote_items (organization_id, quote_id, product_id, name, unit_price_cents, quantity, line_total_cents) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [orgId, quoteId, item.productId ?? null, item.name.slice(0, 190), unit, qty, qty * unit]
  );
  await recomputeQuoteTotal(orgId, quoteId);
}

export async function setQuoteItemQuantity(orgId: number, quoteId: number, itemId: number, quantity: number): Promise<void> {
  await ensureSchema();
  const qty = Math.max(1, Math.round(quantity));
  await getPool().query(
    "UPDATE crm_quote_items SET quantity = ?, line_total_cents = unit_price_cents * ? WHERE id = ? AND quote_id = ? AND organization_id = ?",
    [qty, qty, itemId, quoteId, orgId]
  );
  await recomputeQuoteTotal(orgId, quoteId);
}

export async function deleteQuoteItem(orgId: number, quoteId: number, itemId: number): Promise<void> {
  await ensureSchema();
  await getPool().query("DELETE FROM crm_quote_items WHERE id = ? AND quote_id = ? AND organization_id = ?", [itemId, quoteId, orgId]);
  await recomputeQuoteTotal(orgId, quoteId);
}

/** Active-product search for the quote line-item picker. */
export async function searchProducts(orgId: number, q: string): Promise<ProductRow[]> {
  await ensureSchema();
  const like = `%${q}%`;
  const [rows] = await getPool().query<ProductRow[]>(
    "SELECT * FROM crm_products WHERE organization_id = ? AND active = 1 AND (name LIKE ? OR sku LIKE ?) ORDER BY name ASC LIMIT 8",
    [orgId, like, like]
  );
  return rows;
}

// ---------------------------------------------------------------- analytics

export interface StatusCount {
  status: string;
  n: number;
  value: number;
}

async function groupCount(sql: string, orgId: number): Promise<StatusCount[]> {
  await ensureSchema();
  const [rows] = await getPool().query<mysql.RowDataPacket[]>(sql, [orgId]);
  return rows.map((r) => ({ status: String(r.k), n: Number(r.n), value: Number(r.v ?? 0) }));
}

export const analyticsCompanies = (orgId: number) =>
  groupCount("SELECT status AS k, COUNT(*) AS n, COALESCE(SUM(annual_value),0) AS v FROM crm_companies WHERE organization_id = ? GROUP BY status", orgId);

export const analyticsDealsByStage = (orgId: number) =>
  groupCount("SELECT stage AS k, COUNT(*) AS n, COALESCE(SUM(value),0) AS v FROM crm_deals WHERE organization_id = ? GROUP BY stage", orgId);

export const analyticsLeadsByStatus = (orgId: number) =>
  groupCount("SELECT status AS k, COUNT(*) AS n FROM crm_leads WHERE organization_id = ? GROUP BY status", orgId);

export const analyticsLeadsBySource = (orgId: number) =>
  groupCount("SELECT source AS k, COUNT(*) AS n FROM crm_leads WHERE organization_id = ? GROUP BY source", orgId);

export const analyticsActivitiesByType = (orgId: number) =>
  groupCount("SELECT type AS k, COUNT(*) AS n FROM crm_activities WHERE organization_id = ? GROUP BY type", orgId);

export const analyticsQuotesByStatus = (orgId: number) =>
  groupCount("SELECT status AS k, COUNT(*) AS n, COALESCE(SUM(total_cents),0) AS v FROM crm_quotes WHERE organization_id = ? GROUP BY status", orgId);

export interface OwnerRow {
  owner: string;
  won: number;
  open: number;
  n: number;
}
export async function analyticsDealsByOwner(orgId: number): Promise<OwnerRow[]> {
  await ensureSchema();
  const [rows] = await getPool().query<mysql.RowDataPacket[]>(
    `SELECT COALESCE(NULLIF(owner, ''), 'Unassigned') AS owner,
       COALESCE(SUM(CASE WHEN stage = 'won' THEN value ELSE 0 END), 0) AS won,
       COALESCE(SUM(CASE WHEN stage NOT IN ('won','lost') THEN value ELSE 0 END), 0) AS open,
       COUNT(*) AS n
     FROM crm_deals WHERE organization_id = ? GROUP BY owner ORDER BY won DESC, open DESC LIMIT 20`,
    [orgId]
  );
  return rows.map((r) => ({ owner: String(r.owner), won: Number(r.won), open: Number(r.open), n: Number(r.n) }));
}

export interface ForecastRow {
  month: string;
  stage: string;
  value: number;
}
export async function analyticsDealForecast(orgId: number): Promise<ForecastRow[]> {
  await ensureSchema();
  const [rows] = await getPool().query<mysql.RowDataPacket[]>(
    `SELECT DATE_FORMAT(expected_close, '%Y-%m') AS month, stage, COALESCE(SUM(value),0) AS value
     FROM crm_deals
     WHERE organization_id = ? AND stage NOT IN ('won','lost') AND expected_close IS NOT NULL
     GROUP BY month, stage ORDER BY month ASC`,
    [orgId]
  );
  return rows.map((r) => ({ month: String(r.month), stage: String(r.stage), value: Number(r.value) }));
}

export async function analyticsActivitiesLast30(orgId: number): Promise<number> {
  await ensureSchema();
  const [rows] = await getPool().query<mysql.RowDataPacket[]>(
    "SELECT COUNT(*) AS n FROM crm_activities WHERE organization_id = ? AND created_at >= NOW() - INTERVAL 30 DAY",
    [orgId]
  );
  return Number(rows[0]?.n ?? 0);
}

// -------- next-best-action signals (heuristic worklists; integer args are our
//          own constants, inlined via Number() so they can't be injected)

export async function nbaStaleAccounts(orgId: number, days: number, limit: number): Promise<{ id: number; name: string; lastDays: number | null }[]> {
  await ensureSchema();
  const d = Number(days) || 30;
  const [rows] = await getPool().query<mysql.RowDataPacket[]>(
    `SELECT c.id, c.name,
       DATEDIFF(NOW(), (SELECT MAX(a.created_at) FROM crm_activities a WHERE a.company_id = c.id)) AS last_days
     FROM crm_companies c
     WHERE c.organization_id = ? AND c.status IN ('customer','at_risk')
       AND ((SELECT MAX(a.created_at) FROM crm_activities a WHERE a.company_id = c.id) IS NULL
            OR (SELECT MAX(a.created_at) FROM crm_activities a WHERE a.company_id = c.id) < NOW() - INTERVAL ${d} DAY)
     ORDER BY last_days IS NULL DESC, last_days DESC LIMIT ?`,
    [orgId, Number(limit) || 5]
  );
  return rows.map((r) => ({ id: Number(r.id), name: String(r.name), lastDays: r.last_days == null ? null : Number(r.last_days) }));
}

export async function nbaOverdueDeals(orgId: number, limit: number): Promise<{ id: number; companyId: number; companyName: string; title: string; days: number }[]> {
  await ensureSchema();
  const [rows] = await getPool().query<mysql.RowDataPacket[]>(
    `SELECT d.id, d.company_id, d.title, co.name AS company_name, DATEDIFF(NOW(), d.expected_close) AS days
     FROM crm_deals d JOIN crm_companies co ON co.id = d.company_id AND co.organization_id = d.organization_id
     WHERE d.organization_id = ? AND d.stage NOT IN ('won','lost') AND d.expected_close IS NOT NULL AND d.expected_close < CURDATE()
     ORDER BY d.expected_close ASC LIMIT ?`,
    [orgId, Number(limit) || 5]
  );
  return rows.map((r) => ({ id: Number(r.id), companyId: Number(r.company_id), companyName: String(r.company_name), title: String(r.title), days: Number(r.days) }));
}

export async function nbaHotLeads(orgId: number, minScore: number, limit: number): Promise<{ id: number; name: string; company: string; score: number }[]> {
  await ensureSchema();
  const s = Number(minScore) || 60;
  const [rows] = await getPool().query<mysql.RowDataPacket[]>(
    `SELECT id, name, company, lead_score FROM crm_leads
     WHERE organization_id = ? AND status IN ('new','working') AND lead_score >= ${s}
     ORDER BY lead_score DESC LIMIT ?`,
    [orgId, Number(limit) || 5]
  );
  return rows.map((r) => ({ id: Number(r.id), name: String(r.name), company: String(r.company), score: Number(r.lead_score) }));
}

export async function nbaAgingQuotes(orgId: number, days: number, limit: number): Promise<{ id: number; companyName: string; days: number }[]> {
  await ensureSchema();
  const d = Number(days) || 7;
  const [rows] = await getPool().query<mysql.RowDataPacket[]>(
    `SELECT q.id, co.name AS company_name, DATEDIFF(NOW(), q.created_at) AS days
     FROM crm_quotes q JOIN crm_companies co ON co.id = q.company_id AND co.organization_id = q.organization_id
     WHERE q.organization_id = ? AND q.status = 'sent' AND q.created_at < NOW() - INTERVAL ${d} DAY
     ORDER BY q.created_at ASC LIMIT ?`,
    [orgId, Number(limit) || 5]
  );
  return rows.map((r) => ({ id: Number(r.id), companyName: String(r.company_name), days: Number(r.days) }));
}

// --------------------------------------------------------------- automations

export interface AutomationRow extends mysql.RowDataPacket {
  id: number;
  organization_id: number;
  template_key: string;
  name: string;
  params: string | null;
  enabled: number;
  last_run_at: Date | null;
  created_count: number;
  created_at: Date;
  updated_at: Date;
}
export interface AutomationRunRow extends mysql.RowDataPacket {
  id: number;
  organization_id: number;
  automation_id: number;
  created_count: number;
  summary: string;
  ran_at: Date;
  name: string; // joined automation name
}

export async function listAutomations(orgId: number): Promise<AutomationRow[]> {
  await ensureSchema();
  const [rows] = await getPool().query<AutomationRow[]>("SELECT * FROM crm_automations WHERE organization_id = ? ORDER BY id ASC", [orgId]);
  return rows;
}
export async function listEnabledAutomations(orgId: number): Promise<AutomationRow[]> {
  await ensureSchema();
  const [rows] = await getPool().query<AutomationRow[]>("SELECT * FROM crm_automations WHERE organization_id = ? AND enabled = 1 ORDER BY id ASC", [orgId]);
  return rows;
}
export async function createAutomation(orgId: number, a: { templateKey: string; name: string; params: Record<string, unknown> }): Promise<number> {
  await ensureSchema();
  const [res] = await getPool().query<mysql.ResultSetHeader>(
    "INSERT INTO crm_automations (organization_id, template_key, name, params) VALUES (?, ?, ?, ?)",
    [orgId, a.templateKey.slice(0, 40), a.name.slice(0, 190), JSON.stringify(a.params ?? {})]
  );
  return res.insertId;
}
export async function toggleAutomation(orgId: number, id: number, enabled: boolean): Promise<void> {
  await ensureSchema();
  await getPool().query("UPDATE crm_automations SET enabled = ? WHERE id = ? AND organization_id = ?", [enabled ? 1 : 0, id, orgId]);
}
export async function deleteAutomation(orgId: number, id: number): Promise<void> {
  await ensureSchema();
  await getPool().query("DELETE FROM crm_automations WHERE id = ? AND organization_id = ?", [id, orgId]);
}
export async function logAutomationRun(orgId: number, automationId: number, created: number, summary: string): Promise<void> {
  await ensureSchema();
  const pool = getPool();
  await pool.query("INSERT INTO crm_automation_runs (organization_id, automation_id, created_count, summary) VALUES (?, ?, ?, ?)", [orgId, automationId, created, summary.slice(0, 255)]);
  await pool.query("UPDATE crm_automations SET last_run_at = CURRENT_TIMESTAMP, created_count = created_count + ? WHERE id = ? AND organization_id = ?", [created, automationId, orgId]);
}
export async function listAutomationRuns(orgId: number, limit = 50): Promise<AutomationRunRow[]> {
  await ensureSchema();
  const [rows] = await getPool().query<AutomationRunRow[]>(
    `SELECT r.*, COALESCE(a.name, 'Automation') AS name FROM crm_automation_runs r
     LEFT JOIN crm_automations a ON a.id = r.automation_id AND a.organization_id = r.organization_id
     WHERE r.organization_id = ? ORDER BY r.id DESC LIMIT ?`,
    [orgId, limit]
  );
  return rows;
}
/** True if an open (not-done) task with this exact title already exists — the
 *  runner's dedup so it doesn't recreate the same task on every tick. */
export async function openTaskExists(orgId: number, title: string): Promise<boolean> {
  await ensureSchema();
  const [rows] = await getPool().query<mysql.RowDataPacket[]>("SELECT 1 FROM crm_tasks WHERE organization_id = ? AND title = ? AND done = 0 LIMIT 1", [orgId, title]);
  return rows.length > 0;
}
/** Orgs with at least one enabled automation — the cron tick iterates these. */
export async function distinctAutomationOrgs(): Promise<number[]> {
  await ensureSchema();
  const [rows] = await getPool().query<mysql.RowDataPacket[]>("SELECT DISTINCT organization_id FROM crm_automations WHERE enabled = 1 ORDER BY organization_id");
  return rows.map((r) => Number(r.organization_id));
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
      // Billing columns (added post-multi-tenancy; idempotent for the existing prod DB).
      await ensureColumn(pool, "crm_organizations", "plan", "plan VARCHAR(24) NOT NULL DEFAULT 'pro'");
      await ensureColumn(pool, "crm_organizations", "billing_email", "billing_email VARCHAR(190) NOT NULL DEFAULT ''");
      await ensureColumn(pool, "crm_organizations", "billing_name", "billing_name VARCHAR(190) NOT NULL DEFAULT ''");
      await ensureColumn(pool, "crm_organizations", "billing_address", "billing_address VARCHAR(500) NOT NULL DEFAULT ''");
      await ensureColumn(pool, "crm_organizations", "tax_id", "tax_id VARCHAR(40) NOT NULL DEFAULT ''");
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
      await pool.query(`
        CREATE TABLE IF NOT EXISTS crm_api_keys (
          id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
          organization_id INT UNSIGNED NOT NULL,
          name VARCHAR(120) NOT NULL DEFAULT '',
          key_hash CHAR(64) NOT NULL,
          last4 VARCHAR(8) NOT NULL DEFAULT '',
          created_by_email VARCHAR(190) NOT NULL DEFAULT '',
          enabled TINYINT NOT NULL DEFAULT 1,
          last_used_at TIMESTAMP NULL,
          request_count INT UNSIGNED NOT NULL DEFAULT 0,
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          UNIQUE KEY uq_apikey_hash (key_hash),
          INDEX idx_apikey_org (organization_id, id)
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
  plan: string;
  billing_email: string;
  billing_name: string;
  billing_address: string;
  tax_id: string;
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

export async function getOrganization(id: number): Promise<OrganizationRow | null> {
  await ensureAuthSchema();
  const [rows] = await getPool().query<OrganizationRow[]>("SELECT * FROM crm_organizations WHERE id = ? LIMIT 1", [id]);
  return rows[0] ?? null;
}

export async function updateOrganization(id: number, name: string, slug: string): Promise<void> {
  await ensureAuthSchema();
  await getPool().query("UPDATE crm_organizations SET name = ?, slug = ? WHERE id = ?", [name.slice(0, 190), slug.slice(0, 120), id]);
}

export async function countOrgUsers(orgId: number): Promise<number> {
  await ensureAuthSchema();
  const [rows] = await getPool().query<mysql.RowDataPacket[]>("SELECT COUNT(*) AS n FROM crm_users WHERE organization_id = ?", [orgId]);
  return Number(rows[0]?.n ?? 0);
}

// -------- billing (plan + billing details on the organization; usage is measured)

export async function updateOrgPlan(orgId: number, plan: string): Promise<void> {
  await ensureAuthSchema();
  await getPool().query("UPDATE crm_organizations SET plan = ? WHERE id = ?", [plan.slice(0, 24), orgId]);
}

export interface BillingInfoInput {
  billingEmail: string;
  billingName: string;
  billingAddress: string;
  taxId: string;
}

export async function updateBillingInfo(orgId: number, b: BillingInfoInput): Promise<void> {
  await ensureAuthSchema();
  await getPool().query(
    "UPDATE crm_organizations SET billing_email = ?, billing_name = ?, billing_address = ?, tax_id = ? WHERE id = ?",
    [b.billingEmail.slice(0, 190), b.billingName.slice(0, 190), b.billingAddress.slice(0, 500), b.taxId.slice(0, 40), orgId]
  );
}

export interface UsageCounts {
  users: number;
  companies: number;
  contacts: number;
  deals: number;
}

/** Real row counts for the org, for the billing usage meter. */
export async function getUsageCounts(orgId: number): Promise<UsageCounts> {
  await ensureSchema();
  await ensureAuthSchema();
  const pool = getPool();
  const q = (sql: string) => pool.query<mysql.RowDataPacket[]>(sql, [orgId]).then(([r]) => Number(r[0]?.n ?? 0));
  const [users, companies, contacts, deals] = await Promise.all([
    q("SELECT COUNT(*) AS n FROM crm_users WHERE organization_id = ?"),
    q("SELECT COUNT(*) AS n FROM crm_companies WHERE organization_id = ?"),
    q("SELECT COUNT(*) AS n FROM crm_contacts WHERE organization_id = ?"),
    q("SELECT COUNT(*) AS n FROM crm_deals WHERE organization_id = ?"),
  ]);
  return { users, companies, contacts, deals };
}

// -------- API keys (read-only, org-scoped; only the SHA-256 is stored)

export interface ApiKeyRow extends mysql.RowDataPacket {
  id: number;
  organization_id: number;
  name: string;
  key_hash: string;
  last4: string;
  created_by_email: string;
  enabled: number;
  last_used_at: Date | null;
  request_count: number;
  created_at: Date;
}

export async function listApiKeys(orgId: number): Promise<ApiKeyRow[]> {
  await ensureAuthSchema();
  const [rows] = await getPool().query<ApiKeyRow[]>(
    "SELECT * FROM crm_api_keys WHERE organization_id = ? ORDER BY id DESC",
    [orgId]
  );
  return rows;
}

export async function createApiKey(
  orgId: number,
  input: { name: string; keyHash: string; last4: string; createdByEmail: string }
): Promise<number> {
  await ensureAuthSchema();
  const [res] = await getPool().query<mysql.ResultSetHeader>(
    "INSERT INTO crm_api_keys (organization_id, name, key_hash, last4, created_by_email) VALUES (?, ?, ?, ?, ?)",
    [orgId, input.name.slice(0, 120), input.keyHash.slice(0, 64), input.last4.slice(0, 8), input.createdByEmail.slice(0, 190)]
  );
  return res.insertId;
}

export async function setApiKeyEnabled(orgId: number, id: number, enabled: boolean): Promise<void> {
  await ensureAuthSchema();
  await getPool().query("UPDATE crm_api_keys SET enabled = ? WHERE id = ? AND organization_id = ?", [enabled ? 1 : 0, id, orgId]);
}

export async function deleteApiKey(orgId: number, id: number): Promise<void> {
  await ensureAuthSchema();
  await getPool().query("DELETE FROM crm_api_keys WHERE id = ? AND organization_id = ?", [id, orgId]);
}

/** Resolve an incoming key hash to its org — the API auth lookup. NOT org-scoped
 *  (the key *is* the identity). Only enabled keys authenticate. */
export async function findEnabledApiKeyByHash(hash: string): Promise<{ id: number; organizationId: number } | null> {
  await ensureAuthSchema();
  const [rows] = await getPool().query<ApiKeyRow[]>(
    "SELECT id, organization_id FROM crm_api_keys WHERE key_hash = ? AND enabled = 1 LIMIT 1",
    [hash]
  );
  const r = rows[0];
  return r ? { id: r.id, organizationId: r.organization_id } : null;
}

/** Best-effort usage stamp; never blocks a request. */
export async function touchApiKey(id: number): Promise<void> {
  await ensureAuthSchema();
  await getPool()
    .query("UPDATE crm_api_keys SET last_used_at = CURRENT_TIMESTAMP, request_count = request_count + 1 WHERE id = ?", [id])
    .catch(() => {});
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
