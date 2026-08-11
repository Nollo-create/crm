"use server";

import { revalidatePath } from "next/cache";
import { createLead, listLeadsPage, setLeadStatus, deleteLead, convertLead, getLead, updateLead, type LeadRow } from "@/lib/db";
import { requireSession } from "@/lib/auth/session";
import { recordAudit } from "@/lib/auth/audit";
import { isLeadSource, isLeadStatus, isLeadPriority } from "@/lib/crm/leads";

export interface Lead {
  id: number;
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
  annualValue: number;
  industryMatch: boolean;
  score: number;
  notes: string;
  priority: string;
  owner: string;
  convertedCompanyId: number | null;
  createdAt: string;
}

function toLead(r: LeadRow): Lead {
  return {
    id: r.id,
    name: r.name,
    company: r.company,
    title: r.title,
    email: r.email,
    phone: r.phone,
    source: r.source,
    status: r.status,
    industry: r.industry,
    website: r.website,
    employees: r.employees,
    annualValue: r.annual_value,
    industryMatch: !!r.industry_match,
    score: r.lead_score,
    notes: r.notes,
    priority: r.priority ?? "normal",
    owner: r.owner ?? "",
    convertedCompanyId: r.converted_company_id,
    createdAt: new Date(r.created_at).toISOString(),
  };
}

export interface LeadsPage {
  rows: Lead[];
  total: number;
  page: number;
  pageCount: number;
}

export async function leadsPageAction(opts: {
  q?: string;
  status?: string;
  source?: string;
  sortKey: string;
  sortDir: 1 | -1;
  page: number;
  pageSize: number;
}): Promise<LeadsPage> {
  const { organizationId } = await requireSession();
  const res = await listLeadsPage(organizationId, {
    q: opts.q?.trim() || undefined,
    status: opts.status || undefined,
    source: opts.source || undefined,
    sortKey: opts.sortKey,
    sortDir: opts.sortDir,
    page: opts.page,
    pageSize: opts.pageSize,
  });
  return { rows: res.rows.map(toLead), total: res.total, page: res.page, pageCount: res.pageCount };
}

export interface LeadInputDTO {
  name?: string;
  company?: string;
  title?: string;
  email?: string;
  phone?: string;
  source?: string;
  industry?: string;
  website?: string;
  employees?: number | null;
  industryMatch?: boolean;
  annualValue?: number;
  notes?: string;
  priority?: string;
  owner?: string;
}

export async function createLeadAction(input: LeadInputDTO): Promise<{ id?: number; error?: string }> {
  const { organizationId } = await requireSession();
  const name = (input.name ?? "").trim();
  const company = (input.company ?? "").trim();
  if (!name && !company) return { error: "A lead needs a name or a company." };
  const source = input.source && isLeadSource(input.source) ? input.source : "other";
  const id = await createLead(organizationId, { ...input, name, company, source, status: "new" });
  revalidatePath("/leads");
  return { id };
}

export async function setLeadStatusAction(id: number, status: string): Promise<{ error?: string }> {
  const { organizationId } = await requireSession();
  if (!isLeadStatus(status)) return { error: "Unknown status." };
  if (status === "converted") return { error: "Use Convert to convert a lead." };
  await setLeadStatus(organizationId, id, status);
  revalidatePath("/leads");
  return {};
}

export async function getLeadAction(id: number): Promise<Lead | null> {
  const { organizationId } = await requireSession();
  const row = await getLead(organizationId, id);
  return row ? toLead(row) : null;
}

export async function updateLeadAction(id: number, input: LeadInputDTO): Promise<{ error?: string }> {
  const { organizationId } = await requireSession();
  const name = (input.name ?? "").trim();
  const company = (input.company ?? "").trim();
  if (!name && !company) return { error: "A lead needs a name or a company." };
  const source = input.source && isLeadSource(input.source) ? input.source : "other";
  const priority = input.priority && isLeadPriority(input.priority) ? input.priority : "normal";
  await updateLead(organizationId, id, { ...input, name, company, source, priority });
  revalidatePath(`/leads/${id}`);
  revalidatePath("/leads");
  return {};
}

export async function deleteLeadAction(id: number): Promise<void> {
  const { organizationId } = await requireSession();
  await deleteLead(organizationId, id);
  revalidatePath("/leads");
}

export async function convertLeadAction(id: number): Promise<{ companyId?: number; error?: string }> {
  const session = await requireSession();
  const companyId = await convertLead(session.organizationId, id);
  if (!companyId) return { error: "Lead not found." };
  await recordAudit(session, "convert", "lead", id, `-> company #${companyId}`);
  revalidatePath("/leads");
  revalidatePath("/companies");
  revalidatePath("/");
  return { companyId };
}
