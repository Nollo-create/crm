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
  updateDeal,
  deleteDeal,
  getDeal,
  listDealActivities,
  listDealsForContact,
  closeDealWon,
  closeDealLost,
  setDealOpenStage,
  type DealStatsRow,
  type DealWithRefsRow,
  addActivity,
  listActivities,
  listActivitiesPage,
  type ActivityStatsRow,
  type CompanyRow,
  type ContactRow,
  type DealRow,
  type ActivityRow,
  type CompanyInput,
  type ContactInput,
  type DealInput,
} from "@/lib/db";
import { requireSession } from "@/lib/auth/session";
import { can } from "@/lib/auth/rbac";
import { recordAudit } from "@/lib/auth/audit";
import { isStageId, isLossReason, stage, summarizePipeline, type PipelineSummary, type StageId } from "@/lib/crm/pipeline";

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
  const { organizationId } = await requireSession();
  if (!STATUSES.includes(status)) return { error: "Unknown status." };
  await bulkSetCompanyStatus(organizationId, ids, status);
  revalidatePath("/companies");
  revalidatePath("/");
  return {};
}

export async function createCompanyAction(input: CompanyInput): Promise<{ id?: number; error?: string }> {
  const session = await requireSession();
  if (!input?.name?.trim()) return { error: "The company needs a name." };
  const id = await createCompany(session.organizationId, { ...input, name: input.name.trim() });
  await recordAudit(session, "create", "company", id, input.name.trim());
  revalidatePath("/companies");
  revalidatePath("/");
  return { id };
}

export async function updateCompanyAction(id: number, input: CompanyInput): Promise<{ error?: string }> {
  const { organizationId } = await requireSession();
  if (!input?.name?.trim()) return { error: "The company needs a name." };
  await updateCompany(organizationId, id, { ...input, name: input.name.trim() });
  revalidatePath(`/companies/${id}`);
  revalidatePath("/companies");
  return {};
}

/** Patch the descriptive account fields (legal name, contact details, VAT, etc.)
 *  without touching status/score — see db.updateCompanyDetails. */
export async function updateCompanyDetailsAction(id: number, input: CompanyDetailsInput): Promise<{ error?: string }> {
  const { organizationId } = await requireSession();
  if (!(await getCompany(organizationId, id))) return { error: "Company not found." };
  await updateCompanyDetails(organizationId, id, input);
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
  const { organizationId } = await requireSession();
  const c = await getCompany(organizationId, id);
  if (!c) return null;
  const [contacts, deals, activities] = await Promise.all([
    listContacts(organizationId, id),
    listDeals(organizationId, { companyId: id }),
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
  const { organizationId } = await requireSession();
  if (!input?.name?.trim()) return { error: "The contact needs a name." };
  if (!(await getCompany(organizationId, companyId))) return { error: "Company not found." };
  await addContact(organizationId, companyId, { ...input, name: input.name.trim() });
  revalidatePath(`/companies/${companyId}`);
  return {};
}

export async function deleteContactAction(id: number, companyId: number): Promise<void> {
  const { organizationId } = await requireSession();
  await deleteContact(organizationId, id);
  revalidatePath(`/companies/${companyId}`);
  revalidatePath("/contacts");
}

export interface ContactDetail {
  contact: Contact & { companyName: string };
  activities: Activity[];
  deals: Deal[];
}

export async function getContactAction(id: number): Promise<ContactDetail | null> {
  const { organizationId } = await requireSession();
  const row: ContactWithCompanyRow | null = await getContact(organizationId, id);
  if (!row) return null;
  const [activities, deals] = await Promise.all([
    listContactActivities(organizationId, id).catch(() => []),
    listDealsForContact(organizationId, id).catch(() => []),
  ]);
  return {
    contact: { ...toContact(row), companyName: row.company_name },
    activities: activities.map(toActivity),
    deals: deals.map(toDeal),
  };
}

export async function updateContactAction(id: number, companyId: number, input: ContactInput): Promise<{ error?: string }> {
  const { organizationId } = await requireSession();
  if (!input?.name?.trim()) return { error: "The contact needs a name." };
  await updateContact(organizationId, id, { ...input, name: input.name.trim() });
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
  const { organizationId } = await requireSession();
  if (!input?.title?.trim()) return { error: "The deal needs a title." };
  if (!(await getCompany(organizationId, companyId))) return { error: "Company not found." };
  const stage = input.stage && isStageId(input.stage) ? input.stage : "new";
  await createDeal(organizationId, companyId, { ...input, title: input.title.trim(), stage });
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
  const { organizationId } = await requireSession();
  if (!isStageId(stage)) return { error: "Unknown stage." };
  if (stage === "won") await closeDealWon(organizationId, id);
  else if (stage === "lost") await closeDealLost(organizationId, id, "");
  else await setDealOpenStage(organizationId, id, stage);
  revalidateDeal(id);
  return {};
}

export async function markDealWonAction(id: number): Promise<{ companyId?: number; error?: string }> {
  const session = await requireSession();
  const r = await closeDealWon(session.organizationId, id);
  if (!r) return { error: "Deal not found." };
  await recordAudit(session, "deal_won", "deal", id, `company #${r.companyId} -> customer`);
  revalidateDeal(id, r.companyId);
  return { companyId: r.companyId };
}

export async function markDealLostAction(id: number, reason: string): Promise<{ error?: string }> {
  const session = await requireSession();
  if (!isLossReason(reason)) return { error: "Pick a loss reason." };
  const r = await closeDealLost(session.organizationId, id, reason);
  if (!r) return { error: "Deal not found." };
  await recordAudit(session, "deal_lost", "deal", id, reason);
  revalidateDeal(id, r.companyId);
  return {};
}

export async function reopenDealAction(id: number, stage: string): Promise<{ error?: string }> {
  const { organizationId } = await requireSession();
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
  const { organizationId } = await requireSession();
  if (patch.stage !== undefined && !isStageId(patch.stage)) return { error: "Unknown stage." };
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

export interface DealDetail {
  deal: Deal & { companyName: string; contactName: string | null };
  contacts: Contact[]; // the company's contacts — for the primary-contact picker
  activities: Activity[];
}

export async function getDealAction(id: number): Promise<DealDetail | null> {
  const { organizationId } = await requireSession();
  const row: DealWithRefsRow | null = await getDeal(organizationId, id);
  if (!row) return null;
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
  const { organizationId } = await requireSession();
  if (!input?.summary?.trim()) return { error: "Write what happened." };
  if (!(await getCompany(organizationId, input.companyId))) return { error: "Company not found." };
  await addActivity(organizationId, { companyId: input.companyId, type: input.type, summary: input.summary.trim(), contactId: input.contactId ?? null, dealId: input.dealId ?? null });
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
  sortKey: string;
  sortDir: 1 | -1;
  page: number;
  pageSize: number;
}): Promise<ActivitiesPage> {
  const { organizationId } = await requireSession();
  const res = await listActivitiesPage(organizationId, {
    q: opts.q?.trim() || undefined,
    type: opts.type || undefined,
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
  const { organizationId } = await requireSession();
  const [companyRows, dealRows] = await Promise.all([listCompanies(organizationId), listDeals(organizationId)]);
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
  const { organizationId } = await requireSession();
  const [companyRows, dealRows] = await Promise.all([listCompanies(organizationId), listDeals(organizationId)]);
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
  const { organizationId } = await requireSession();
  const res = await listDealsPage(organizationId, {
    q: opts.q?.trim() || undefined,
    stage: opts.stage || undefined,
    sortKey: opts.sortKey,
    sortDir: opts.sortDir,
    page: opts.page,
    pageSize: opts.pageSize,
  });
  return {
    rows: res.rows.map((r: DealStatsRow) => ({ ...toDeal(r), companyName: r.company_name })),
    total: res.total,
    page: res.page,
    pageCount: res.pageCount,
  };
}
