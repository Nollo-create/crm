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
import { buildQuoteOrderBy, isQuoteExpired } from "@/lib/crm/quotes";

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
      await pool.query(`
        CREATE TABLE IF NOT EXISTS crm_tags (
          id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
          organization_id INT UNSIGNED NOT NULL DEFAULT 0,
          name VARCHAR(60) NOT NULL DEFAULT '',
          color VARCHAR(20) NOT NULL DEFAULT 'electric',
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          UNIQUE KEY uq_tag_org_name (organization_id, name),
          INDEX idx_tag_org (organization_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
      `);
      await pool.query(`
        CREATE TABLE IF NOT EXISTS crm_entity_tags (
          id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
          organization_id INT UNSIGNED NOT NULL DEFAULT 0,
          tag_id INT UNSIGNED NOT NULL,
          entity_type VARCHAR(16) NOT NULL DEFAULT '',
          entity_id INT UNSIGNED NOT NULL,
          UNIQUE KEY uq_entity_tag (organization_id, tag_id, entity_type, entity_id),
          INDEX idx_entity_tags (organization_id, entity_type, entity_id)
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
      // Record-level access: which user owns a lead/deal (set on create). Null =
      // unassigned (visible to everyone even when member-restriction is on).
      await ensureColumn(pool, "crm_leads", "owner_user_id", "owner_user_id INT UNSIGNED NULL");
      await ensureColumn(pool, "crm_deals", "owner_user_id", "owner_user_id INT UNSIGNED NULL");
      // Deal fields (Phase 3A — primary contact + notes on the deal profile).
      await ensureColumn(pool, "crm_deals", "contact_id", "contact_id INT UNSIGNED NULL");
      await ensureColumn(pool, "crm_deals", "notes", "notes TEXT NULL");
      // Won/Lost workflow (Phase 3B — close date + loss reason).
      await ensureColumn(pool, "crm_deals", "closed_at", "closed_at TIMESTAMP NULL");
      await ensureColumn(pool, "crm_deals", "loss_reason", "loss_reason VARCHAR(40) NOT NULL DEFAULT ''");
      // Deal-scoped activities (Phase 3A — a deal's own timeline).
      await ensureColumn(pool, "crm_activities", "deal_id", "deal_id INT UNSIGNED NULL");
      // Quote client-accept flow (Stage 5 — public share link + decision stamps).
      await ensureColumn(pool, "crm_quotes", "public_token", "public_token VARCHAR(64) NOT NULL DEFAULT ''");
      await ensureColumn(pool, "crm_quotes", "sent_at", "sent_at TIMESTAMP NULL");
      await ensureColumn(pool, "crm_quotes", "decided_at", "decided_at TIMESTAMP NULL");
      await ensureColumn(pool, "crm_quotes", "client_name", "client_name VARCHAR(190) NOT NULL DEFAULT ''");
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
  owner_user_id: number | null;
  contact_id: number | null;
  notes: string | null;
  closed_at: Date | null;
  loss_reason: string;
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

/** Possible duplicates for a company about to be created — a fuzzy name match or
 *  the same website domain (Rule 8 / spec §36). Org-scoped. */
export async function findSimilarCompanies(orgId: number, name: string, website: string): Promise<CompanyRow[]> {
  await ensureSchema();
  const n = name.trim();
  if (n.length < 2) return [];
  const orParts: string[] = ["name LIKE ?"];
  const params: (string | number)[] = [orgId, `%${n}%`];
  const domain = website.trim().replace(/^https?:\/\//i, "").replace(/^www\./i, "").split("/")[0].toLowerCase();
  if (domain.length > 3) {
    orParts.push("(website <> '' AND LOWER(website) LIKE ?)");
    params.push(`%${domain}%`);
  }
  const [rows] = await getPool().query<CompanyRow[]>(
    `SELECT * FROM crm_companies WHERE organization_id = ? AND (${orParts.join(" OR ")}) ORDER BY name ASC LIMIT 5`,
    params
  );
  return rows;
}

// -------- tags (polymorphic: attach to companies/contacts/leads/deals)

export interface TagRow extends mysql.RowDataPacket {
  id: number;
  name: string;
  color: string;
}
export async function listTags(orgId: number): Promise<TagRow[]> {
  await ensureSchema();
  const [rows] = await getPool().query<TagRow[]>("SELECT id, name, color FROM crm_tags WHERE organization_id = ? ORDER BY name ASC", [orgId]);
  return rows;
}
/** Create a tag, or return the existing one's id (idempotent per org+name). */
export async function createTag(orgId: number, name: string, color: string): Promise<number> {
  await ensureSchema();
  const [res] = await getPool().query<mysql.ResultSetHeader>(
    "INSERT INTO crm_tags (organization_id, name, color) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE id = LAST_INSERT_ID(id)",
    [orgId, name.slice(0, 60), color.slice(0, 20)]
  );
  return res.insertId;
}
export async function tagsForEntity(orgId: number, entityType: string, entityId: number): Promise<TagRow[]> {
  await ensureSchema();
  const [rows] = await getPool().query<TagRow[]>(
    `SELECT t.id, t.name, t.color FROM crm_entity_tags et
       JOIN crm_tags t ON t.id = et.tag_id AND t.organization_id = et.organization_id
      WHERE et.organization_id = ? AND et.entity_type = ? AND et.entity_id = ? ORDER BY t.name ASC`,
    [orgId, entityType.slice(0, 16), entityId]
  );
  return rows;
}
/** Replace the full tag set on an entity, atomically. */
export async function setEntityTags(orgId: number, entityType: string, entityId: number, tagIds: number[]): Promise<void> {
  await ensureSchema();
  const clean = tagIds.filter((n) => Number.isInteger(n)).slice(0, 50);
  const type = entityType.slice(0, 16);
  const conn = await getPool().getConnection();
  try {
    await conn.beginTransaction();
    await conn.query("DELETE FROM crm_entity_tags WHERE organization_id = ? AND entity_type = ? AND entity_id = ?", [orgId, type, entityId]);
    for (const tagId of clean) {
      await conn.query("INSERT IGNORE INTO crm_entity_tags (organization_id, tag_id, entity_type, entity_id) VALUES (?, ?, ?, ?)", [orgId, tagId, type, entityId]);
    }
    await conn.commit();
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
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

// ---- Duplicate detection + merge -------------------------------------------

export interface DedupeCompanyRow extends mysql.RowDataPacket {
  id: number;
  name: string;
  website: string;
  email: string;
  vat_id: string;
  city: string;
  status: string;
  created_at: Date;
  contact_count: number;
  deal_count: number;
  activity_count: number;
}

/** Lightweight scan of every company in the org, with child counts so the UI can
 *  suggest which record to keep as the survivor. */
export async function listCompaniesForDedupe(orgId: number): Promise<DedupeCompanyRow[]> {
  await ensureSchema();
  const [rows] = await getPool().query<DedupeCompanyRow[]>(
    `SELECT c.id, c.name, c.website, c.email, c.vat_id, c.city, c.status, c.created_at,
       (SELECT COUNT(*) FROM crm_contacts ct WHERE ct.company_id = c.id AND ct.organization_id = c.organization_id) AS contact_count,
       (SELECT COUNT(*) FROM crm_deals d WHERE d.company_id = c.id AND d.organization_id = c.organization_id) AS deal_count,
       (SELECT COUNT(*) FROM crm_activities a WHERE a.company_id = c.id AND a.organization_id = c.organization_id) AS activity_count
     FROM crm_companies c WHERE c.organization_id = ? ORDER BY c.id ASC`,
    [orgId]
  );
  return rows;
}

export interface MergeResult {
  contacts: number;
  deals: number;
  activities: number;
  quotes: number;
  tasks: number;
  meetings: number;
}

/** Merge `duplicateId` into `primaryId`: reassign every child record, fill blank
 *  fields on the survivor from the duplicate, then delete the duplicate. Runs in
 *  a transaction so a failure leaves both records untouched. Returns null if the
 *  ids are the same or either isn't this org's. */
export async function mergeCompanies(orgId: number, primaryId: number, duplicateId: number): Promise<MergeResult | null> {
  if (!Number.isInteger(primaryId) || !Number.isInteger(duplicateId) || primaryId === duplicateId) return null;
  await ensureSchema();
  const conn = await getPool().getConnection();
  try {
    // Both must exist and belong to this org.
    const [check] = await conn.query<mysql.RowDataPacket[]>(
      "SELECT id FROM crm_companies WHERE organization_id = ? AND id IN (?, ?)",
      [orgId, primaryId, duplicateId]
    );
    if (check.length !== 2) return null;

    await conn.beginTransaction();
    const move = async (table: string, col = "company_id"): Promise<number> => {
      const [res] = await conn.query<mysql.ResultSetHeader>(
        `UPDATE ${table} SET ${col} = ? WHERE ${col} = ? AND organization_id = ?`,
        [primaryId, duplicateId, orgId]
      );
      return res.affectedRows;
    };

    const contacts = await move("crm_contacts");
    const deals = await move("crm_deals");
    const activities = await move("crm_activities");
    const quotes = await move("crm_quotes");
    const tasks = await move("crm_tasks");
    const meetings = await move("crm_meetings");
    await move("crm_email_sends");
    await move("crm_scheduled_emails");
    await move("crm_sequence_enrollments");
    await move("crm_leads", "converted_company_id");

    // Tags: repoint what doesn't collide, then drop the loser's leftovers (a tag
    // the survivor already carries) so nothing is orphaned by the delete below.
    await conn.query(
      "UPDATE IGNORE crm_entity_tags SET entity_id = ? WHERE organization_id = ? AND entity_type = 'company' AND entity_id = ?",
      [primaryId, orgId, duplicateId]
    );
    await conn.query(
      "DELETE FROM crm_entity_tags WHERE organization_id = ? AND entity_type = 'company' AND entity_id = ?",
      [orgId, duplicateId]
    );

    // Fill blank fields on the survivor from the duplicate.
    await conn.query(
      `UPDATE crm_companies p JOIN crm_companies d ON d.id = ? AND d.organization_id = ?
         SET p.industry = IF(p.industry = '', d.industry, p.industry),
             p.city = IF(p.city = '', d.city, p.city),
             p.website = IF(p.website = '', d.website, p.website),
             p.account_manager = IF(p.account_manager = '', d.account_manager, p.account_manager),
             p.legal_name = IF(p.legal_name = '', d.legal_name, p.legal_name),
             p.phone = IF(p.phone = '', d.phone, p.phone),
             p.email = IF(p.email = '', d.email, p.email),
             p.country = IF(p.country = '', d.country, p.country),
             p.address = IF(p.address = '', d.address, p.address),
             p.vat_id = IF(p.vat_id = '', d.vat_id, p.vat_id),
             p.employees = COALESCE(p.employees, d.employees),
             p.annual_value = IF(p.annual_value = 0, d.annual_value, p.annual_value)
       WHERE p.id = ? AND p.organization_id = ?`,
      [duplicateId, orgId, primaryId, orgId]
    );

    await conn.query("DELETE FROM crm_companies WHERE id = ? AND organization_id = ?", [duplicateId, orgId]);
    await conn.commit();
    return { contacts, deals, activities, quotes, tasks, meetings };
  } catch (err) {
    await conn.rollback().catch(() => {});
    throw err;
  } finally {
    conn.release();
  }
}

// -------- bulk ops for leads & deals (org-scoped, capped, ?-bound like companies)
function cleanIds(ids: number[]): number[] {
  return ids.filter((n) => Number.isInteger(n)).slice(0, 500);
}
export async function bulkDeleteLeads(orgId: number, ids: number[], ownerScope?: { sql: string; params: number[] }): Promise<void> {
  const clean = cleanIds(ids);
  if (!clean.length) return;
  await ensureSchema();
  await getPool().query(`DELETE FROM crm_leads WHERE organization_id = ? AND id IN (${clean.map(() => "?").join(",")})${ownerScope?.sql ?? ""}`, [orgId, ...clean, ...(ownerScope?.params ?? [])]);
}
export async function bulkSetLeadStatus(orgId: number, ids: number[], status: string, ownerScope?: { sql: string; params: number[] }): Promise<void> {
  const clean = cleanIds(ids);
  if (!clean.length) return;
  await ensureSchema();
  await getPool().query(`UPDATE crm_leads SET status = ? WHERE organization_id = ? AND id IN (${clean.map(() => "?").join(",")})${ownerScope?.sql ?? ""}`, [status.slice(0, 20), orgId, ...clean, ...(ownerScope?.params ?? [])]);
}
export async function bulkDeleteDeals(orgId: number, ids: number[], ownerScope?: { sql: string; params: number[] }): Promise<void> {
  const clean = cleanIds(ids);
  if (!clean.length) return;
  await ensureSchema();
  await getPool().query(`DELETE FROM crm_deals WHERE organization_id = ? AND id IN (${clean.map(() => "?").join(",")})${ownerScope?.sql ?? ""}`, [orgId, ...clean, ...(ownerScope?.params ?? [])]);
}
export async function bulkSetDealStage(orgId: number, ids: number[], stage: string, ownerScope?: { sql: string; params: number[] }): Promise<void> {
  const clean = cleanIds(ids);
  if (!clean.length) return;
  await ensureSchema();
  await getPool().query(
    `UPDATE crm_deals SET stage = ?, closed_at = NULL, loss_reason = '' WHERE organization_id = ? AND id IN (${clean.map(() => "?").join(",")})${ownerScope?.sql ?? ""}`,
    [stage.slice(0, 20), orgId, ...clean, ...(ownerScope?.params ?? [])]
  );
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
  ownerUserId?: number | null;
  contactId?: number | null;
  notes?: string;
}

export async function createDeal(orgId: number, companyId: number, d: DealInput): Promise<number> {
  await ensureSchema();
  const [res] = await getPool().query<mysql.ResultSetHeader>(
    `INSERT INTO crm_deals (organization_id, company_id, title, value, stage, probability, expected_close, owner, owner_user_id, contact_id, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      orgId,
      companyId,
      d.title.slice(0, 190),
      d.value ?? 0,
      (d.stage ?? "new").slice(0, 20),
      d.probability ?? null,
      d.expectedClose || null,
      (d.owner ?? "").slice(0, 120),
      d.ownerUserId ?? null,
      d.contactId ?? null,
      (d.notes ?? "").slice(0, 2000),
    ]
  );
  return res.insertId;
}

export async function listDeals(orgId: number, opts: { companyId?: number; ownerScope?: { sql: string; params: number[] } } = {}): Promise<DealRow[]> {
  await ensureSchema();
  const scopeSql = opts.ownerScope?.sql ?? "";
  const scopeParams = opts.ownerScope?.params ?? [];
  if (opts.companyId != null) {
    const [rows] = await getPool().query<DealRow[]>(
      `SELECT * FROM crm_deals WHERE organization_id = ? AND company_id = ?${scopeSql} ORDER BY updated_at DESC`,
      [orgId, opts.companyId, ...scopeParams]
    );
    return rows;
  }
  const [rows] = await getPool().query<DealRow[]>(
    `SELECT * FROM crm_deals WHERE organization_id = ?${scopeSql} ORDER BY updated_at DESC LIMIT 1000`,
    [orgId, ...scopeParams]
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
export async function listDealsForContact(orgId: number, contactId: number, ownerScope?: { sql: string; params: number[] }): Promise<DealRow[]> {
  await ensureSchema();
  const [rows] = await getPool().query<DealRow[]>(
    `SELECT * FROM crm_deals WHERE contact_id = ? AND organization_id = ?${ownerScope?.sql ?? ""} ORDER BY updated_at DESC LIMIT 50`,
    [contactId, orgId, ...(ownerScope?.params ?? [])]
  );
  return rows;
}

/** Mark a deal Won: stamp the close, and (Rule 6) flip its company to Customer —
 *  atomically. Idempotent: re-winning, or a company with multiple won deals, stays
 *  one customer. Returns the company id (for revalidation) or null if not found. */
export async function closeDealWon(orgId: number, id: number): Promise<{ companyId: number } | null> {
  await ensureSchema();
  const conn = await getPool().getConnection();
  try {
    await conn.beginTransaction();
    const [rows] = await conn.query<DealRow[]>("SELECT company_id FROM crm_deals WHERE id = ? AND organization_id = ? FOR UPDATE", [id, orgId]);
    const deal = rows[0];
    if (!deal) {
      await conn.rollback();
      return null;
    }
    await conn.query("UPDATE crm_deals SET stage = 'won', probability = 100, closed_at = CURRENT_TIMESTAMP, loss_reason = '' WHERE id = ? AND organization_id = ?", [id, orgId]);
    await conn.query("UPDATE crm_companies SET status = 'customer' WHERE id = ? AND organization_id = ? AND status <> 'customer'", [deal.company_id, orgId]);
    await conn.commit();
    return { companyId: deal.company_id };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

/** Mark a deal Lost with a reason (for win/loss analytics). Does not change the
 *  company (a lost deal doesn't demote a customer). */
export async function closeDealLost(orgId: number, id: number, reason: string): Promise<{ companyId: number } | null> {
  await ensureSchema();
  const [rows] = await getPool().query<DealRow[]>("SELECT company_id FROM crm_deals WHERE id = ? AND organization_id = ? LIMIT 1", [id, orgId]);
  const deal = rows[0];
  if (!deal) return null;
  await getPool().query(
    "UPDATE crm_deals SET stage = 'lost', probability = 0, closed_at = CURRENT_TIMESTAMP, loss_reason = ? WHERE id = ? AND organization_id = ?",
    [reason.slice(0, 40), id, orgId]
  );
  return { companyId: deal.company_id };
}

/** Move a deal (back) to an open stage — clears the close stamp + loss reason.
 *  Company status is left as-is (reopening doesn't un-customer them — Rule 7). */
export async function setDealOpenStage(orgId: number, id: number, stage: string): Promise<{ companyId: number } | null> {
  await ensureSchema();
  const [rows] = await getPool().query<DealRow[]>("SELECT company_id FROM crm_deals WHERE id = ? AND organization_id = ? LIMIT 1", [id, orgId]);
  const deal = rows[0];
  if (!deal) return null;
  await getPool().query("UPDATE crm_deals SET stage = ?, closed_at = NULL, loss_reason = '' WHERE id = ? AND organization_id = ?", [stage.slice(0, 20), id, orgId]);
  return { companyId: deal.company_id };
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
  opts: { q?: string; stage?: string; sortKey: string; sortDir: 1 | -1; page: number; pageSize: number; ownerScope?: { sql: string; params: number[] } }
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
  const whereSql = `WHERE ${where.join(" AND ")}${opts.ownerScope?.sql ?? ""}`;
  if (opts.ownerScope?.params.length) params.push(...opts.ownerScope.params);
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
  opts: { q?: string; type?: string; sinceDays?: number; sortKey: string; sortDir: 1 | -1; page: number; pageSize: number }
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
  if (opts.sinceDays && opts.sinceDays > 0) {
    // Number-coerced interpolation (injection-safe), matching the nba* helpers.
    where.push(`a.created_at >= DATE_SUB(NOW(), INTERVAL ${Math.floor(opts.sinceDays)} DAY)`);
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

export async function deleteActivity(orgId: number, id: number): Promise<void> {
  await ensureSchema();
  await getPool().query("DELETE FROM crm_activities WHERE id = ? AND organization_id = ?", [id, orgId]);
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
  owner_user_id: number | null;
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
  ownerUserId?: number | null;
}

function leadScoreOf(l: { website?: string; employees?: number | null; industryMatch?: boolean; annualValue?: number }): number {
  return leadScore({ hasWebsite: !!(l.website ?? "").trim(), employees: l.employees ?? null, industryMatch: !!l.industryMatch, annualValue: l.annualValue ?? 0 });
}

export async function createLead(orgId: number, l: LeadInput): Promise<number> {
  await ensureSchema();
  const [res] = await getPool().query<mysql.ResultSetHeader>(
    `INSERT INTO crm_leads (organization_id, name, company, title, email, phone, source, status, industry, website, employees, annual_value, industry_match, lead_score, notes, priority, owner, owner_user_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
      l.ownerUserId ?? null,
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
  opts: { q?: string; status?: string; source?: string; sortKey: string; sortDir: 1 | -1; page: number; pageSize: number; ownerScope?: { sql: string; params: number[] } }
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
  const whereSql = `WHERE ${where.join(" AND ")}${opts.ownerScope?.sql ?? ""}`;
  if (opts.ownerScope?.params.length) params.push(...opts.ownerScope.params);
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
  opts: { q?: string; done?: boolean; priority?: string; due?: string; sortKey: string; sortDir: 1 | -1; page: number; pageSize: number }
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
  // Due-date windows (static SQL, no user input) — for the Overdue/Today/Week tabs.
  if (opts.due === "overdue") where.push("t.due_date IS NOT NULL AND t.due_date < CURDATE()");
  else if (opts.due === "today") where.push("t.due_date = CURDATE()");
  else if (opts.due === "week") where.push("t.due_date IS NOT NULL AND t.due_date >= CURDATE() AND t.due_date <= DATE_ADD(CURDATE(), INTERVAL 7 DAY)");
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

export async function updateTask(orgId: number, id: number, patch: { title?: string; notes?: string; dueDate?: string | null; priority?: string }): Promise<void> {
  await ensureSchema();
  const sets: string[] = [];
  const vals: (string | number | null)[] = [];
  if (patch.title !== undefined) { sets.push("title=?"); vals.push(patch.title.slice(0, 300)); }
  if (patch.notes !== undefined) { sets.push("notes=?"); vals.push((patch.notes ?? "").slice(0, 500)); }
  if (patch.dueDate !== undefined) { sets.push("due_date=?"); vals.push(patch.dueDate || null); }
  if (patch.priority !== undefined) { sets.push("priority=?"); vals.push(patch.priority.slice(0, 10)); }
  if (!sets.length) return;
  vals.push(id, orgId);
  await getPool().query(`UPDATE crm_tasks SET ${sets.join(", ")} WHERE id = ? AND organization_id = ?`, vals);
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

export interface ProductStatsRow extends ProductRow {
  quote_uses: number;
}
export interface ProductsPageResult {
  rows: ProductStatsRow[];
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

  const [rows] = await pool.query<ProductStatsRow[]>(
    `SELECT p.*, (SELECT COUNT(*) FROM crm_quote_items qi WHERE qi.product_id = p.id AND qi.organization_id = p.organization_id) AS quote_uses
       FROM crm_products p ${whereSql} ${orderBy} LIMIT ? OFFSET ?`,
    [...params, pageSize, offset]
  );
  return { rows, total, page, pageCount };
}

/** Clone a product into a new "… (copy)" (active). */
export async function duplicateProduct(orgId: number, id: number): Promise<number | null> {
  await ensureSchema();
  const [rows] = await getPool().query<ProductRow[]>("SELECT * FROM crm_products WHERE id = ? AND organization_id = ? LIMIT 1", [id, orgId]);
  const p = rows[0];
  if (!p) return null;
  return createProduct(orgId, {
    name: `${p.name} (copy)`.slice(0, 190),
    sku: p.sku,
    description: p.description,
    priceCents: p.price_cents,
    billing: p.billing,
    active: true,
  });
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
  public_token: string;
  sent_at: Date | null;
  decided_at: Date | null;
  client_name: string;
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

/** Clone a quote (+ its line items) into a new draft for the same company. */
export async function duplicateQuote(orgId: number, id: number): Promise<number | null> {
  await ensureSchema();
  const src = await getQuote(orgId, id);
  if (!src) return null;
  const newId = await createQuote(orgId, src.quote.company_id, { notes: src.quote.notes, validUntil: null });
  for (const it of src.items) {
    await addQuoteItem(orgId, newId, { productId: it.product_id, name: it.name, unitPriceCents: it.unit_price_cents, quantity: it.quantity });
  }
  return newId;
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

// ---- Quote client-share + accept flow --------------------------------------

/** Give a quote a public share token if it lacks one, and stamp it sent
 *  (draft -> sent). Returns the token, or null if the quote isn't this org's. */
export async function shareQuote(orgId: number, id: number, newToken: string): Promise<string | null> {
  await ensureSchema();
  const pool = getPool();
  const [rows] = await pool.query<QuoteRow[]>("SELECT public_token FROM crm_quotes WHERE id = ? AND organization_id = ? LIMIT 1", [id, orgId]);
  const row = rows[0];
  if (!row) return null;
  const token = row.public_token || newToken.slice(0, 64);
  await pool.query(
    "UPDATE crm_quotes SET public_token = ?, status = IF(status = 'draft', 'sent', status), sent_at = COALESCE(sent_at, CURRENT_TIMESTAMP) WHERE id = ? AND organization_id = ?",
    [token, id, orgId]
  );
  return token;
}

/** Public lookup by share token. Empty/short tokens are rejected so the default
 *  empty `public_token` of un-shared quotes can never be matched. */
export async function getQuoteByToken(token: string): Promise<{ quote: QuoteStatsRow; items: QuoteItemRow[] } | null> {
  const t = (token || "").trim();
  if (t.length < 8) return null;
  await ensureSchema();
  const pool = getPool();
  const [qRows] = await pool.query<QuoteStatsRow[]>(
    "SELECT q.*, co.name AS company_name FROM crm_quotes q JOIN crm_companies co ON co.id = q.company_id AND co.organization_id = q.organization_id WHERE q.public_token = ? LIMIT 1",
    [t.slice(0, 64)]
  );
  const quote = qRows[0];
  if (!quote) return null;
  const [items] = await pool.query<QuoteItemRow[]>("SELECT * FROM crm_quote_items WHERE quote_id = ? AND organization_id = ? ORDER BY id ASC", [quote.id, quote.organization_id]);
  return { quote, items };
}

/** Public: record the client's accept/decline once. Idempotent — a quote that is
 *  already accepted/declined is not changed, and `alreadyDecided` says so. */
export async function recordQuoteDecision(
  token: string,
  decision: "accepted" | "declined",
  clientName: string
): Promise<{ organizationId: number; quoteId: number; companyId: number; status: string; alreadyDecided: boolean; expired: boolean } | null> {
  const t = (token || "").trim();
  if (t.length < 8) return null;
  await ensureSchema();
  const pool = getPool();
  const [rows] = await pool.query<QuoteRow[]>("SELECT * FROM crm_quotes WHERE public_token = ? LIMIT 1", [t.slice(0, 64)]);
  const q = rows[0];
  if (!q) return null;
  const alreadyDecided = q.status === "accepted" || q.status === "declined";
  // Expired quotes can't be acted on (unless already decided) — a client
  // shouldn't be able to accept a stale price.
  const todayYmd = new Date().toISOString().slice(0, 10);
  const vu = q.valid_until ? new Date(q.valid_until).toISOString().slice(0, 10) : null;
  const expired = !alreadyDecided && isQuoteExpired(vu, todayYmd);
  if (!alreadyDecided && !expired) {
    await pool.query(
      "UPDATE crm_quotes SET status = ?, decided_at = CURRENT_TIMESTAMP, client_name = ? WHERE id = ? AND organization_id = ?",
      [decision, clientName.slice(0, 190), q.id, q.organization_id]
    );
  }
  return {
    organizationId: q.organization_id,
    quoteId: q.id,
    companyId: q.company_id,
    status: alreadyDecided || expired ? q.status : decision,
    alreadyDecided,
    expired,
  };
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
  wonCount: number;
  lostCount: number;
}
export async function analyticsDealsByOwner(orgId: number): Promise<OwnerRow[]> {
  await ensureSchema();
  const [rows] = await getPool().query<mysql.RowDataPacket[]>(
    `SELECT COALESCE(NULLIF(owner, ''), 'Unassigned') AS owner,
       COALESCE(SUM(CASE WHEN stage = 'won' THEN value ELSE 0 END), 0) AS won,
       COALESCE(SUM(CASE WHEN stage NOT IN ('won','lost') THEN value ELSE 0 END), 0) AS open,
       COALESCE(SUM(CASE WHEN stage = 'won' THEN 1 ELSE 0 END), 0) AS won_n,
       COALESCE(SUM(CASE WHEN stage = 'lost' THEN 1 ELSE 0 END), 0) AS lost_n,
       COUNT(*) AS n
     FROM crm_deals WHERE organization_id = ? GROUP BY owner ORDER BY won DESC, open DESC LIMIT 20`,
    [orgId]
  );
  return rows.map((r) => ({ owner: String(r.owner), won: Number(r.won), open: Number(r.open), n: Number(r.n), wonCount: Number(r.won_n), lostCount: Number(r.lost_n) }));
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

// Monthly trend series (last 12 calendar months). SINCE_12 has no user input.
export interface MonthRow {
  month: string;
  n: number;
  v: number;
}
const SINCE_12 = "DATE_SUB(DATE_FORMAT(NOW(),'%Y-%m-01'), INTERVAL 11 MONTH)";
async function monthlySeries(sql: string, orgId: number): Promise<MonthRow[]> {
  await ensureSchema();
  const [rows] = await getPool().query<mysql.RowDataPacket[]>(sql, [orgId]);
  return rows.map((r) => ({ month: String(r.month), n: Number(r.n), v: Number(r.v ?? 0) }));
}

export const analyticsWonByMonth = (orgId: number) =>
  monthlySeries(
    `SELECT DATE_FORMAT(closed_at,'%Y-%m') AS month, COUNT(*) AS n, COALESCE(SUM(value),0) AS v
     FROM crm_deals WHERE organization_id = ? AND stage = 'won' AND closed_at IS NOT NULL AND closed_at >= ${SINCE_12}
     GROUP BY month ORDER BY month ASC`,
    orgId
  );

export const analyticsActivitiesByMonth = (orgId: number) =>
  monthlySeries(
    `SELECT DATE_FORMAT(created_at,'%Y-%m') AS month, COUNT(*) AS n
     FROM crm_activities WHERE organization_id = ? AND created_at >= ${SINCE_12}
     GROUP BY month ORDER BY month ASC`,
    orgId
  );

export const analyticsLeadsByMonth = (orgId: number) =>
  monthlySeries(
    `SELECT DATE_FORMAT(created_at,'%Y-%m') AS month, COUNT(*) AS n
     FROM crm_leads WHERE organization_id = ? AND created_at >= ${SINCE_12}
     GROUP BY month ORDER BY month ASC`,
    orgId
  );

export const analyticsDealsCreatedByMonth = (orgId: number) =>
  monthlySeries(
    `SELECT DATE_FORMAT(created_at,'%Y-%m') AS month, COUNT(*) AS n, COALESCE(SUM(value),0) AS v
     FROM crm_deals WHERE organization_id = ? AND created_at >= ${SINCE_12}
     GROUP BY month ORDER BY month ASC`,
    orgId
  );

export interface TopDealRow {
  id: number;
  title: string;
  companyName: string;
  value: number;
  stage: string;
}
export async function analyticsTopOpenDeals(orgId: number, limit: number): Promise<TopDealRow[]> {
  await ensureSchema();
  const [rows] = await getPool().query<mysql.RowDataPacket[]>(
    `SELECT d.id, d.title, d.value, d.stage, co.name AS company_name
     FROM crm_deals d JOIN crm_companies co ON co.id = d.company_id AND co.organization_id = d.organization_id
     WHERE d.organization_id = ? AND d.stage NOT IN ('won','lost')
     ORDER BY d.value DESC LIMIT ?`,
    [orgId, Number(limit) || 8]
  );
  return rows.map((r) => ({ id: Number(r.id), title: String(r.title), companyName: String(r.company_name), value: Number(r.value), stage: String(r.stage) }));
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

/** Open deals that have gone quiet: at least N days old and no activity logged
 *  in the last N days (distinct from overdue, which is past the close date). */
export async function nbaIdleDeals(orgId: number, days: number, limit: number): Promise<{ id: number; companyId: number; companyName: string; title: string; idleDays: number | null }[]> {
  await ensureSchema();
  const d = Number(days) || 14;
  const [rows] = await getPool().query<mysql.RowDataPacket[]>(
    `SELECT d.id, d.company_id, d.title, co.name AS company_name,
            DATEDIFF(NOW(), (SELECT MAX(a.created_at) FROM crm_activities a WHERE a.deal_id = d.id)) AS idle_days
     FROM crm_deals d JOIN crm_companies co ON co.id = d.company_id AND co.organization_id = d.organization_id
     WHERE d.organization_id = ? AND d.stage NOT IN ('won','lost') AND d.created_at < NOW() - INTERVAL ${d} DAY
       AND ((SELECT MAX(a.created_at) FROM crm_activities a WHERE a.deal_id = d.id) IS NULL
            OR (SELECT MAX(a.created_at) FROM crm_activities a WHERE a.deal_id = d.id) < NOW() - INTERVAL ${d} DAY)
     ORDER BY idle_days IS NULL DESC, idle_days DESC LIMIT ?`,
    [orgId, Number(limit) || 5]
  );
  return rows.map((r) => ({ id: Number(r.id), companyId: Number(r.company_id), companyName: String(r.company_name), title: String(r.title), idleDays: r.idle_days == null ? null : Number(r.idle_days) }));
}

/** Companies that closed a won deal in the last N days — new customers to
 *  onboard (approximates "customer since" via the latest won close). */
export async function nbaNewCustomers(orgId: number, days: number, limit: number): Promise<{ id: number; name: string; days: number }[]> {
  await ensureSchema();
  const d = Number(days) || 7;
  const [rows] = await getPool().query<mysql.RowDataPacket[]>(
    `SELECT co.id, co.name, DATEDIFF(NOW(), MAX(d.closed_at)) AS days
     FROM crm_companies co JOIN crm_deals d ON d.company_id = co.id AND d.organization_id = co.organization_id
     WHERE co.organization_id = ? AND d.stage = 'won' AND d.closed_at IS NOT NULL AND d.closed_at >= NOW() - INTERVAL ${d} DAY
     GROUP BY co.id, co.name
     ORDER BY MAX(d.closed_at) DESC LIMIT ?`,
    [orgId, Number(limit) || 5]
  );
  return rows.map((r) => ({ id: Number(r.id), name: String(r.name), days: Number(r.days) }));
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
export async function getAutomation(orgId: number, id: number): Promise<AutomationRow | null> {
  await ensureSchema();
  const [rows] = await getPool().query<AutomationRow[]>("SELECT * FROM crm_automations WHERE id = ? AND organization_id = ? LIMIT 1", [id, orgId]);
  return rows[0] ?? null;
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
      // Emergency kill-switches (owner-controlled incident response).
      await ensureColumn(pool, "crm_organizations", "api_frozen", "api_frozen TINYINT NOT NULL DEFAULT 0");
      await ensureColumn(pool, "crm_organizations", "ai_paused", "ai_paused TINYINT NOT NULL DEFAULT 0");
      await ensureColumn(pool, "crm_organizations", "automations_paused", "automations_paused TINYINT NOT NULL DEFAULT 0");
      // Record-level access: when on, members see only their own (or unassigned) records.
      await ensureColumn(pool, "crm_organizations", "restrict_member_visibility", "restrict_member_visibility TINYINT NOT NULL DEFAULT 0");
      await ensureColumn(pool, "crm_organizations", "require_admin_mfa", "require_admin_mfa TINYINT NOT NULL DEFAULT 0");
      // Meeting reminders: set once a "starting soon" notification has fired.
      await ensureColumn(pool, "crm_meetings", "reminded", "reminded TINYINT(1) NOT NULL DEFAULT 0");
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
      // Two-factor (TOTP) — secret stored ENCRYPTED (app-level, key in env).
      await ensureColumn(pool, "crm_users", "totp_secret", "totp_secret VARCHAR(255) NOT NULL DEFAULT ''");
      await ensureColumn(pool, "crm_users", "totp_enabled", "totp_enabled TINYINT NOT NULL DEFAULT 0");
      await pool.query(`
        CREATE TABLE IF NOT EXISTS crm_recovery_codes (
          id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
          user_id INT UNSIGNED NOT NULL,
          code_hash CHAR(64) NOT NULL,
          used_at TIMESTAMP NULL,
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          INDEX idx_recovery_user (user_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
      `);
      await pool.query(`
        CREATE TABLE IF NOT EXISTS crm_mfa_challenges (
          id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
          user_id INT UNSIGNED NOT NULL,
          token_hash CHAR(64) NOT NULL,
          expires_at TIMESTAMP NOT NULL,
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          UNIQUE KEY uq_mfa_token (token_hash),
          INDEX idx_mfa_user (user_id)
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
      // Device/session metadata for the "active sessions" view (idempotent for prod).
      await ensureColumn(pool, "crm_sessions", "ip", "ip VARCHAR(45) NOT NULL DEFAULT ''");
      await ensureColumn(pool, "crm_sessions", "user_agent", "user_agent VARCHAR(255) NOT NULL DEFAULT ''");
      await ensureColumn(pool, "crm_sessions", "last_used_at", "last_used_at TIMESTAMP NULL");
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
      // Request context on each audit event (added later; idempotent for prod).
      await ensureColumn(pool, "crm_audit_logs", "ip", "ip VARCHAR(45) NOT NULL DEFAULT ''");
      await ensureColumn(pool, "crm_audit_logs", "user_agent", "user_agent VARCHAR(255) NOT NULL DEFAULT ''");
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
      // API-key expiry + scopes (added later; idempotent for prod). Existing keys
      // default to all scopes + no expiry, so they keep working unchanged.
      await ensureColumn(pool, "crm_api_keys", "expires_at", "expires_at TIMESTAMP NULL");
      await ensureColumn(pool, "crm_api_keys", "scopes", "scopes VARCHAR(255) NOT NULL DEFAULT 'companies,contacts,deals'");
      // Active security alerts (#5): high-severity events an owner should notice,
      // persisted so they can be acknowledged (not just a scrolling feed).
      await pool.query(`
        CREATE TABLE IF NOT EXISTS crm_security_alerts (
          id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
          organization_id INT UNSIGNED NOT NULL,
          type VARCHAR(40) NOT NULL DEFAULT '',
          severity VARCHAR(10) NOT NULL DEFAULT 'medium',
          message VARCHAR(300) NOT NULL DEFAULT '',
          actor_email VARCHAR(190) NOT NULL DEFAULT '',
          meta VARCHAR(500) NOT NULL DEFAULT '',
          acknowledged_at TIMESTAMP NULL,
          acknowledged_by VARCHAR(190) NOT NULL DEFAULT '',
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          INDEX idx_alert_org (organization_id, acknowledged_at, id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
      `);
      // Optional outbound alert channel (owner-set, https+public only). Empty = off.
      await ensureColumn(pool, "crm_organizations", "security_webhook_url", "security_webhook_url VARCHAR(500) NOT NULL DEFAULT ''");
      // Per-org outbound mailbox (SMTP) for sending email from the CRM. The
      // password is AES-256-GCM encrypted at rest (never stored or returned in
      // clear). One row per org.
      await pool.query(`
        CREATE TABLE IF NOT EXISTS crm_email_settings (
          organization_id INT UNSIGNED NOT NULL PRIMARY KEY,
          host VARCHAR(190) NOT NULL DEFAULT '',
          port INT UNSIGNED NOT NULL DEFAULT 587,
          secure TINYINT NOT NULL DEFAULT 0,
          username VARCHAR(190) NOT NULL DEFAULT '',
          password_enc VARCHAR(1024) NOT NULL DEFAULT '',
          from_name VARCHAR(120) NOT NULL DEFAULT '',
          from_email VARCHAR(190) NOT NULL DEFAULT '',
          enabled TINYINT NOT NULL DEFAULT 0,
          updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
      `);
      // Incoming mail (IMAP) — reuses the SMTP username/password. Empty host = off.
      await ensureColumn(pool, "crm_email_settings", "imap_host", "imap_host VARCHAR(190) NOT NULL DEFAULT ''");
      await ensureColumn(pool, "crm_email_settings", "imap_port", "imap_port INT UNSIGNED NOT NULL DEFAULT 993");
      // Per-org IMAP sync cursor (last processed UID + uidvalidity).
      await pool.query(`
        CREATE TABLE IF NOT EXISTS crm_email_sync (
          organization_id INT UNSIGNED NOT NULL PRIMARY KEY,
          last_uid BIGINT UNSIGNED NOT NULL DEFAULT 0,
          uid_validity BIGINT UNSIGNED NOT NULL DEFAULT 0,
          last_synced_at TIMESTAMP NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
      `);
      // Global cron heartbeat — one row, stamped every tick, so a dead cron is
      // visible (nothing else would surface it).
      await pool.query(`
        CREATE TABLE IF NOT EXISTS crm_heartbeat (
          id TINYINT UNSIGNED NOT NULL PRIMARY KEY,
          last_cron_at TIMESTAMP NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
      `);
      // Event notifications (email opened, reply received, deal won…). user_email
      // NULL = whole team; otherwise targeted to one person. Per-user read state
      // is a "seen" timestamp on the user row (below).
      await pool.query(`
        CREATE TABLE IF NOT EXISTS crm_notifications (
          id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
          organization_id INT UNSIGNED NOT NULL,
          user_email VARCHAR(190) NULL,
          type VARCHAR(40) NOT NULL DEFAULT '',
          title VARCHAR(300) NOT NULL DEFAULT '',
          href VARCHAR(300) NOT NULL DEFAULT '',
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          INDEX idx_notif_org (organization_id, id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
      `);
      await ensureColumn(pool, "crm_users", "notifications_seen_at", "notifications_seen_at TIMESTAMP NULL");
      // Meetings — scheduled events optionally linked to a company/contact/deal.
      await pool.query(`
        CREATE TABLE IF NOT EXISTS crm_meetings (
          id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
          organization_id INT UNSIGNED NOT NULL,
          title VARCHAR(200) NOT NULL DEFAULT '',
          starts_at TIMESTAMP NOT NULL,
          duration_min INT UNSIGNED NOT NULL DEFAULT 30,
          company_id INT UNSIGNED NULL,
          contact_id INT UNSIGNED NULL,
          deal_id INT UNSIGNED NULL,
          location VARCHAR(200) NOT NULL DEFAULT '',
          notes TEXT NULL,
          created_by VARCHAR(190) NOT NULL DEFAULT '',
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          INDEX idx_meeting_org (organization_id, starts_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
      `);
      // Public lead-capture forms — each has an unguessable public token that maps
      // to exactly one org; submissions arrive over the unauthenticated /api/forms
      // route and create a lead. The token is public by design (like the tracking
      // pixel), so it is stored in plaintext.
      await pool.query(`
        CREATE TABLE IF NOT EXISTS crm_capture_forms (
          id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
          organization_id INT UNSIGNED NOT NULL,
          token VARCHAR(64) NOT NULL,
          name VARCHAR(120) NOT NULL DEFAULT '',
          title VARCHAR(200) NOT NULL DEFAULT '',
          description VARCHAR(500) NOT NULL DEFAULT '',
          success_message VARCHAR(500) NOT NULL DEFAULT '',
          redirect_url VARCHAR(500) NOT NULL DEFAULT '',
          require_company TINYINT(1) NOT NULL DEFAULT 0,
          notify TINYINT(1) NOT NULL DEFAULT 1,
          active TINYINT(1) NOT NULL DEFAULT 1,
          submissions INT UNSIGNED NOT NULL DEFAULT 0,
          created_by VARCHAR(190) NOT NULL DEFAULT '',
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          UNIQUE KEY uq_capture_token (token),
          INDEX idx_capture_org (organization_id, id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
      `);
      // Sales goals / quotas — a target per owner (0 = whole team), metric and
      // month. One row per (owner, metric, month); upserts adjust the target.
      await pool.query(`
        CREATE TABLE IF NOT EXISTS crm_goals (
          id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
          organization_id INT UNSIGNED NOT NULL,
          owner_user_id INT UNSIGNED NOT NULL DEFAULT 0,
          metric VARCHAR(20) NOT NULL DEFAULT 'revenue',
          period_month VARCHAR(7) NOT NULL DEFAULT '',
          target_amount BIGINT UNSIGNED NOT NULL DEFAULT 0,
          created_by VARCHAR(190) NOT NULL DEFAULT '',
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          UNIQUE KEY uq_goal (organization_id, owner_user_id, metric, period_month),
          INDEX idx_goal_period (organization_id, period_month)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
      `);
      // Commission rate per rep (owner 0 = org default), in basis points
      // (1000 = 10%). Commission earned is derived from won deals x rate; only
      // payouts are stored.
      await pool.query(`
        CREATE TABLE IF NOT EXISTS crm_commission_rates (
          id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
          organization_id INT UNSIGNED NOT NULL,
          owner_user_id INT UNSIGNED NOT NULL DEFAULT 0,
          rate_bp INT UNSIGNED NOT NULL DEFAULT 0,
          updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          UNIQUE KEY uq_comm_rate (organization_id, owner_user_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
      `);
      // A commission payout record. Its presence marks a rep+month as paid; the
      // amount is snapshotted so later deal/rate edits don't rewrite history.
      await pool.query(`
        CREATE TABLE IF NOT EXISTS crm_commission_payouts (
          id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
          organization_id INT UNSIGNED NOT NULL,
          owner_user_id INT UNSIGNED NOT NULL,
          period_month VARCHAR(7) NOT NULL DEFAULT '',
          amount_cents BIGINT UNSIGNED NOT NULL DEFAULT 0,
          paid_by VARCHAR(190) NOT NULL DEFAULT '',
          note VARCHAR(300) NOT NULL DEFAULT '',
          paid_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          UNIQUE KEY uq_comm_payout (organization_id, owner_user_id, period_month),
          INDEX idx_comm_payout_period (organization_id, period_month)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
      `);
      // Reusable email templates (subject + body with {{name}}/{{company}} vars).
      await pool.query(`
        CREATE TABLE IF NOT EXISTS crm_email_templates (
          id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
          organization_id INT UNSIGNED NOT NULL,
          name VARCHAR(120) NOT NULL DEFAULT '',
          subject VARCHAR(300) NOT NULL DEFAULT '',
          body TEXT NULL,
          created_by VARCHAR(190) NOT NULL DEFAULT '',
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_tmpl_org (organization_id, name)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
      `);
      // Sent emails with open tracking. `token` is the unguessable id in the
      // tracking pixel URL; opened_at/open_count are stamped when it loads.
      await pool.query(`
        CREATE TABLE IF NOT EXISTS crm_email_sends (
          id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
          organization_id INT UNSIGNED NOT NULL,
          token CHAR(48) NOT NULL,
          contact_id INT UNSIGNED NULL,
          company_id INT UNSIGNED NULL,
          deal_id INT UNSIGNED NULL,
          to_email VARCHAR(190) NOT NULL DEFAULT '',
          subject VARCHAR(300) NOT NULL DEFAULT '',
          sent_by VARCHAR(190) NOT NULL DEFAULT '',
          sent_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          opened_at TIMESTAMP NULL,
          open_count INT UNSIGNED NOT NULL DEFAULT 0,
          UNIQUE KEY uq_send_token (token),
          INDEX idx_send_org (organization_id, id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
      `);
      // Scheduled ("send later") emails — the cron tick delivers due ones.
      await pool.query(`
        CREATE TABLE IF NOT EXISTS crm_scheduled_emails (
          id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
          organization_id INT UNSIGNED NOT NULL,
          scheduled_by VARCHAR(190) NOT NULL DEFAULT '',
          to_email VARCHAR(190) NOT NULL DEFAULT '',
          subject VARCHAR(300) NOT NULL DEFAULT '',
          body TEXT NULL,
          contact_id INT UNSIGNED NULL,
          company_id INT UNSIGNED NULL,
          deal_id INT UNSIGNED NULL,
          track TINYINT NOT NULL DEFAULT 1,
          send_at TIMESTAMP NOT NULL,
          status VARCHAR(12) NOT NULL DEFAULT 'pending',
          error VARCHAR(300) NOT NULL DEFAULT '',
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          sent_at TIMESTAMP NULL,
          INDEX idx_sched_due (status, send_at),
          INDEX idx_sched_org (organization_id, status, send_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
      `);
      // Multi-step follow-up sequences: a sequence, its ordered steps, and per-
      // contact enrollments the cron advances.
      await pool.query(`
        CREATE TABLE IF NOT EXISTS crm_sequences (
          id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
          organization_id INT UNSIGNED NOT NULL,
          name VARCHAR(120) NOT NULL DEFAULT '',
          stop_on_open TINYINT NOT NULL DEFAULT 0,
          created_by VARCHAR(190) NOT NULL DEFAULT '',
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_seq_org (organization_id, name)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
      `);
      await pool.query(`
        CREATE TABLE IF NOT EXISTS crm_sequence_steps (
          id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
          organization_id INT UNSIGNED NOT NULL,
          sequence_id INT UNSIGNED NOT NULL,
          step_order INT UNSIGNED NOT NULL DEFAULT 0,
          delay_days INT UNSIGNED NOT NULL DEFAULT 0,
          subject VARCHAR(300) NOT NULL DEFAULT '',
          body TEXT NULL,
          INDEX idx_step_seq (sequence_id, step_order)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
      `);
      await pool.query(`
        CREATE TABLE IF NOT EXISTS crm_sequence_enrollments (
          id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
          organization_id INT UNSIGNED NOT NULL,
          sequence_id INT UNSIGNED NOT NULL,
          contact_id INT UNSIGNED NULL,
          company_id INT UNSIGNED NULL,
          to_email VARCHAR(190) NOT NULL DEFAULT '',
          recipient_name VARCHAR(190) NOT NULL DEFAULT '',
          company_name VARCHAR(190) NOT NULL DEFAULT '',
          enrolled_by VARCHAR(190) NOT NULL DEFAULT '',
          current_step INT UNSIGNED NOT NULL DEFAULT 0,
          next_send_at TIMESTAMP NOT NULL,
          status VARCHAR(12) NOT NULL DEFAULT 'active',
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_enr_due (status, next_send_at),
          INDEX idx_enr_org (organization_id, sequence_id),
          INDEX idx_enr_contact (organization_id, contact_id, status)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
      `);
      // Link tracked sends back to a sequence enrollment (for stop-on-open).
      await ensureColumn(pool, "crm_email_sends", "enrollment_id", "enrollment_id BIGINT UNSIGNED NULL");
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
  api_frozen: number;
  ai_paused: number;
  automations_paused: number;
}

export interface OrgFlags {
  apiFrozen: boolean;
  aiPaused: boolean;
  automationsPaused: boolean;
  restrictMembers: boolean;
  requireAdminMfa: boolean;
}

const ORG_FLAG_COLUMN: Record<string, string> = {
  api: "api_frozen",
  ai: "ai_paused",
  automations: "automations_paused",
  restrict_members: "restrict_member_visibility",
  require_admin_mfa: "require_admin_mfa",
};

export async function getOrgFlags(orgId: number): Promise<OrgFlags> {
  await ensureAuthSchema();
  const [rows] = await getPool().query<mysql.RowDataPacket[]>(
    "SELECT api_frozen, ai_paused, automations_paused, restrict_member_visibility, require_admin_mfa FROM crm_organizations WHERE id = ? LIMIT 1",
    [orgId]
  );
  const r = rows[0];
  return {
    apiFrozen: !!r?.api_frozen,
    aiPaused: !!r?.ai_paused,
    automationsPaused: !!r?.automations_paused,
    restrictMembers: !!r?.restrict_member_visibility,
    requireAdminMfa: !!r?.require_admin_mfa,
  };
}

/** Set one emergency flag. `flag` is an allowlisted key, never raw SQL. */
export async function setOrgFlag(orgId: number, flag: string, on: boolean): Promise<boolean> {
  const col = ORG_FLAG_COLUMN[flag];
  if (!col) return false;
  await ensureAuthSchema();
  await getPool().query(`UPDATE crm_organizations SET ${col} = ? WHERE id = ?`, [on ? 1 : 0, orgId]);
  return true;
}

// ------------------------------------------------------------ security alerts

export interface SecurityAlertRow extends mysql.RowDataPacket {
  id: number;
  type: string;
  severity: string;
  message: string;
  actor_email: string;
  meta: string;
  acknowledged_at: Date | null;
  acknowledged_by: string;
  created_at: Date;
}

export interface SecurityAlertInput {
  type: string;
  severity: "low" | "medium" | "high";
  message: string;
  actorEmail?: string;
  meta?: string;
}

export async function insertSecurityAlert(orgId: number, a: SecurityAlertInput): Promise<number> {
  await ensureAuthSchema();
  const [res] = await getPool().query<mysql.ResultSetHeader>(
    `INSERT INTO crm_security_alerts (organization_id, type, severity, message, actor_email, meta)
       VALUES (?, ?, ?, ?, ?, ?)`,
    [orgId, a.type.slice(0, 40), a.severity.slice(0, 10), stripLogControl(a.message).slice(0, 300), stripLogControl(a.actorEmail ?? "").slice(0, 190), stripLogControl(a.meta ?? "").slice(0, 500)]
  );
  return res.insertId;
}

export async function listSecurityAlerts(orgId: number, opts: { onlyActive?: boolean; limit?: number } = {}): Promise<SecurityAlertRow[]> {
  await ensureAuthSchema();
  const where = opts.onlyActive ? "AND acknowledged_at IS NULL" : "";
  const limit = Math.min(Math.max(opts.limit ?? 50, 1), 200);
  const [rows] = await getPool().query<SecurityAlertRow[]>(
    `SELECT * FROM crm_security_alerts WHERE organization_id = ? ${where} ORDER BY id DESC LIMIT ?`,
    [orgId, limit]
  );
  return rows;
}

export async function countActiveSecurityAlerts(orgId: number): Promise<number> {
  await ensureAuthSchema();
  const [rows] = await getPool().query<mysql.RowDataPacket[]>(
    "SELECT COUNT(*) AS n FROM crm_security_alerts WHERE organization_id = ? AND acknowledged_at IS NULL",
    [orgId]
  );
  return Number(rows[0]?.n ?? 0);
}

export async function acknowledgeSecurityAlert(orgId: number, id: number, byEmail: string): Promise<void> {
  await ensureAuthSchema();
  await getPool().query(
    "UPDATE crm_security_alerts SET acknowledged_at = CURRENT_TIMESTAMP, acknowledged_by = ? WHERE organization_id = ? AND id = ? AND acknowledged_at IS NULL",
    [byEmail.slice(0, 190), orgId, id]
  );
}

export async function acknowledgeAllSecurityAlerts(orgId: number, byEmail: string): Promise<number> {
  await ensureAuthSchema();
  const [res] = await getPool().query<mysql.ResultSetHeader>(
    "UPDATE crm_security_alerts SET acknowledged_at = CURRENT_TIMESTAMP, acknowledged_by = ? WHERE organization_id = ? AND acknowledged_at IS NULL",
    [byEmail.slice(0, 190), orgId]
  );
  return res.affectedRows ?? 0;
}

export async function getOrgSecurityWebhook(orgId: number): Promise<string> {
  await ensureAuthSchema();
  const [rows] = await getPool().query<mysql.RowDataPacket[]>(
    "SELECT security_webhook_url FROM crm_organizations WHERE id = ? LIMIT 1",
    [orgId]
  );
  return String(rows[0]?.security_webhook_url ?? "");
}

export async function setOrgSecurityWebhook(orgId: number, url: string): Promise<void> {
  await ensureAuthSchema();
  await getPool().query("UPDATE crm_organizations SET security_webhook_url = ? WHERE id = ?", [url.slice(0, 500), orgId]);
}

// ---------------------------------------------------------- email (SMTP) settings

export interface EmailSettingsRow extends mysql.RowDataPacket {
  organization_id: number;
  host: string;
  port: number;
  secure: number;
  username: string;
  password_enc: string;
  from_name: string;
  from_email: string;
  enabled: number;
  imap_host: string;
  imap_port: number;
  updated_at: Date;
}

export interface EmailSettingsInput {
  host: string;
  port: number;
  secure: boolean;
  username: string;
  /** Already-encrypted password. Pass null to keep the stored one unchanged. */
  passwordEnc: string | null;
  fromName: string;
  fromEmail: string;
  enabled: boolean;
  imapHost: string;
  imapPort: number;
}

export async function getEmailSettings(orgId: number): Promise<EmailSettingsRow | null> {
  await ensureAuthSchema();
  const [rows] = await getPool().query<EmailSettingsRow[]>(
    "SELECT * FROM crm_email_settings WHERE organization_id = ? LIMIT 1",
    [orgId]
  );
  return rows[0] ?? null;
}

/** Upsert the org's mailbox. When passwordEnc is null the existing encrypted
 *  password is preserved (so editing other fields doesn't require re-entering it). */
export async function upsertEmailSettings(orgId: number, s: EmailSettingsInput): Promise<void> {
  await ensureAuthSchema();
  const pwdClause = s.passwordEnc === null ? "" : ", password_enc = VALUES(password_enc)";
  await getPool().query(
    `INSERT INTO crm_email_settings (organization_id, host, port, secure, username, password_enc, from_name, from_email, enabled, imap_host, imap_port)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE host = VALUES(host), port = VALUES(port), secure = VALUES(secure),
       username = VALUES(username)${pwdClause}, from_name = VALUES(from_name), from_email = VALUES(from_email), enabled = VALUES(enabled),
       imap_host = VALUES(imap_host), imap_port = VALUES(imap_port)`,
    [
      orgId,
      s.host.slice(0, 190),
      s.port,
      s.secure ? 1 : 0,
      s.username.slice(0, 190),
      (s.passwordEnc ?? "").slice(0, 1024),
      s.fromName.slice(0, 120),
      s.fromEmail.slice(0, 190),
      s.enabled ? 1 : 0,
      s.imapHost.slice(0, 190),
      s.imapPort,
    ]
  );
}

// ---------------------------------------------------------- email templates

export interface EmailTemplateRow extends mysql.RowDataPacket {
  id: number;
  name: string;
  subject: string;
  body: string | null;
  created_by: string;
  created_at: Date;
  updated_at: Date;
}

export async function listEmailTemplates(orgId: number): Promise<EmailTemplateRow[]> {
  await ensureAuthSchema();
  const [rows] = await getPool().query<EmailTemplateRow[]>(
    "SELECT * FROM crm_email_templates WHERE organization_id = ? ORDER BY name ASC, id ASC",
    [orgId]
  );
  return rows;
}

export async function createEmailTemplate(orgId: number, t: { name: string; subject: string; body: string; createdBy: string }): Promise<number> {
  await ensureAuthSchema();
  const [res] = await getPool().query<mysql.ResultSetHeader>(
    "INSERT INTO crm_email_templates (organization_id, name, subject, body, created_by) VALUES (?, ?, ?, ?, ?)",
    [orgId, t.name.slice(0, 120), t.subject.slice(0, 300), t.body.slice(0, 20000), t.createdBy.slice(0, 190)]
  );
  return res.insertId;
}

export async function updateEmailTemplate(orgId: number, id: number, t: { name: string; subject: string; body: string }): Promise<void> {
  await ensureAuthSchema();
  await getPool().query(
    "UPDATE crm_email_templates SET name = ?, subject = ?, body = ? WHERE id = ? AND organization_id = ?",
    [t.name.slice(0, 120), t.subject.slice(0, 300), t.body.slice(0, 20000), id, orgId]
  );
}

export async function deleteEmailTemplate(orgId: number, id: number): Promise<void> {
  await ensureAuthSchema();
  await getPool().query("DELETE FROM crm_email_templates WHERE id = ? AND organization_id = ?", [id, orgId]);
}

// ---------------------------------------------------------- email open tracking

export async function createEmailSend(orgId: number, s: { token: string; contactId?: number | null; companyId?: number | null; dealId?: number | null; toEmail: string; subject: string; sentBy: string; enrollmentId?: number | null }): Promise<void> {
  await ensureAuthSchema();
  await getPool().query(
    `INSERT INTO crm_email_sends (organization_id, token, contact_id, company_id, deal_id, to_email, subject, sent_by, enrollment_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [orgId, s.token.slice(0, 48), s.contactId ?? null, s.companyId ?? null, s.dealId ?? null, s.toEmail.slice(0, 190), s.subject.slice(0, 300), s.sentBy.slice(0, 190), s.enrollmentId ?? null]
  );
}

/** Whether any send for this sequence enrollment has been opened (stop-on-open). */
export async function enrollmentHasOpen(enrollmentId: number): Promise<boolean> {
  await ensureAuthSchema();
  const [rows] = await getPool().query<mysql.RowDataPacket[]>(
    "SELECT 1 FROM crm_email_sends WHERE enrollment_id = ? AND opened_at IS NOT NULL LIMIT 1",
    [enrollmentId]
  );
  return rows.length > 0;
}

export interface OpenedSend {
  firstOpen: boolean;
  organizationId: number;
  contactId: number | null;
  companyId: number | null;
  dealId: number | null;
  subject: string;
  sentBy: string;
  toEmail: string;
}

/** Record an open for a tracking token. Returns the send (with firstOpen) so the
 *  caller can log a one-time "opened" activity, or null if the token is unknown. */
export async function markEmailOpened(token: string): Promise<OpenedSend | null> {
  await ensureAuthSchema();
  const [rows] = await getPool().query<mysql.RowDataPacket[]>(
    "SELECT organization_id, contact_id, company_id, deal_id, subject, sent_by, to_email, opened_at FROM crm_email_sends WHERE token = ? LIMIT 1",
    [token]
  );
  const r = rows[0];
  if (!r) return null;
  await getPool().query(
    "UPDATE crm_email_sends SET opened_at = COALESCE(opened_at, CURRENT_TIMESTAMP), open_count = open_count + 1 WHERE token = ?",
    [token]
  );
  return {
    firstOpen: r.opened_at === null,
    organizationId: r.organization_id,
    contactId: r.contact_id,
    companyId: r.company_id,
    dealId: r.deal_id,
    subject: String(r.subject ?? ""),
    sentBy: String(r.sent_by ?? ""),
    toEmail: String(r.to_email ?? ""),
  };
}

export interface EmailSendStats {
  sentAll: number;
  openedAll: number;
  sent30: number;
  opened30: number;
}

export async function emailSendStats(orgId: number): Promise<EmailSendStats> {
  await ensureAuthSchema();
  const [rows] = await getPool().query<mysql.RowDataPacket[]>(
    `SELECT COUNT(*) AS sent_all,
            COALESCE(SUM(opened_at IS NOT NULL), 0) AS opened_all,
            COALESCE(SUM(sent_at >= (NOW() - INTERVAL 30 DAY)), 0) AS sent_30,
            COALESCE(SUM(sent_at >= (NOW() - INTERVAL 30 DAY) AND opened_at IS NOT NULL), 0) AS opened_30
       FROM crm_email_sends WHERE organization_id = ?`,
    [orgId]
  );
  const r = rows[0] ?? {};
  return { sentAll: Number(r.sent_all ?? 0), openedAll: Number(r.opened_all ?? 0), sent30: Number(r.sent_30 ?? 0), opened30: Number(r.opened_30 ?? 0) };
}

export async function emailSendsByRep(orgId: number): Promise<{ rep: string; sent: number; opened: number }[]> {
  await ensureAuthSchema();
  const [rows] = await getPool().query<mysql.RowDataPacket[]>(
    `SELECT sent_by AS rep, COUNT(*) AS sent, COALESCE(SUM(opened_at IS NOT NULL), 0) AS opened
       FROM crm_email_sends WHERE organization_id = ? GROUP BY sent_by ORDER BY sent DESC LIMIT 10`,
    [orgId]
  );
  return rows.map((r) => ({ rep: String(r.rep ?? ""), sent: Number(r.sent ?? 0), opened: Number(r.opened ?? 0) }));
}

export interface RecentSendRow extends mysql.RowDataPacket {
  id: number;
  to_email: string;
  subject: string;
  sent_by: string;
  sent_at: Date;
  opened_at: Date | null;
  open_count: number;
  company_id: number | null;
  company_name: string | null;
}

export async function listRecentEmailSends(orgId: number, limit = 25): Promise<RecentSendRow[]> {
  await ensureAuthSchema();
  await ensureSchema();
  const [rows] = await getPool().query<RecentSendRow[]>(
    `SELECT s.id, s.to_email, s.subject, s.sent_by, s.sent_at, s.opened_at, s.open_count, s.company_id, co.name AS company_name
       FROM crm_email_sends s
       LEFT JOIN crm_companies co ON co.id = s.company_id AND co.organization_id = s.organization_id
      WHERE s.organization_id = ? ORDER BY s.id DESC LIMIT ?`,
    [orgId, Math.min(Math.max(limit, 1), 100)]
  );
  return rows;
}

// ---------------------------------------------------------- scheduled emails

export interface ScheduledEmailRow extends mysql.RowDataPacket {
  id: number;
  organization_id: number;
  scheduled_by: string;
  to_email: string;
  subject: string;
  body: string | null;
  contact_id: number | null;
  company_id: number | null;
  deal_id: number | null;
  track: number;
  send_at: Date;
  status: string;
  error: string;
  created_at: Date;
  sent_at: Date | null;
}

export async function createScheduledEmail(orgId: number, s: { scheduledBy: string; toEmail: string; subject: string; body: string; contactId?: number | null; companyId?: number | null; dealId?: number | null; track: boolean; sendAt: Date }): Promise<number> {
  await ensureAuthSchema();
  const [res] = await getPool().query<mysql.ResultSetHeader>(
    `INSERT INTO crm_scheduled_emails (organization_id, scheduled_by, to_email, subject, body, contact_id, company_id, deal_id, track, send_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [orgId, s.scheduledBy.slice(0, 190), s.toEmail.slice(0, 190), s.subject.slice(0, 300), s.body.slice(0, 20000), s.contactId ?? null, s.companyId ?? null, s.dealId ?? null, s.track ? 1 : 0, s.sendAt]
  );
  return res.insertId;
}

/** Pending + recently-finished scheduled emails for the management view. */
export async function listScheduledEmails(orgId: number, limit = 50): Promise<ScheduledEmailRow[]> {
  await ensureAuthSchema();
  const [rows] = await getPool().query<ScheduledEmailRow[]>(
    `SELECT * FROM crm_scheduled_emails WHERE organization_id = ?
       ORDER BY (status = 'pending') DESC, send_at ASC LIMIT ?`,
    [orgId, Math.min(Math.max(limit, 1), 200)]
  );
  return rows;
}

export async function cancelScheduledEmail(orgId: number, id: number): Promise<void> {
  await ensureAuthSchema();
  await getPool().query("UPDATE crm_scheduled_emails SET status = 'canceled' WHERE id = ? AND organization_id = ? AND status = 'pending'", [id, orgId]);
}

/** Due pending scheduled emails across all orgs — for the cron runner. */
export async function listDueScheduledEmails(limit = 40): Promise<ScheduledEmailRow[]> {
  await ensureAuthSchema();
  const [rows] = await getPool().query<ScheduledEmailRow[]>(
    "SELECT * FROM crm_scheduled_emails WHERE status = 'pending' AND send_at <= NOW() ORDER BY send_at ASC LIMIT ?",
    [Math.min(Math.max(limit, 1), 100)]
  );
  return rows;
}

export async function markScheduledEmail(id: number, status: "sent" | "failed", error = ""): Promise<void> {
  await ensureAuthSchema();
  await getPool().query(
    "UPDATE crm_scheduled_emails SET status = ?, error = ?, sent_at = CURRENT_TIMESTAMP WHERE id = ?",
    [status, error.slice(0, 300), id]
  );
}

// ---------------------------------------------------------- follow-up sequences

export interface SequenceRow extends mysql.RowDataPacket {
  id: number;
  name: string;
  stop_on_open: number;
  created_by: string;
  step_count: number;
  active_count: number;
  total_enrolled: number;
}
export interface SequenceStepRow extends mysql.RowDataPacket {
  id: number;
  sequence_id: number;
  step_order: number;
  delay_days: number;
  subject: string;
  body: string | null;
}
export interface SequenceEnrollmentRow extends mysql.RowDataPacket {
  id: number;
  organization_id: number;
  sequence_id: number;
  contact_id: number | null;
  company_id: number | null;
  to_email: string;
  recipient_name: string;
  company_name: string;
  enrolled_by: string;
  current_step: number;
  next_send_at: Date;
  status: string;
}

export async function listSequences(orgId: number): Promise<SequenceRow[]> {
  await ensureAuthSchema();
  const [rows] = await getPool().query<SequenceRow[]>(
    `SELECT s.id, s.name, s.stop_on_open, s.created_by,
            (SELECT COUNT(*) FROM crm_sequence_steps st WHERE st.sequence_id = s.id) AS step_count,
            (SELECT COUNT(*) FROM crm_sequence_enrollments e WHERE e.sequence_id = s.id AND e.status = 'active') AS active_count,
            (SELECT COUNT(*) FROM crm_sequence_enrollments e WHERE e.sequence_id = s.id) AS total_enrolled
       FROM crm_sequences s WHERE s.organization_id = ? ORDER BY s.name ASC, s.id DESC`,
    [orgId]
  );
  return rows;
}

export async function getSequenceSteps(orgId: number, sequenceId: number): Promise<SequenceStepRow[]> {
  await ensureAuthSchema();
  const [rows] = await getPool().query<SequenceStepRow[]>(
    "SELECT * FROM crm_sequence_steps WHERE sequence_id = ? AND organization_id = ? ORDER BY step_order ASC",
    [sequenceId, orgId]
  );
  return rows;
}

export async function getSequence(orgId: number, id: number): Promise<SequenceRow | null> {
  await ensureAuthSchema();
  const [rows] = await getPool().query<SequenceRow[]>(
    "SELECT id, name, stop_on_open, created_by, 0 AS step_count, 0 AS active_count, 0 AS total_enrolled FROM crm_sequences WHERE id = ? AND organization_id = ? LIMIT 1",
    [id, orgId]
  );
  return rows[0] ?? null;
}

export async function createSequence(orgId: number, s: { name: string; stopOnOpen: boolean; createdBy: string }): Promise<number> {
  await ensureAuthSchema();
  const [res] = await getPool().query<mysql.ResultSetHeader>(
    "INSERT INTO crm_sequences (organization_id, name, stop_on_open, created_by) VALUES (?, ?, ?, ?)",
    [orgId, s.name.slice(0, 120), s.stopOnOpen ? 1 : 0, s.createdBy.slice(0, 190)]
  );
  return res.insertId;
}

export async function updateSequence(orgId: number, id: number, s: { name: string; stopOnOpen: boolean }): Promise<void> {
  await ensureAuthSchema();
  await getPool().query("UPDATE crm_sequences SET name = ?, stop_on_open = ? WHERE id = ? AND organization_id = ?", [s.name.slice(0, 120), s.stopOnOpen ? 1 : 0, id, orgId]);
}

export async function replaceSequenceSteps(orgId: number, sequenceId: number, steps: { delayDays: number; subject: string; body: string }[]): Promise<void> {
  await ensureAuthSchema();
  const pool = getPool();
  await pool.query("DELETE FROM crm_sequence_steps WHERE sequence_id = ? AND organization_id = ?", [sequenceId, orgId]);
  for (let i = 0; i < steps.length; i++) {
    const st = steps[i];
    await pool.query(
      "INSERT INTO crm_sequence_steps (organization_id, sequence_id, step_order, delay_days, subject, body) VALUES (?, ?, ?, ?, ?, ?)",
      [orgId, sequenceId, i, Math.max(0, Math.min(365, st.delayDays | 0)), st.subject.slice(0, 300), st.body.slice(0, 20000)]
    );
  }
}

export async function deleteSequence(orgId: number, id: number): Promise<void> {
  await ensureAuthSchema();
  const pool = getPool();
  await pool.query("DELETE FROM crm_sequence_steps WHERE sequence_id = ? AND organization_id = ?", [id, orgId]);
  await pool.query("UPDATE crm_sequence_enrollments SET status = 'stopped' WHERE sequence_id = ? AND organization_id = ? AND status = 'active'", [id, orgId]);
  await pool.query("DELETE FROM crm_sequences WHERE id = ? AND organization_id = ?", [id, orgId]);
}

export async function activeEnrollmentExists(orgId: number, sequenceId: number, contactId: number): Promise<boolean> {
  await ensureAuthSchema();
  const [rows] = await getPool().query<mysql.RowDataPacket[]>(
    "SELECT 1 FROM crm_sequence_enrollments WHERE organization_id = ? AND sequence_id = ? AND contact_id = ? AND status = 'active' LIMIT 1",
    [orgId, sequenceId, contactId]
  );
  return rows.length > 0;
}

export async function createEnrollment(orgId: number, e: { sequenceId: number; contactId?: number | null; companyId?: number | null; toEmail: string; recipientName: string; companyName: string; enrolledBy: string; nextSendAt: Date }): Promise<number> {
  await ensureAuthSchema();
  const [res] = await getPool().query<mysql.ResultSetHeader>(
    `INSERT INTO crm_sequence_enrollments (organization_id, sequence_id, contact_id, company_id, to_email, recipient_name, company_name, enrolled_by, current_step, next_send_at, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?, 'active')`,
    [orgId, e.sequenceId, e.contactId ?? null, e.companyId ?? null, e.toEmail.slice(0, 190), e.recipientName.slice(0, 190), e.companyName.slice(0, 190), e.enrolledBy.slice(0, 190), e.nextSendAt]
  );
  return res.insertId;
}

export async function listDueEnrollments(limit = 30): Promise<SequenceEnrollmentRow[]> {
  await ensureAuthSchema();
  const [rows] = await getPool().query<SequenceEnrollmentRow[]>(
    "SELECT * FROM crm_sequence_enrollments WHERE status = 'active' AND next_send_at <= NOW() ORDER BY next_send_at ASC LIMIT ?",
    [Math.min(Math.max(limit, 1), 100)]
  );
  return rows;
}

export async function advanceEnrollment(id: number, e: { currentStep: number; nextSendAt: Date | null; status: string }): Promise<void> {
  await ensureAuthSchema();
  await getPool().query(
    "UPDATE crm_sequence_enrollments SET current_step = ?, next_send_at = COALESCE(?, next_send_at), status = ? WHERE id = ?",
    [e.currentStep, e.nextSendAt, e.status, id]
  );
}

export async function stopEnrollment(orgId: number, id: number): Promise<void> {
  await ensureAuthSchema();
  await getPool().query("UPDATE crm_sequence_enrollments SET status = 'stopped' WHERE id = ? AND organization_id = ? AND status = 'active'", [id, orgId]);
}

export async function listContactEnrollments(orgId: number, contactId: number): Promise<{ id: number; sequenceId: number; sequenceName: string; status: string; currentStep: number }[]> {
  await ensureAuthSchema();
  const [rows] = await getPool().query<mysql.RowDataPacket[]>(
    `SELECT e.id, e.sequence_id, e.status, e.current_step, s.name AS sequence_name
       FROM crm_sequence_enrollments e JOIN crm_sequences s ON s.id = e.sequence_id
      WHERE e.organization_id = ? AND e.contact_id = ? AND e.status = 'active' ORDER BY e.id DESC`,
    [orgId, contactId]
  );
  return rows.map((r) => ({ id: r.id, sequenceId: r.sequence_id, sequenceName: String(r.sequence_name ?? ""), status: r.status, currentStep: r.current_step }));
}

// ---------------------------------------------------------- inbox sync (IMAP)

export interface ContactMatch {
  id: number;
  name: string;
  companyId: number;
  companyName: string;
}

export async function getContactByEmail(orgId: number, email: string): Promise<ContactMatch | null> {
  await ensureSchema();
  const [rows] = await getPool().query<mysql.RowDataPacket[]>(
    `SELECT ct.id, ct.name, ct.company_id, co.name AS company_name
       FROM crm_contacts ct LEFT JOIN crm_companies co ON co.id = ct.company_id AND co.organization_id = ct.organization_id
      WHERE ct.organization_id = ? AND LOWER(ct.email) = LOWER(?) LIMIT 1`,
    [orgId, email]
  );
  const r = rows[0];
  return r ? { id: r.id, name: String(r.name ?? ""), companyId: r.company_id, companyName: String(r.company_name ?? "") } : null;
}

/** Stop every active sequence enrollment for a contact (they replied). */
export async function stopContactEnrollments(orgId: number, contactId: number): Promise<number> {
  await ensureAuthSchema();
  const [res] = await getPool().query<mysql.ResultSetHeader>(
    "UPDATE crm_sequence_enrollments SET status = 'stopped' WHERE organization_id = ? AND contact_id = ? AND status = 'active'",
    [orgId, contactId]
  );
  return res.affectedRows ?? 0;
}

export async function getEmailSyncState(orgId: number): Promise<{ lastUid: number; uidValidity: number }> {
  await ensureAuthSchema();
  const [rows] = await getPool().query<mysql.RowDataPacket[]>("SELECT last_uid, uid_validity FROM crm_email_sync WHERE organization_id = ? LIMIT 1", [orgId]);
  const r = rows[0];
  return { lastUid: Number(r?.last_uid ?? 0), uidValidity: Number(r?.uid_validity ?? 0) };
}

export async function setEmailSyncState(orgId: number, lastUid: number, uidValidity: number): Promise<void> {
  await ensureAuthSchema();
  await getPool().query(
    `INSERT INTO crm_email_sync (organization_id, last_uid, uid_validity, last_synced_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP)
       ON DUPLICATE KEY UPDATE last_uid = VALUES(last_uid), uid_validity = VALUES(uid_validity), last_synced_at = CURRENT_TIMESTAMP`,
    [orgId, lastUid, uidValidity]
  );
}

export interface ImapOrgRow extends mysql.RowDataPacket {
  organization_id: number;
  imap_host: string;
  imap_port: number;
  username: string;
  password_enc: string;
}

/** Orgs with an enabled mailbox that also have IMAP configured. */
export async function orgsWithImap(): Promise<ImapOrgRow[]> {
  await ensureAuthSchema();
  const [rows] = await getPool().query<ImapOrgRow[]>(
    "SELECT organization_id, imap_host, imap_port, username, password_enc FROM crm_email_settings WHERE imap_host <> '' AND enabled = 1 LIMIT 50"
  );
  return rows;
}

// ------------------------------------------------------------ cron heartbeat

export async function setCronHeartbeat(): Promise<void> {
  await ensureAuthSchema();
  await getPool().query(
    "INSERT INTO crm_heartbeat (id, last_cron_at) VALUES (1, CURRENT_TIMESTAMP) ON DUPLICATE KEY UPDATE last_cron_at = CURRENT_TIMESTAMP"
  );
}

export async function getCronHeartbeat(): Promise<Date | null> {
  await ensureAuthSchema();
  const [rows] = await getPool().query<mysql.RowDataPacket[]>("SELECT last_cron_at FROM crm_heartbeat WHERE id = 1 LIMIT 1");
  return rows[0]?.last_cron_at ?? null;
}

// ------------------------------------------------------------ notifications

export interface NotificationRow extends mysql.RowDataPacket {
  id: number;
  type: string;
  title: string;
  href: string;
  created_at: Date;
}

export async function createNotification(orgId: number, n: { userEmail?: string | null; type: string; title: string; href?: string }): Promise<void> {
  await ensureAuthSchema();
  await getPool().query(
    "INSERT INTO crm_notifications (organization_id, user_email, type, title, href) VALUES (?, ?, ?, ?, ?)",
    [orgId, n.userEmail ?? null, n.type.slice(0, 40), n.title.slice(0, 300), (n.href ?? "").slice(0, 300)]
  );
}

export async function listNotifications(orgId: number, userEmail: string, limit = 20): Promise<NotificationRow[]> {
  await ensureAuthSchema();
  const [rows] = await getPool().query<NotificationRow[]>(
    `SELECT id, type, title, href, created_at FROM crm_notifications
      WHERE organization_id = ? AND (user_email IS NULL OR user_email = ?)
      ORDER BY id DESC LIMIT ?`,
    [orgId, userEmail, Math.min(Math.max(limit, 1), 100)]
  );
  return rows;
}

export async function countUnreadNotifications(orgId: number, userEmail: string, seenAt: Date | null): Promise<number> {
  await ensureAuthSchema();
  const [rows] = await getPool().query<mysql.RowDataPacket[]>(
    `SELECT COUNT(*) AS n FROM crm_notifications
      WHERE organization_id = ? AND (user_email IS NULL OR user_email = ?) AND created_at > COALESCE(?, '1970-01-01 00:00:00')`,
    [orgId, userEmail, seenAt]
  );
  return Number(rows[0]?.n ?? 0);
}

export async function getNotificationsSeenAt(userId: number): Promise<Date | null> {
  await ensureAuthSchema();
  const [rows] = await getPool().query<mysql.RowDataPacket[]>("SELECT notifications_seen_at FROM crm_users WHERE id = ? LIMIT 1", [userId]);
  return rows[0]?.notifications_seen_at ?? null;
}

export async function setNotificationsSeen(userId: number): Promise<void> {
  await ensureAuthSchema();
  await getPool().query("UPDATE crm_users SET notifications_seen_at = CURRENT_TIMESTAMP WHERE id = ?", [userId]);
}

// ------------------------------------------------------------ meetings

export interface MeetingRow extends mysql.RowDataPacket {
  id: number;
  title: string;
  starts_at: Date;
  duration_min: number;
  company_id: number | null;
  contact_id: number | null;
  deal_id: number | null;
  location: string;
  notes: string | null;
  created_by: string;
  company_name: string | null;
  contact_name: string | null;
}

export interface MeetingInput {
  title: string;
  startsAt: Date;
  durationMin: number;
  companyId?: number | null;
  contactId?: number | null;
  dealId?: number | null;
  location: string;
  notes: string;
}

export async function createMeeting(orgId: number, m: MeetingInput & { createdBy: string }): Promise<number> {
  await ensureAuthSchema();
  const [res] = await getPool().query<mysql.ResultSetHeader>(
    `INSERT INTO crm_meetings (organization_id, title, starts_at, duration_min, company_id, contact_id, deal_id, location, notes, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [orgId, m.title.slice(0, 200), m.startsAt, m.durationMin, m.companyId ?? null, m.contactId ?? null, m.dealId ?? null, m.location.slice(0, 200), m.notes.slice(0, 5000), m.createdBy.slice(0, 190)]
  );
  return res.insertId;
}

export async function updateMeeting(orgId: number, id: number, m: MeetingInput): Promise<void> {
  await ensureAuthSchema();
  await getPool().query(
    `UPDATE crm_meetings SET title=?, starts_at=?, duration_min=?, company_id=?, contact_id=?, deal_id=?, location=?, notes=? WHERE id=? AND organization_id=?`,
    [m.title.slice(0, 200), m.startsAt, m.durationMin, m.companyId ?? null, m.contactId ?? null, m.dealId ?? null, m.location.slice(0, 200), m.notes.slice(0, 5000), id, orgId]
  );
}

export async function deleteMeeting(orgId: number, id: number): Promise<void> {
  await ensureAuthSchema();
  await getPool().query("DELETE FROM crm_meetings WHERE id = ? AND organization_id = ?", [id, orgId]);
}

const MEETING_SELECT = `SELECT m.id, m.title, m.starts_at, m.duration_min, m.company_id, m.contact_id, m.deal_id, m.location, m.notes, m.created_by,
         co.name AS company_name, ct.name AS contact_name
    FROM crm_meetings m
    LEFT JOIN crm_companies co ON co.id = m.company_id AND co.organization_id = m.organization_id
    LEFT JOIN crm_contacts ct ON ct.id = m.contact_id AND ct.organization_id = m.organization_id`;

/** Recent-past (14d) + all upcoming meetings, for the agenda. */
export async function listMeetings(orgId: number): Promise<MeetingRow[]> {
  await ensureAuthSchema();
  await ensureSchema();
  const [rows] = await getPool().query<MeetingRow[]>(
    `${MEETING_SELECT} WHERE m.organization_id = ? AND m.starts_at >= (NOW() - INTERVAL 14 DAY) ORDER BY m.starts_at ASC LIMIT 200`,
    [orgId]
  );
  return rows;
}

export async function getMeeting(orgId: number, id: number): Promise<MeetingRow | null> {
  await ensureAuthSchema();
  await ensureSchema();
  const [rows] = await getPool().query<MeetingRow[]>(`${MEETING_SELECT} WHERE m.id = ? AND m.organization_id = ? LIMIT 1`, [id, orgId]);
  return rows[0] ?? null;
}

/** Today's meetings (for My Day). */
export async function listMeetingsToday(orgId: number): Promise<MeetingRow[]> {
  await ensureAuthSchema();
  await ensureSchema();
  const [rows] = await getPool().query<MeetingRow[]>(
    `${MEETING_SELECT} WHERE m.organization_id = ? AND DATE(m.starts_at) = CURDATE() ORDER BY m.starts_at ASC LIMIT 20`,
    [orgId]
  );
  return rows;
}

export interface MeetingReminderRow extends mysql.RowDataPacket {
  id: number;
  organization_id: number;
  title: string;
  starts_at: Date;
  created_by: string;
}
/** Cross-org: meetings starting within the next `withinMin` minutes that haven't
 *  been reminded yet. Used by the cron seam to fire "starting soon" notices. */
export async function listMeetingsToRemind(withinMin: number): Promise<MeetingReminderRow[]> {
  await ensureAuthSchema();
  const [rows] = await getPool().query<MeetingReminderRow[]>(
    `SELECT id, organization_id, title, starts_at, created_by
       FROM crm_meetings
      WHERE reminded = 0 AND starts_at > NOW() AND starts_at <= (NOW() + INTERVAL ? MINUTE)
      ORDER BY starts_at ASC LIMIT 200`,
    [Math.max(1, Math.min(240, Math.round(withinMin)))]
  );
  return rows;
}

export async function markMeetingReminded(id: number): Promise<void> {
  await getPool().query("UPDATE crm_meetings SET reminded = 1 WHERE id = ?", [id]);
}

// ---- Lead-capture forms ----------------------------------------------------

export interface CaptureFormRow extends mysql.RowDataPacket {
  id: number;
  organization_id: number;
  token: string;
  name: string;
  title: string;
  description: string;
  success_message: string;
  redirect_url: string;
  require_company: number;
  notify: number;
  active: number;
  submissions: number;
  created_by: string;
  created_at: string;
}

export interface CaptureFormInput {
  name: string;
  title: string;
  description: string;
  successMessage: string;
  redirectUrl: string;
  requireCompany: boolean;
  notify: boolean;
  active: boolean;
}

export async function createCaptureForm(orgId: number, token: string, f: CaptureFormInput & { createdBy: string }): Promise<number> {
  await ensureAuthSchema();
  const [res] = await getPool().query<mysql.ResultSetHeader>(
    `INSERT INTO crm_capture_forms (organization_id, token, name, title, description, success_message, redirect_url, require_company, notify, active, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [orgId, token.slice(0, 64), f.name.slice(0, 120), f.title.slice(0, 200), f.description.slice(0, 500), f.successMessage.slice(0, 500), f.redirectUrl.slice(0, 500), f.requireCompany ? 1 : 0, f.notify ? 1 : 0, f.active ? 1 : 0, f.createdBy.slice(0, 190)]
  );
  return res.insertId;
}

export async function updateCaptureForm(orgId: number, id: number, f: CaptureFormInput): Promise<void> {
  await ensureAuthSchema();
  await getPool().query(
    `UPDATE crm_capture_forms SET name = ?, title = ?, description = ?, success_message = ?, redirect_url = ?, require_company = ?, notify = ?, active = ?
       WHERE id = ? AND organization_id = ?`,
    [f.name.slice(0, 120), f.title.slice(0, 200), f.description.slice(0, 500), f.successMessage.slice(0, 500), f.redirectUrl.slice(0, 500), f.requireCompany ? 1 : 0, f.notify ? 1 : 0, f.active ? 1 : 0, id, orgId]
  );
}

export async function deleteCaptureForm(orgId: number, id: number): Promise<void> {
  await ensureAuthSchema();
  await getPool().query("DELETE FROM crm_capture_forms WHERE id = ? AND organization_id = ?", [id, orgId]);
}

export async function listCaptureForms(orgId: number): Promise<CaptureFormRow[]> {
  await ensureAuthSchema();
  const [rows] = await getPool().query<CaptureFormRow[]>(
    "SELECT * FROM crm_capture_forms WHERE organization_id = ? ORDER BY id DESC",
    [orgId]
  );
  return rows;
}

export async function getCaptureForm(orgId: number, id: number): Promise<CaptureFormRow | null> {
  await ensureAuthSchema();
  const [rows] = await getPool().query<CaptureFormRow[]>(
    "SELECT * FROM crm_capture_forms WHERE id = ? AND organization_id = ? LIMIT 1",
    [id, orgId]
  );
  return rows[0] ?? null;
}

/** Public lookup by token — the org is derived from the token, so there is no
 *  cross-tenant surface: one token maps to exactly one org's form. */
export async function getCaptureFormByToken(token: string): Promise<CaptureFormRow | null> {
  await ensureAuthSchema();
  const [rows] = await getPool().query<CaptureFormRow[]>(
    "SELECT * FROM crm_capture_forms WHERE token = ? LIMIT 1",
    [token.slice(0, 64)]
  );
  return rows[0] ?? null;
}

export async function incrementCaptureFormSubmissions(id: number): Promise<void> {
  await getPool().query("UPDATE crm_capture_forms SET submissions = submissions + 1 WHERE id = ?", [id]);
}

// ---- Sales goals / quotas --------------------------------------------------

export interface GoalRow extends mysql.RowDataPacket {
  id: number;
  organization_id: number;
  owner_user_id: number;
  metric: string;
  period_month: string;
  target_amount: number;
}

export async function upsertGoal(orgId: number, g: { ownerUserId: number; metric: string; periodMonth: string; target: number; createdBy: string }): Promise<void> {
  await ensureAuthSchema();
  await getPool().query(
    `INSERT INTO crm_goals (organization_id, owner_user_id, metric, period_month, target_amount, created_by)
       VALUES (?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE target_amount = VALUES(target_amount)`,
    [orgId, g.ownerUserId, g.metric.slice(0, 20), g.periodMonth.slice(0, 7), Math.max(0, Math.round(g.target)), g.createdBy.slice(0, 190)]
  );
}

export async function deleteGoal(orgId: number, id: number): Promise<void> {
  await ensureAuthSchema();
  await getPool().query("DELETE FROM crm_goals WHERE id = ? AND organization_id = ?", [id, orgId]);
}

export async function listGoals(orgId: number, periodMonth: string): Promise<GoalRow[]> {
  await ensureAuthSchema();
  const [rows] = await getPool().query<GoalRow[]>(
    "SELECT * FROM crm_goals WHERE organization_id = ? AND period_month = ?",
    [orgId, periodMonth.slice(0, 7)]
  );
  return rows;
}

export interface WonByOwnerRow extends mysql.RowDataPacket {
  owner_user_id: number;
  revenue: number;
  deals: number;
}
/** Won revenue + deal count per owner in [startYmd, endYmd). Unassigned -> 0. */
export async function wonByOwner(orgId: number, startYmd: string, endYmd: string): Promise<WonByOwnerRow[]> {
  await ensureSchema();
  const [rows] = await getPool().query<WonByOwnerRow[]>(
    `SELECT COALESCE(owner_user_id, 0) AS owner_user_id, COALESCE(SUM(value), 0) AS revenue, COUNT(*) AS deals
       FROM crm_deals
      WHERE organization_id = ? AND stage = 'won' AND closed_at >= ? AND closed_at < ?
      GROUP BY COALESCE(owner_user_id, 0)`,
    [orgId, startYmd, endYmd]
  );
  return rows;
}

export interface LeadsByOwnerRow extends mysql.RowDataPacket {
  owner_user_id: number;
  leads: number;
}
/** New leads per owner created in [startYmd, endYmd). Unassigned -> 0. */
export async function newLeadsByOwner(orgId: number, startYmd: string, endYmd: string): Promise<LeadsByOwnerRow[]> {
  await ensureSchema();
  const [rows] = await getPool().query<LeadsByOwnerRow[]>(
    `SELECT COALESCE(owner_user_id, 0) AS owner_user_id, COUNT(*) AS leads
       FROM crm_leads
      WHERE organization_id = ? AND created_at >= ? AND created_at < ?
      GROUP BY COALESCE(owner_user_id, 0)`,
    [orgId, startYmd, endYmd]
  );
  return rows;
}

// ---- Commission tracking ---------------------------------------------------

export interface CommissionRateRow extends mysql.RowDataPacket {
  owner_user_id: number;
  rate_bp: number;
}
export interface CommissionPayoutRow extends mysql.RowDataPacket {
  owner_user_id: number;
  period_month: string;
  amount_cents: number;
  paid_by: string;
  paid_at: Date;
}

export async function listCommissionRates(orgId: number): Promise<CommissionRateRow[]> {
  await ensureAuthSchema();
  const [rows] = await getPool().query<CommissionRateRow[]>(
    "SELECT owner_user_id, rate_bp FROM crm_commission_rates WHERE organization_id = ?",
    [orgId]
  );
  return rows;
}

export async function upsertCommissionRate(orgId: number, ownerUserId: number, rateBp: number): Promise<void> {
  await ensureAuthSchema();
  await getPool().query(
    `INSERT INTO crm_commission_rates (organization_id, owner_user_id, rate_bp) VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE rate_bp = VALUES(rate_bp)`,
    [orgId, Math.max(0, Math.floor(ownerUserId)), Math.max(0, Math.min(1_000_000, Math.round(rateBp)))]
  );
}

export async function listCommissionPayouts(orgId: number, periodMonth: string): Promise<CommissionPayoutRow[]> {
  await ensureAuthSchema();
  const [rows] = await getPool().query<CommissionPayoutRow[]>(
    "SELECT owner_user_id, period_month, amount_cents, paid_by, paid_at FROM crm_commission_payouts WHERE organization_id = ? AND period_month = ?",
    [orgId, periodMonth.slice(0, 7)]
  );
  return rows;
}

export async function recordCommissionPayout(orgId: number, p: { ownerUserId: number; periodMonth: string; amountCents: number; paidBy: string }): Promise<void> {
  await ensureAuthSchema();
  await getPool().query(
    `INSERT INTO crm_commission_payouts (organization_id, owner_user_id, period_month, amount_cents, paid_by)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE amount_cents = VALUES(amount_cents), paid_by = VALUES(paid_by), paid_at = CURRENT_TIMESTAMP`,
    [orgId, Math.floor(p.ownerUserId), p.periodMonth.slice(0, 7), Math.max(0, Math.round(p.amountCents)), p.paidBy.slice(0, 190)]
  );
}

export async function deleteCommissionPayout(orgId: number, ownerUserId: number, periodMonth: string): Promise<void> {
  await ensureAuthSchema();
  await getPool().query(
    "DELETE FROM crm_commission_payouts WHERE organization_id = ? AND owner_user_id = ? AND period_month = ?",
    [orgId, Math.floor(ownerUserId), periodMonth.slice(0, 7)]
  );
}

/** Force sign-out for the whole org — revoke every session except `keepId`
 *  (0 to revoke all). Returns how many were revoked. */
export async function revokeAllOrgSessionsExcept(orgId: number, keepId: number): Promise<number> {
  await ensureAuthSchema();
  const [res] = await getPool().query<mysql.ResultSetHeader>(
    "DELETE FROM crm_sessions WHERE organization_id = ? AND id <> ?",
    [orgId, keepId]
  );
  return res.affectedRows ?? 0;
}

export async function countActiveOrgSessions(orgId: number): Promise<number> {
  await ensureAuthSchema();
  const [rows] = await getPool().query<mysql.RowDataPacket[]>(
    "SELECT COUNT(*) AS n FROM crm_sessions WHERE organization_id = ? AND expires_at > NOW()",
    [orgId]
  );
  return Number(rows[0]?.n ?? 0);
}
export interface UserRow extends mysql.RowDataPacket {
  id: number;
  organization_id: number;
  email: string;
  name: string;
  password_hash: string;
  role: string;
  status: string;
  totp_secret: string;
  totp_enabled: number;
  created_at: Date;
  last_login_at: Date | null;
}
export interface SessionRow extends mysql.RowDataPacket {
  id: number;
  user_id: number;
  organization_id: number;
  token_hash: string;
  ip: string;
  user_agent: string;
  last_used_at: Date | null;
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
  expires_at: Date | null;
  scopes: string;
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
  input: { name: string; keyHash: string; last4: string; createdByEmail: string; expiresAt?: Date | null; scopes?: string }
): Promise<number> {
  await ensureAuthSchema();
  const [res] = await getPool().query<mysql.ResultSetHeader>(
    "INSERT INTO crm_api_keys (organization_id, name, key_hash, last4, created_by_email, expires_at, scopes) VALUES (?, ?, ?, ?, ?, ?, ?)",
    [orgId, input.name.slice(0, 120), input.keyHash.slice(0, 64), input.last4.slice(0, 8), input.createdByEmail.slice(0, 190), input.expiresAt ?? null, (input.scopes || "companies,contacts,deals").slice(0, 255)]
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
export async function findEnabledApiKeyByHash(hash: string): Promise<{ id: number; organizationId: number; scopes: string } | null> {
  await ensureAuthSchema();
  const [rows] = await getPool().query<ApiKeyRow[]>(
    "SELECT id, organization_id, scopes FROM crm_api_keys WHERE key_hash = ? AND enabled = 1 AND (expires_at IS NULL OR expires_at > NOW()) LIMIT 1",
    [hash]
  );
  const r = rows[0];
  return r ? { id: r.id, organizationId: r.organization_id, scopes: r.scopes } : null;
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

export async function updateUserPassword(userId: number, passwordHash: string): Promise<void> {
  await ensureAuthSchema();
  await getPool().query("UPDATE crm_users SET password_hash = ? WHERE id = ?", [passwordHash, userId]);
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
  ip?: string;
  userAgent?: string;
}

export async function createSession(s: NewSession): Promise<void> {
  await ensureAuthSchema();
  await getPool().query(
    "INSERT INTO crm_sessions (user_id, organization_id, token_hash, expires_at, ip, user_agent, last_used_at) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)",
    [s.userId, s.organizationId, s.tokenHash, s.expiresAt, (s.ip ?? "").slice(0, 45), (s.userAgent ?? "").slice(0, 255)]
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

/** Refresh "last active" (throttled by the caller so it isn't a write per request). */
export async function touchSession(tokenHash: string): Promise<void> {
  try {
    await getPool().query("UPDATE crm_sessions SET last_used_at = CURRENT_TIMESTAMP WHERE token_hash = ?", [tokenHash]);
  } catch {
    /* a failed timestamp must never fail the request */
  }
}

/** A user's active sessions (their own devices), most-recently-used first. */
export async function listSessionsForUser(userId: number): Promise<SessionRow[]> {
  await ensureAuthSchema();
  const [rows] = await getPool().query<SessionRow[]>(
    `SELECT * FROM crm_sessions WHERE user_id = ? AND expires_at > CURRENT_TIMESTAMP
     ORDER BY (last_used_at IS NULL), last_used_at DESC, id DESC`,
    [userId]
  );
  return rows;
}

/** Revoke one of the user's own sessions (scoped by user_id so no cross-user). */
export async function revokeSessionById(userId: number, id: number): Promise<void> {
  await ensureAuthSchema();
  await getPool().query("DELETE FROM crm_sessions WHERE id = ? AND user_id = ?", [id, userId]);
}

/** Log out everywhere else: revoke all of the user's sessions except `keepId`. */
export async function revokeOtherSessions(userId: number, keepId: number): Promise<number> {
  await ensureAuthSchema();
  const [res] = await getPool().query<mysql.ResultSetHeader>(
    "DELETE FROM crm_sessions WHERE user_id = ? AND id <> ?",
    [userId, keepId]
  );
  return res.affectedRows ?? 0;
}

export async function deleteSessionByTokenHash(tokenHash: string): Promise<void> {
  await ensureAuthSchema();
  await getPool().query("DELETE FROM crm_sessions WHERE token_hash = ?", [tokenHash]);
}

export async function deleteExpiredSessions(): Promise<void> {
  await ensureAuthSchema();
  await getPool().query("DELETE FROM crm_sessions WHERE expires_at <= CURRENT_TIMESTAMP");
}

// -------- MFA (two-factor)

/** Store a (encrypted) TOTP secret as PENDING — not yet enabled until confirmed. */
export async function setUserTotpSecret(userId: number, encryptedSecret: string): Promise<void> {
  await ensureAuthSchema();
  await getPool().query("UPDATE crm_users SET totp_secret = ?, totp_enabled = 0 WHERE id = ?", [encryptedSecret.slice(0, 255), userId]);
}

export async function enableUserTotp(userId: number): Promise<void> {
  await ensureAuthSchema();
  await getPool().query("UPDATE crm_users SET totp_enabled = 1 WHERE id = ?", [userId]);
}

/** Turn MFA off and wipe the secret + recovery codes. */
export async function disableUserTotp(userId: number): Promise<void> {
  await ensureAuthSchema();
  const pool = getPool();
  await pool.query("UPDATE crm_users SET totp_secret = '', totp_enabled = 0 WHERE id = ?", [userId]);
  await pool.query("DELETE FROM crm_recovery_codes WHERE user_id = ?", [userId]);
}

export async function getUserTotp(userId: number): Promise<{ secret: string; enabled: boolean } | null> {
  await ensureAuthSchema();
  const [rows] = await getPool().query<mysql.RowDataPacket[]>("SELECT totp_secret, totp_enabled FROM crm_users WHERE id = ? LIMIT 1", [userId]);
  const r = rows[0];
  return r ? { secret: String(r.totp_secret ?? ""), enabled: !!r.totp_enabled } : null;
}

/** Replace all of a user's recovery-code hashes atomically. */
export async function replaceRecoveryCodes(userId: number, hashes: string[]): Promise<void> {
  await ensureAuthSchema();
  const conn = await getPool().getConnection();
  try {
    await conn.beginTransaction();
    await conn.query("DELETE FROM crm_recovery_codes WHERE user_id = ?", [userId]);
    for (const h of hashes) {
      await conn.query("INSERT INTO crm_recovery_codes (user_id, code_hash) VALUES (?, ?)", [userId, h]);
    }
    await conn.commit();
  } catch (e) {
    await conn.rollback().catch(() => {});
    throw e;
  } finally {
    conn.release();
  }
}

/** Spend a recovery code (single-use). true only if it existed and was unused. */
export async function consumeRecoveryCode(userId: number, codeHash: string): Promise<boolean> {
  await ensureAuthSchema();
  const [res] = await getPool().query<mysql.ResultSetHeader>(
    "UPDATE crm_recovery_codes SET used_at = CURRENT_TIMESTAMP WHERE user_id = ? AND code_hash = ? AND used_at IS NULL",
    [userId, codeHash]
  );
  return (res.affectedRows ?? 0) > 0;
}

export async function countUnusedRecoveryCodes(userId: number): Promise<number> {
  await ensureAuthSchema();
  const [rows] = await getPool().query<mysql.RowDataPacket[]>("SELECT COUNT(*) AS n FROM crm_recovery_codes WHERE user_id = ? AND used_at IS NULL", [userId]);
  return Number(rows[0]?.n ?? 0);
}

// Short-lived login challenge: after the password step, before the TOTP step.
export async function createMfaChallenge(userId: number, tokenHash: string, expiresAt: Date): Promise<void> {
  await ensureAuthSchema();
  await getPool().query("INSERT INTO crm_mfa_challenges (user_id, token_hash, expires_at) VALUES (?, ?, ?)", [userId, tokenHash, expiresAt]);
}

export async function getMfaChallenge(tokenHash: string): Promise<{ userId: number } | null> {
  await ensureAuthSchema();
  const [rows] = await getPool().query<mysql.RowDataPacket[]>(
    "SELECT user_id FROM crm_mfa_challenges WHERE token_hash = ? AND expires_at > CURRENT_TIMESTAMP LIMIT 1",
    [tokenHash]
  );
  const r = rows[0];
  return r ? { userId: Number(r.user_id) } : null;
}

export async function deleteMfaChallenge(tokenHash: string): Promise<void> {
  await ensureAuthSchema();
  await getPool().query("DELETE FROM crm_mfa_challenges WHERE token_hash = ?", [tokenHash]);
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
  ip: string;
  user_agent: string;
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
  ip?: string;
  userAgent?: string;
}

// Strip CR/LF and C0/C1 control chars from any user-influenced text before it
// lands in the audit / alert feed, so a crafted name can't forge a second log
// line (feed spoofing). Built from escapes to avoid raw control bytes in source.
const AUDIT_CONTROL_RE = new RegExp("[\\u0000-\\u001F\\u007F-\\u009F\\u2028\\u2029]", "g");
export function stripLogControl(s: string): string {
  return String(s ?? "").replace(AUDIT_CONTROL_RE, " ");
}

export async function writeAudit(e: AuditEntry): Promise<void> {
  await ensureAuthSchema();
  await getPool().query(
    "INSERT INTO crm_audit_logs (organization_id, user_id, actor_email, action, entity, entity_id, summary, ip, user_agent) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
    [
      e.organizationId,
      e.userId,
      stripLogControl(e.actorEmail).slice(0, 190),
      e.action.slice(0, 40),
      e.entity.slice(0, 40),
      e.entityId ?? null,
      stripLogControl(e.summary ?? "").slice(0, 255),
      (e.ip ?? "").slice(0, 45),
      stripLogControl(e.userAgent ?? "").slice(0, 255),
    ]
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

export interface SecurityOverviewMetrics {
  activeSessions: number;
  staleSessions: number;
  failedLogins24h: number;
  users: number;
  admins: number;
  adminsWithoutMfa: number;
  apiKeysEnabled: number;
  apiKeysIdle: number;
}

/** Measured, org-scoped inputs for the security score. All parameterized COUNTs. */
export async function securityOverview(orgId: number): Promise<SecurityOverviewMetrics> {
  await ensureAuthSchema();
  const pool = getPool();
  const one = async (sql: string): Promise<number> => {
    const [rows] = await pool.query<mysql.RowDataPacket[]>(sql, [orgId]);
    return Number(rows[0]?.n ?? 0);
  };
  const [activeSessions, staleSessions, failedLogins24h, users, admins, adminsWithoutMfa, apiKeysEnabled, apiKeysIdle] = await Promise.all([
    one("SELECT COUNT(*) AS n FROM crm_sessions WHERE organization_id = ? AND expires_at > NOW()"),
    one("SELECT COUNT(*) AS n FROM crm_sessions WHERE organization_id = ? AND expires_at > NOW() AND COALESCE(last_used_at, created_at) < NOW() - INTERVAL 30 DAY"),
    one("SELECT COUNT(*) AS n FROM crm_audit_logs WHERE organization_id = ? AND action = 'login_failed' AND created_at >= NOW() - INTERVAL 24 HOUR"),
    one("SELECT COUNT(*) AS n FROM crm_users WHERE organization_id = ?"),
    one("SELECT COUNT(*) AS n FROM crm_users WHERE organization_id = ? AND role IN ('owner','admin')"),
    one("SELECT COUNT(*) AS n FROM crm_users WHERE organization_id = ? AND role IN ('owner','admin') AND status = 'active' AND totp_enabled = 0"),
    one("SELECT COUNT(*) AS n FROM crm_api_keys WHERE organization_id = ? AND enabled = 1"),
    one("SELECT COUNT(*) AS n FROM crm_api_keys WHERE organization_id = ? AND enabled = 1 AND COALESCE(last_used_at, created_at) < NOW() - INTERVAL 90 DAY"),
  ]);
  return { activeSessions, staleSessions, failedLogins24h, users, admins, adminsWithoutMfa, apiKeysEnabled, apiKeysIdle };
}
