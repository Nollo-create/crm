"use server";

// Every action runs as the signed-in user: requireSession() supplies the org,
// and no query touches the DB without it (tenant isolation, BLUEPRINT §7). The
// org is taken from the session — never from client input.

import { revalidatePath } from "next/cache";
import {
  createCompany,
  listCompanies,
  listCompaniesPage,
  customerStats,
  type CustomerStats,
  bulkDeleteCompanies,
  bulkSetCompanyStatus,
  getCompany,
  findSimilarCompanies,
  updateCompany,
  updateCompanyDetails,
  deleteCompany,
  type CompanyStatsRow,
  type CompanyDetailsInput,
  addContact,
  listContacts,
  listContactsPage,
  deleteContact,
  getContact,
  updateContact,
  listContactActivities,
  type ContactStatsRow,
  type ContactWithCompanyRow,
  createDeal,
  listDeals,
  listDealsPage,
  listLeadsPage,
  updateDeal,
  deleteDeal,
  getDeal,
  listDealActivities,
  listDealsForContact,
  closeDealWon,
  closeDealLost,
  setDealOpenStage,
  bulkDeleteDeals,
  bulkSetDealStage,
  getOrgFlags,
  createNotification,
  type DealStatsRow,
  type DealWithRefsRow,
  addActivity,
  listActivities,
  listActivitiesPage,
  deleteActivity,
  type ActivityStatsRow,
  type CompanyRow,
  type ContactRow,
  type DealRow,
  type ActivityRow,
  type CompanyInput,
  type ContactInput,
  type DealInput,
} from "@/lib/db";
import { requireSession, guardWrite, type SessionUser } from "@/lib/auth/session";
import { can } from "@/lib/auth/rbac";
import { recordAudit } from "@/lib/auth/audit";
import { validated, vString, vEmail, vInt, vEnum } from "@/lib/crm/validate";
import { ownerFilter, canAccessOwned } from "@/lib/crm/record-scope";
import { isStageId, isLossReason, stage, summarizePipeline, type PipelineSummary, type StageId } from "@/lib/crm/pipeline";
import { eur } from "@/lib/format";

/** Record-level scoping (opt-in per org, master-prompt #7). Off by default → the
 *  helpers below are no-ops. When on, a member is confined to deals they own or
 *  that are unassigned; owners/admins/viewers are unaffected. */
async function orgRestricted(organizationId: number): Promise<boolean> {
  const f = await getOrgFlags(organizationId).catch(() => null);
  return !!f?.restrictMembers;
}
/** True if the session may act on this specific deal. One SELECT only when the
 *  org is restricted and the caller is a member; otherwise free. */
async function canTouchDeal(s: SessionUser, id: number): Promise<boolean> {
  if (s.role !== "member" || !(await orgRestricted(s.organizationId))) return true;
  const row = await getDeal(s.organizationId, id);
  return !!row && canAccessOwned(s.role, s.userId, true, row.owner_user_id);
}

// -------- plain, serialisable shapes for the client

export interface Company {
  id: number;
  name: string;
  industry: string;
  city: string;
  website: string;
  employees: number | null;
  annualValue: number;
  status: string;
  accountManager: string;
  industryMatch: boolean;
  legalName: string;
  phone: string;
  email: string;
  country: string;
  address: string;
  vatId: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}
export interface Contact {
  id: number;
  companyId: number;
  name: string;
  role: string;
  email: string;
  phone: string;
  department: string;
  influence: string;
  mobile: string;
  linkedin: string;
  notes: string;
}
export interface Deal {
  id: number;
  companyId: number;
  title: string;
  value: number;
  stage: StageId;
  probability: number | null;
  expectedClose: string | null;
  owner: string;
  contactId: number | null;
  notes: string;
  closedAt: string | null;
  lossReason: string;
}
export interface Activity {
  id: number;
  companyId: number;
  type: string;
  summary: string;
  createdAt: string;
}

const iso = (d: Date) => new Date(d).toISOString();
const ymd = (d: Date | null) => (d ? new Date(d).toISOString().slice(0, 10) : null);

function toCompany(r: CompanyRow): Company {
  return {
    id: r.id,
    name: r.name,
    industry: r.industry,
    city: r.city,
    website: r.website,
    employees: r.employees,
    annualValue: r.annual_value,
    status: r.status,
    accountManager: r.account_manager,
    industryMatch: !!r.industry_match,
    legalName: r.legal_name ?? "",
    phone: r.phone ?? "",
    email: r.email ?? "",
    country: r.country ?? "",
    address: r.address ?? "",
    vatId: r.vat_id ?? "",
    description: r.description ?? "",
    createdAt: iso(r.created_at),
    updatedAt: iso(r.updated_at),
  };
}
function toContact(r: ContactRow): Contact {
  return {
    id: r.id,
    companyId: r.company_id,
    name: r.name,
    role: r.role,
    email: r.email,
    phone: r.phone,
    department: r.department,
    influence: r.influence,
    mobile: r.mobile ?? "",
    linkedin: r.linkedin ?? "",
    notes: r.notes ?? "",
  };
}
function toDeal(r: DealRow): Deal {
  return {
    id: r.id,
    companyId: r.company_id,
    title: r.title,
    value: r.value,
    stage: (isStageId(r.stage) ? r.stage : "new") as StageId,
    probability: r.probability,
    expectedClose: ymd(r.expected_close),
    owner: r.owner,
    contactId: r.contact_id ?? null,
    notes: r.notes ?? "",
    closedAt: ymd(r.closed_at),
    lossReason: r.loss_reason ?? "",
  };
}
function toActivity(r: ActivityRow): Activity {
  return { id: r.id, companyId: r.company_id, type: r.type, summary: r.summary, createdAt: iso(r.created_at) };
}

// ------------------------------------------------------------------ companies

export async function listCompaniesAction(q = "", status = ""): Promise<Company[]> {
  const { organizationId } = await requireSession();
  const rows = await listCompanies(organizationId, { q: q.trim() || undefined, status: status || undefined });
  return rows.map(toCompany);
}

export interface CompanyRowView extends Company {
  contacts: number;
  openDeals: number;
  openValue: number;
  lastActivity: string | null;
}

const STATUSES = ["lead", "active", "customer", "at_risk", "lost"];

function toRowView(r: CompanyStatsRow): CompanyRowView {
  return {
    ...toCompany(r),
    contacts: Number(r.contacts),
    openDeals: Number(r.open_deals),
    openValue: Number(r.open_value),
    lastActivity: r.last_activity ? new Date(r.last_activity).toISOString() : null,
  };
}

export interface CompaniesPage {
  rows: CompanyRowView[];
  total: number;
  page: number;
  pageCount: number;
}

export async function companiesPageAction(opts: {
  q?: string;
  status?: string;
  sortKey: string;
  sortDir: 1 | -1;
  page: number;
  pageSize: number;
}): Promise<CompaniesPage> {
  const { organizationId } = await requireSession();
  const res = await listCompaniesPage(organizationId, {
    q: opts.q?.trim() || undefined,
    status: opts.status || undefined,
    sortKey: opts.sortKey,
    sortDir: opts.sortDir,
    page: opts.page,
    pageSize: opts.pageSize,
  });
  return { rows: res.rows.map(toRowView), total: res.total, page: res.page, pageCount: res.pageCount };
}

// -------- customers (companies at the won lifecycle: customer + at_risk)

export async function customersPageAction(opts: {
  q?: string;
  status?: string; // "" = customer + at_risk, or a single one
  sortKey: string;
  sortDir: 1 | -1;
  page: number;
  pageSize: number;
}): Promise<CompaniesPage> {
  const { organizationId } = await requireSession();
  const statuses = opts.status ? [opts.status] : ["customer", "at_risk"];
  const res = await listCompaniesPage(organizationId, {
    q: opts.q?.trim() || undefined,
    statuses,
    sortKey: opts.sortKey,
    sortDir: opts.sortDir,
    page: opts.page,
    pageSize: opts.pageSize,
  });
  return { rows: res.rows.map(toRowView), total: res.total, page: res.page, pageCount: res.pageCount };
}

export async function customerStatsAction(): Promise<CustomerStats> {
  const { organizationId } = await requireSession();
  return customerStats(organizationId);
}

export interface SearchHit {
  id: number;
  name: string;
  city: string;
  status: string;
}

/** Lightweight company search for the command palette. */
export async function searchCompaniesAction(q: string): Promise<SearchHit[]> {
  const { organizationId } = await requireSession();
  const s = q.trim();
  if (!s) return [];
  const rows = await listCompanies(organizationId, { q: s });
  return rows.slice(0, 8).map((r) => ({ id: r.id, name: r.name, city: r.city, status: r.status }));
}

export interface ContactHit {
  id: number;
  name: string;
  email: string;
  companyId: number;
  companyName: string;
}

/** Contact search for the bulk-email recipient picker — only contacts with an
 *  email address (you can't send to the rest). Org-scoped. */
export async function searchContactsAction(q: string): Promise<ContactHit[]> {
  const { organizationId } = await requireSession();
  const s = q.trim();
  if (!s) return [];
  const res = await listContactsPage(organizationId, { q: s, sortKey: "name", sortDir: 1, page: 1, pageSize: 12 }).catch(() => null);
  if (!res) return [];
  return res.rows
    .filter((r: ContactStatsRow) => !!r.email)
    .slice(0, 8)
    .map((r: ContactStatsRow) => ({ id: r.id, name: r.name, email: r.email, companyId: r.company_id, companyName: r.company_name }));
}

export interface GlobalHit {
  id: number;
  name: string;
  sub: string;
}
export interface GlobalSearchResults {
  companies: GlobalHit[];
  contacts: GlobalHit[];
  leads: GlobalHit[];
  deals: GlobalHit[];
}

/** Possible-duplicate check for the New Company form (§36). Returns existing
 *  companies that look like the one being typed. */
export async function checkCompanyDuplicatesAction(name: string, website: string): Promise<GlobalHit[]> {
  const { organizationId } = await requireSession();
  if ((name ?? "").trim().length < 2) return [];
  const rows = await findSimilarCompanies(organizationId, name, website ?? "").catch(() => []);
  return rows.map((r) => ({ id: r.id, name: r.name, sub: [r.city, r.website].filter(Boolean).join(" · ") }));
}

/** One-shot cross-entity search for the ⌘K palette — companies, contacts, leads
 *  and deals, each org-scoped and reusing the existing (injection-safe) list
 *  layer. A failure in one entity degrades to an empty group, never the whole. */
export async function globalSearchAction(q: string): Promise<GlobalSearchResults> {
  const { organizationId } = await requireSession();
  const s = q.trim();
  if (!s) return { companies: [], contacts: [], leads: [], deals: [] };
  const [companies, contacts, leads, deals] = await Promise.all([
    listCompanies(organizationId, { q: s })
      .then((r) => r.slice(0, 5).map((c): GlobalHit => ({ id: c.id, name: c.name, sub: c.city || c.industry || "" })))
      .catch(() => [] as GlobalHit[]),
    listContactsPage(organizationId, { q: s, sortKey: "name", sortDir: 1, page: 1, pageSize: 5 })
      .then((r) => r.rows.map((c): GlobalHit => ({ id: c.id, name: c.name, sub: c.company_name || c.role || "" })))
      .catch(() => [] as GlobalHit[]),
    listLeadsPage(organizationId, { q: s, sortKey: "score", sortDir: -1, page: 1, pageSize: 5 })
      .then((r) => r.rows.map((l): GlobalHit => ({ id: l.id, name: l.name || l.company || "Lead", sub: l.name && l.company ? l.company : l.title || "" })))
      .catch(() => [] as GlobalHit[]),
    listDealsPage(organizationId, { q: s, sortKey: "value", sortDir: -1, page: 1, pageSize: 5 })
      .then((r) => r.rows.map((d): GlobalHit => ({ id: d.id, name: d.title, sub: d.company_name || "" })))
      .catch(() => [] as GlobalHit[]),
  ]);
  return { companies, contacts, leads, deals };
}

export async function bulkDeleteCompaniesAction(ids: number[]): Promise<{ error?: string }> {
  const session = await requireSession();
  if (!can(session.role, "company:delete")) return { error: "Only admins can delete companies." };
  await bulkDeleteCompanies(session.organizationId, ids);
  await recordAudit(session, "bulk_delete", "company", null, `${ids.length} companies`);
  revalidatePath("/companies");
  revalidatePath("/");
  return {};
}

export async function bulkSetStatusAction(ids: number[], status: string): Promise<{ error?: string }> {
  const g = await guardWrite();
  if ("error" in g) return { error: g.error };
  const { organizationId } = g.session;
  if (!STATUSES.includes(status)) return { error: "Unknown status." };
  await bulkSetCompanyStatus(organizationId, ids, status);
  revalidatePath("/companies");
  revalidatePath("/");
  return {};
}

export async function createCompanyAction(input: CompanyInput): Promise<{ id?: number; error?: string }> {
  const g = await guardWrite();
  if ("error" in g) return { error: g.error };
  const session = g.session;
  const v = validated(() => ({
    name: vString("Name", input.name, { required: true, max: 190 }),
    industry: vString("Industry", input.industry, { max: 120 }),
    city: vString("City", input.city, { max: 120 }),
    website: vString("Website", input.website, { max: 190 }),
    accountManager: vString("Account manager", input.accountManager, { max: 120 }),
    status: vEnum("Status", input.status, STATUSES as readonly string[], { fallback: "lead" }),
    employees: vInt("Employees", input.employees, { min: 0, max: 100_000_000 }),
    annualValue: vInt("Annual value", input.annualValue, { min: 0 }) ?? 0,
  }));
  if (!v.ok) return { error: v.error };
  const id = await createCompany(session.organizationId, { ...input, ...v.value });
  await recordAudit(session, "create", "company", id, v.value.name);
  revalidatePath("/companies");
  revalidatePath("/");
  return { id };
}

export async function updateCompanyAction(id: number, input: CompanyInput): Promise<{ error?: string }> {
  const g = await guardWrite();
  if ("error" in g) return { error: g.error };
  const { organizationId } = g.session;
  const v = validated(() => ({
    name: vString("Name", input.name, { required: true, max: 190 }),
    industry: vString("Industry", input.industry, { max: 120 }),
    city: vString("City", input.city, { max: 120 }),
    website: vString("Website", input.website, { max: 190 }),
    accountManager: vString("Account manager", input.accountManager, { max: 120 }),
    status: vEnum("Status", input.status, STATUSES as readonly string[], { fallback: "lead" }),
    employees: vInt("Employees", input.employees, { min: 0, max: 100_000_000 }),
    annualValue: vInt("Annual value", input.annualValue, { min: 0 }) ?? 0,
  }));
  if (!v.ok) return { error: v.error };
  await updateCompany(organizationId, id, { ...input, ...v.value });
  revalidatePath(`/companies/${id}`);
  revalidatePath("/companies");
  return {};
}

/** Patch the descriptive account fields (legal name, contact details, VAT, etc.)
 *  without touching status/score — see db.updateCompanyDetails. */
export async function updateCompanyDetailsAction(id: number, input: CompanyDetailsInput): Promise<{ error?: string }> {
  const g = await guardWrite();
  if ("error" in g) return { error: g.error };
  const { organizationId } = g.session;
  const v = validated(() => ({
    legalName: vString("Legal name", input.legalName, { max: 190 }),
    phone: vString("Phone", input.phone, { max: 40 }),
    email: vEmail("Email", input.email),
    country: vString("Country", input.country, { max: 120 }),
    address: vString("Address", input.address, { max: 500 }),
    vatId: vString("VAT / Tax ID", input.vatId, { max: 40 }),
    description: vString("Description", input.description, { max: 2000 }),
  }));
  if (!v.ok) return { error: v.error };
  if (!(await getCompany(organizationId, id))) return { error: "Company not found." };
  await updateCompanyDetails(organizationId, id, v.value);
  revalidatePath(`/companies/${id}`);
  return {};
}

export async function deleteCompanyAction(id: number): Promise<{ error?: string }> {
  const session = await requireSession();
  if (!can(session.role, "company:delete")) return { error: "Only admins can delete companies." };
  await deleteCompany(session.organizationId, id);
  await recordAudit(session, "delete", "company", id);
  revalidatePath("/companies");
  revalidatePath("/");
  return {};
}

export interface CompanyDetail {
  company: Company;
  contacts: Contact[];
  deals: Deal[];
  activities: Activity[];
  summary: PipelineSummary;
}

export async function getCompanyAction(id: number): Promise<CompanyDetail | null> {
  const session = await requireSession();
  const { organizationId } = session;
  const c = await getCompany(organizationId, id);
  if (!c) return null;
  const dealScope = ownerFilter("owner_user_id", session.role, session.userId, await orgRestricted(organizationId));
  const [contacts, deals, activities] = await Promise.all([
    listContacts(organizationId, id),
    listDeals(organizationId, { companyId: id, ownerScope: dealScope }),
    listActivities(organizationId, id),
  ]);
  const mapped = deals.map(toDeal);
  return {
    company: toCompany(c),
    contacts: contacts.map(toContact),
    deals: mapped,
    activities: activities.map(toActivity),
    summary: summarizePipeline(mapped),
  };
}

// ------------------------------------------------------------------- contacts

export async function addContactAction(companyId: number, input: ContactInput): Promise<{ error?: string }> {
  const g = await guardWrite();
  if ("error" in g) return { error: g.error };
  const { organizationId } = g.session;
  const v = validated(() => ({
    name: vString("Name", input.name, { required: true, max: 190 }),
    role: vString("Role", input.role, { max: 120 }),
    email: vEmail("Email", input.email),
    phone: vString("Phone", input.phone, { max: 40 }),
    mobile: vString("Mobile", input.mobile, { max: 40 }),
    department: vString("Department", input.department, { max: 120 }),
    linkedin: vString("LinkedIn", input.linkedin, { max: 190 }),
    notes: vString("Notes", input.notes, { max: 2000 }),
  }));
  if (!v.ok) return { error: v.error };
  if (!(await getCompany(organizationId, companyId))) return { error: "Company not found." };
  await addContact(organizationId, companyId, { ...input, ...v.value });
  revalidatePath(`/companies/${companyId}`);
  return {};
}

export async function deleteContactAction(id: number, companyId: number): Promise<{ error?: string }> {
  const g = await guardWrite();
  if ("error" in g) return { error: g.error };
  await deleteContact(g.session.organizationId, id);
  revalidatePath(`/companies/${companyId}`);
  revalidatePath("/contacts");
  return {};
}

export interface ContactDetail {
  contact: Contact & { companyName: string };
  activities: Activity[];
  deals: Deal[];
}

export async function getContactAction(id: number): Promise<ContactDetail | null> {
  const session = await requireSession();
  const { organizationId } = session;
  const row: ContactWithCompanyRow | null = await getContact(organizationId, id);
  if (!row) return null;
  // Record-level scoping: a restricted member must not see other members' deals
  // via the contact profile (every other deal-list path already scopes).
  const dealScope = ownerFilter("owner_user_id", session.role, session.userId, await orgRestricted(organizationId));
  const [activities, deals] = await Promise.all([
    listContactActivities(organizationId, id).catch(() => []),
    listDealsForContact(organizationId, id, dealScope).catch(() => []),
  ]);
  return {
    contact: { ...toContact(row), companyName: row.company_name },
    activities: activities.map(toActivity),
    deals: deals.map(toDeal),
  };
}

export async function updateContactAction(id: number, companyId: number, input: ContactInput): Promise<{ error?: string }> {
  const g = await guardWrite();
  if ("error" in g) return { error: g.error };
  const { organizationId } = g.session;
  const v = validated(() => ({
    name: vString("Name", input.name, { required: true, max: 190 }),
    role: vString("Role", input.role, { max: 120 }),
    email: vEmail("Email", input.email),
    phone: vString("Phone", input.phone, { max: 40 }),
    mobile: vString("Mobile", input.mobile, { max: 40 }),
    department: vString("Department", input.department, { max: 120 }),
    linkedin: vString("LinkedIn", input.linkedin, { max: 190 }),
    notes: vString("Notes", input.notes, { max: 2000 }),
  }));
  if (!v.ok) return { error: v.error };
  await updateContact(organizationId, id, { ...input, ...v.value });
  revalidatePath(`/contacts/${id}`);
  revalidatePath(`/companies/${companyId}`);
  revalidatePath("/contacts");
  return {};
}

export interface ContactListItem {
  id: number;
  companyId: number;
  companyName: string;
  name: string;
  role: string;
  email: string;
  phone: string;
  department: string;
  influence: string;
}

export interface ContactsPage {
  rows: ContactListItem[];
  total: number;
  page: number;
  pageCount: number;
}

export async function contactsPageAction(opts: {
  q?: string;
  influence?: string;
  sortKey: string;
  sortDir: 1 | -1;
  page: number;
  pageSize: number;
}): Promise<ContactsPage> {
  const { organizationId } = await requireSession();
  const res = await listContactsPage(organizationId, {
    q: opts.q?.trim() || undefined,
    influence: opts.influence || undefined,
    sortKey: opts.sortKey,
    sortDir: opts.sortDir,
    page: opts.page,
    pageSize: opts.pageSize,
  });
  return {
    rows: res.rows.map((r: ContactStatsRow) => ({
      id: r.id,
      companyId: r.company_id,
      companyName: r.company_name,
      name: r.name,
      role: r.role,
      email: r.email,
      phone: r.phone,
      department: r.department,
      influence: r.influence,
    })),
    total: res.total,
    page: res.page,
    pageCount: res.pageCount,
  };
}

// ---------------------------------------------------------------------- deals

export async function createDealAction(companyId: number, input: DealInput): Promise<{ error?: string }> {
  const g = await guardWrite();
  if ("error" in g) return { error: g.error };
  const { organizationId } = g.session;
  const v = validated(() => ({
    title: vString("Title", input.title, { required: true, max: 190 }),
    owner: vString("Owner", input.owner, { max: 120 }),
    notes: vString("Notes", input.notes, { max: 2000 }),
    value: vInt("Value", input.value, { min: 0, max: 1_000_000_000 }) ?? 0,
  }));
  if (!v.ok) return { error: v.error };
  if (!(await getCompany(organizationId, companyId))) return { error: "Company not found." };
  const stage = input.stage && isStageId(input.stage) ? input.stage : "new";
  await createDeal(organizationId, companyId, { ...input, ...v.value, stage, ownerUserId: g.session.userId });
  revalidatePath(`/companies/${companyId}`);
  revalidatePath("/pipeline");
  revalidatePath("/");
  return {};
}

function revalidateDeal(id: number, companyId?: number) {
  revalidatePath("/deals");
  revalidatePath(`/deals/${id}`);
  revalidatePath("/pipeline");
  revalidatePath("/companies");
  revalidatePath("/customers");
  if (companyId) revalidatePath(`/companies/${companyId}`);
  revalidatePath("/");
}

/** Any stage change routes through the workflow so Won flips the company to
 *  Customer (Rule 6) and Won/Lost stamp the close — from the list, board, or
 *  company profile alike. */
export async function updateDealStageAction(id: number, stage: string): Promise<{ error?: string }> {
  const g = await guardWrite();
  if ("error" in g) return { error: g.error };
  const { organizationId } = g.session;
  if (!isStageId(stage)) return { error: "Unknown stage." };
  if (!(await canTouchDeal(g.session, id))) return { error: "Deal not found." };
  if (stage === "won") await closeDealWon(organizationId, id);
  else if (stage === "lost") await closeDealLost(organizationId, id, "");
  else await setDealOpenStage(organizationId, id, stage);
  revalidateDeal(id);
  return {};
}

export async function markDealWonAction(id: number): Promise<{ companyId?: number; error?: string }> {
  const g = await guardWrite();
  if ("error" in g) return { error: g.error };
  const session = g.session;
  if (!(await canTouchDeal(session, id))) return { error: "Deal not found." };
  const deal = await getDeal(session.organizationId, id).catch(() => null);
  const r = await closeDealWon(session.organizationId, id);
  if (!r) return { error: "Deal not found." };
  await recordAudit(session, "deal_won", "deal", id, `company #${r.companyId} -> customer`);
  await createNotification(session.organizationId, {
    userEmail: null, // team win — everyone sees it
    type: "deal_won",
    title: deal ? `🎉 Deal won — ${deal.title} (${eur(deal.value)})` : "🎉 A deal was won",
    href: `/deals/${id}`,
  }).catch(() => {});
  revalidateDeal(id, r.companyId);
  return { companyId: r.companyId };
}

export async function markDealLostAction(id: number, reason: string): Promise<{ error?: string }> {
  const g = await guardWrite();
  if ("error" in g) return { error: g.error };
  const session = g.session;
  if (!isLossReason(reason)) return { error: "Pick a loss reason." };
  if (!(await canTouchDeal(session, id))) return { error: "Deal not found." };
  const r = await closeDealLost(session.organizationId, id, reason);
  if (!r) return { error: "Deal not found." };
  await recordAudit(session, "deal_lost", "deal", id, reason);
  revalidateDeal(id, r.companyId);
  return {};
}

export async function reopenDealAction(id: number, stage: string): Promise<{ error?: string }> {
  const g = await guardWrite();
  if ("error" in g) return { error: g.error };
  const { organizationId } = g.session;
  if (!(await canTouchDeal(g.session, id))) return { error: "Deal not found." };
  const target = isStageId(stage) && stage !== "won" && stage !== "lost" ? stage : "negotiation";
  const r = await setDealOpenStage(organizationId, id, target);
  if (!r) return { error: "Deal not found." };
  revalidateDeal(id, r.companyId);
  return {};
}

export async function updateDealAction(
  id: number,
  companyId: number,
  patch: { title?: string; value?: number; stage?: string; probability?: number | null; expectedClose?: string | null; owner?: string; contactId?: number | null; notes?: string }
): Promise<{ error?: string }> {
  const g = await guardWrite();
  if ("error" in g) return { error: g.error };
  const { organizationId } = g.session;
  if (patch.stage !== undefined && !isStageId(patch.stage)) return { error: "Unknown stage." };
  // Won/Lost must go through the close workflow (customer flip + close stamp),
  // never this general patch — otherwise analytics and Rule 6 are bypassed.
  if (patch.stage === "won" || patch.stage === "lost") return { error: "Use Mark won / Mark lost to close a deal." };
  if (!(await canTouchDeal(g.session, id))) return { error: "Deal not found." };
  const check = validated(() => {
    if (patch.title !== undefined) vString("Title", patch.title, { required: true, max: 190 });
    vString("Owner", patch.owner, { max: 120 });
    vString("Notes", patch.notes, { max: 2000 });
    if (patch.value !== undefined) vInt("Value", patch.value, { min: 0, max: 1_000_000_000 });
    return true;
  });
  if (!check.ok) return { error: check.error };
  await updateDeal(organizationId, id, patch);
  revalidatePath(`/deals/${id}`);
  revalidatePath("/deals");
  revalidatePath(`/companies/${companyId}`);
  revalidatePath("/pipeline");
  revalidatePath("/");
  return {};
}

export async function deleteDealAction(id: number, companyId: number): Promise<{ error?: string }> {
  const session = await requireSession();
  if (!can(session.role, "deal:delete")) return { error: "Only admins can delete deals." };
  await deleteDeal(session.organizationId, id);
  await recordAudit(session, "delete", "deal", id);
  revalidatePath(`/companies/${companyId}`);
  revalidatePath("/deals");
  revalidatePath("/pipeline");
  revalidatePath("/");
  return {};
}

export async function bulkDeleteDealsAction(ids: number[]): Promise<{ error?: string }> {
  const session = await requireSession();
  if (!can(session.role, "deal:delete")) return { error: "Only admins can delete deals." };
  await bulkDeleteDeals(session.organizationId, ids);
  await recordAudit(session, "bulk_delete", "deal", null, `${ids.length} deals`);
  revalidatePath("/deals");
  revalidatePath("/pipeline");
  revalidatePath("/");
  return {};
}

export async function bulkSetDealStageAction(ids: number[], stage: string): Promise<{ error?: string }> {
  const g = await guardWrite();
  if ("error" in g) return { error: g.error };
  const session = g.session;
  if (!isStageId(stage) || stage === "won" || stage === "lost") return { error: "Pick an open stage." };
  const scope = ownerFilter("owner_user_id", session.role, session.userId, await orgRestricted(session.organizationId));
  await bulkSetDealStage(session.organizationId, ids, stage, scope);
  revalidatePath("/deals");
  revalidatePath("/pipeline");
  revalidatePath("/");
  await recordAudit(session, "bulk_update", "deal", null, `set ${stage} on ${ids.length}`);
  return {};
}

export interface DealDetail {
  deal: Deal & { companyName: string; contactName: string | null };
  contacts: Contact[]; // the company's contacts — for the primary-contact picker
  activities: Activity[];
}

export async function getDealAction(id: number): Promise<DealDetail | null> {
  const session = await requireSession();
  const { organizationId } = session;
  const row: DealWithRefsRow | null = await getDeal(organizationId, id);
  if (!row) return null;
  if (!canAccessOwned(session.role, session.userId, await orgRestricted(organizationId), row.owner_user_id)) return null;
  const [contacts, activities] = await Promise.all([
    listContacts(organizationId, row.company_id).catch(() => []),
    listDealActivities(organizationId, id).catch(() => []),
  ]);
  return {
    deal: { ...toDeal(row), companyName: row.company_name, contactName: row.contact_name },
    contacts: contacts.map(toContact),
    activities: activities.map(toActivity),
  };
}

// ----------------------------------------------------------------- activities

export async function addActivityAction(input: {
  companyId: number;
  type?: string;
  summary: string;
  contactId?: number | null;
  dealId?: number | null;
}): Promise<{ error?: string }> {
  const g = await guardWrite();
  if ("error" in g) return { error: g.error };
  const { organizationId } = g.session;
  const v = validated(() => ({ summary: vString("Summary", input.summary, { required: true, max: 2000 }) }));
  if (!v.ok) return { error: v.error };
  if (!(await getCompany(organizationId, input.companyId))) return { error: "Company not found." };
  await addActivity(organizationId, { companyId: input.companyId, type: input.type, summary: v.value.summary, contactId: input.contactId ?? null, dealId: input.dealId ?? null });
  revalidatePath(`/companies/${input.companyId}`);
  if (input.contactId) revalidatePath(`/contacts/${input.contactId}`);
  if (input.dealId) revalidatePath(`/deals/${input.dealId}`);
  revalidatePath("/activities");
  return {};
}

// ------------------------------------------------------------ activity feed

export interface ActivityFeedItem extends Activity {
  companyName: string;
}

export interface ActivitiesPage {
  rows: ActivityFeedItem[];
  total: number;
  page: number;
  pageCount: number;
}

export async function activitiesPageAction(opts: {
  q?: string;
  type?: string;
  sinceDays?: number;
  sortKey: string;
  sortDir: 1 | -1;
  page: number;
  pageSize: number;
}): Promise<ActivitiesPage> {
  const { organizationId } = await requireSession();
  const res = await listActivitiesPage(organizationId, {
    q: opts.q?.trim() || undefined,
    type: opts.type || undefined,
    sinceDays: opts.sinceDays,
    sortKey: opts.sortKey,
    sortDir: opts.sortDir,
    page: opts.page,
    pageSize: opts.pageSize,
  });
  return {
    rows: res.rows.map((r: ActivityStatsRow) => ({ ...toActivity(r), companyName: r.company_name })),
    total: res.total,
    page: res.page,
    pageCount: res.pageCount,
  };
}

export async function deleteActivityAction(id: number): Promise<{ error?: string }> {
  const g = await guardWrite();
  if ("error" in g) return { error: g.error };
  await deleteActivity(g.session.organizationId, id);
  revalidatePath("/activities");
  return {};
}

// ------------------------------------------------------------- dashboard + board

export interface BoardDeal extends Deal {
  companyName: string;
}

export interface DashboardData {
  summary: PipelineSummary;
  companies: number;
  leads: number;
  customers: number;
  recent: Company[];
  /** biggest open deals — the "deals to watch" queue */
  focusDeals: BoardDeal[];
}

export async function dashboardAction(): Promise<DashboardData> {
  const session = await requireSession();
  const { organizationId } = session;
  const dealScope = ownerFilter("owner_user_id", session.role, session.userId, await orgRestricted(organizationId));
  const [companyRows, dealRows] = await Promise.all([listCompanies(organizationId), listDeals(organizationId, { ownerScope: dealScope })]);
  const companies = companyRows.map(toCompany);
  const deals = dealRows.map(toDeal);
  const names = new Map(companyRows.map((c) => [c.id, c.name]));
  const focusDeals = deals
    .filter((d) => stage(d.stage).open)
    .sort((a, b) => b.value - a.value)
    .slice(0, 6)
    .map((d) => ({ ...d, companyName: names.get(d.companyId) ?? "—" }));
  return {
    summary: summarizePipeline(deals),
    companies: companies.length,
    leads: companies.filter((c) => c.status === "lead").length,
    customers: companies.filter((c) => c.status === "customer").length,
    recent: companies.slice(0, 6),
    focusDeals,
  };
}

export async function boardAction(): Promise<BoardDeal[]> {
  const session = await requireSession();
  const { organizationId } = session;
  const dealScope = ownerFilter("owner_user_id", session.role, session.userId, await orgRestricted(organizationId));
  const [companyRows, dealRows] = await Promise.all([listCompanies(organizationId), listDeals(organizationId, { ownerScope: dealScope })]);
  const names = new Map(companyRows.map((c) => [c.id, c.name]));
  return dealRows.map((r) => ({ ...toDeal(r), companyName: names.get(r.company_id) ?? "—" }));
}

export interface DealsPage {
  rows: BoardDeal[];
  total: number;
  page: number;
  pageCount: number;
}

export async function dealsPageAction(opts: {
  q?: string;
  stage?: string;
  sortKey: string;
  sortDir: 1 | -1;
  page: number;
  pageSize: number;
}): Promise<DealsPage> {
  const session = await requireSession();
  const { organizationId } = session;
  const res = await listDealsPage(organizationId, {
    q: opts.q?.trim() || undefined,
    stage: opts.stage || undefined,
    sortKey: opts.sortKey,
    sortDir: opts.sortDir,
    page: opts.page,
    pageSize: opts.pageSize,
    ownerScope: ownerFilter("d.owner_user_id", session.role, session.userId, await orgRestricted(organizationId)),
  });
  return {
    rows: res.rows.map((r: DealStatsRow) => ({ ...toDeal(r), companyName: r.company_name })),
    total: res.total,
    page: res.page,
    pageCount: res.pageCount,
  };
}
