"use server";

// NOTE: no authentication yet — the CRM runs open until the Sajtpress SSO bridge
// lands (next etapa). Keep the app private (cPanel Directory Privacy) and don't
// load real customer data until then.

import { revalidatePath } from "next/cache";
import {
  createCompany,
  listCompanies,
  getCompany,
  updateCompany,
  deleteCompany,
  addContact,
  listContacts,
  deleteContact,
  createDeal,
  listDeals,
  updateDeal,
  deleteDeal,
  addActivity,
  listActivities,
  type CompanyRow,
  type ContactRow,
  type DealRow,
  type ActivityRow,
  type CompanyInput,
  type ContactInput,
  type DealInput,
} from "@/lib/db";
import { isStageId, stage, summarizePipeline, type PipelineSummary, type StageId } from "@/lib/crm/pipeline";

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
  };
}
function toActivity(r: ActivityRow): Activity {
  return { id: r.id, companyId: r.company_id, type: r.type, summary: r.summary, createdAt: iso(r.created_at) };
}

// ------------------------------------------------------------------ companies

export async function listCompaniesAction(q = "", status = ""): Promise<Company[]> {
  const rows = await listCompanies({ q: q.trim() || undefined, status: status || undefined });
  return rows.map(toCompany);
}

export async function createCompanyAction(input: CompanyInput): Promise<{ id?: number; error?: string }> {
  if (!input?.name?.trim()) return { error: "The company needs a name." };
  const id = await createCompany({ ...input, name: input.name.trim() });
  revalidatePath("/companies");
  revalidatePath("/");
  return { id };
}

export async function updateCompanyAction(id: number, input: CompanyInput): Promise<{ error?: string }> {
  if (!input?.name?.trim()) return { error: "The company needs a name." };
  await updateCompany(id, { ...input, name: input.name.trim() });
  revalidatePath(`/companies/${id}`);
  revalidatePath("/companies");
  return {};
}

export async function deleteCompanyAction(id: number): Promise<void> {
  await deleteCompany(id);
  revalidatePath("/companies");
  revalidatePath("/");
}

export interface CompanyDetail {
  company: Company;
  contacts: Contact[];
  deals: Deal[];
  activities: Activity[];
  summary: PipelineSummary;
}

export async function getCompanyAction(id: number): Promise<CompanyDetail | null> {
  const c = await getCompany(id);
  if (!c) return null;
  const [contacts, deals, activities] = await Promise.all([listContacts(id), listDeals({ companyId: id }), listActivities(id)]);
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
  if (!input?.name?.trim()) return { error: "The contact needs a name." };
  await addContact(companyId, { ...input, name: input.name.trim() });
  revalidatePath(`/companies/${companyId}`);
  return {};
}

export async function deleteContactAction(id: number, companyId: number): Promise<void> {
  await deleteContact(id);
  revalidatePath(`/companies/${companyId}`);
}

// ---------------------------------------------------------------------- deals

export async function createDealAction(companyId: number, input: DealInput): Promise<{ error?: string }> {
  if (!input?.title?.trim()) return { error: "The deal needs a title." };
  const stage = input.stage && isStageId(input.stage) ? input.stage : "new";
  await createDeal(companyId, { ...input, title: input.title.trim(), stage });
  revalidatePath(`/companies/${companyId}`);
  revalidatePath("/pipeline");
  revalidatePath("/");
  return {};
}

export async function updateDealStageAction(id: number, stage: string): Promise<{ error?: string }> {
  if (!isStageId(stage)) return { error: "Unknown stage." };
  await updateDeal(id, { stage });
  revalidatePath("/pipeline");
  revalidatePath("/");
  return {};
}

export async function updateDealAction(
  id: number,
  companyId: number,
  patch: { title?: string; value?: number; stage?: string; probability?: number | null; expectedClose?: string | null; owner?: string }
): Promise<{ error?: string }> {
  if (patch.stage !== undefined && !isStageId(patch.stage)) return { error: "Unknown stage." };
  await updateDeal(id, patch);
  revalidatePath(`/companies/${companyId}`);
  revalidatePath("/pipeline");
  revalidatePath("/");
  return {};
}

export async function deleteDealAction(id: number, companyId: number): Promise<void> {
  await deleteDeal(id);
  revalidatePath(`/companies/${companyId}`);
  revalidatePath("/pipeline");
  revalidatePath("/");
}

// ----------------------------------------------------------------- activities

export async function addActivityAction(input: {
  companyId: number;
  type?: string;
  summary: string;
}): Promise<{ error?: string }> {
  if (!input?.summary?.trim()) return { error: "Write what happened." };
  await addActivity({ companyId: input.companyId, type: input.type, summary: input.summary.trim() });
  revalidatePath(`/companies/${input.companyId}`);
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
  const [companyRows, dealRows] = await Promise.all([listCompanies(), listDeals()]);
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
  const [companyRows, dealRows] = await Promise.all([listCompanies(), listDeals()]);
  const names = new Map(companyRows.map((c) => [c.id, c.name]));
  return dealRows.map((r) => ({ ...toDeal(r), companyName: names.get(r.company_id) ?? "—" }));
}
