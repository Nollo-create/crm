"use server";

import { revalidatePath } from "next/cache";
import { createLead, listLeadsPage, setLeadStatus, deleteLead, convertLead, getLead, updateLead, bulkDeleteLeads, bulkSetLeadStatus, type LeadRow } from "@/lib/db";
import { requireSession } from "@/lib/auth/session";
import { recordAudit } from "@/lib/auth/audit";
import { isLeadSource, isLeadStatus, isLeadPriority } from "@/lib/crm/leads";
import { isStageId } from "@/lib/crm/pipeline";

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

/** Bulk-create leads from a parsed CSV (source = 'import'). Capped, fail-safe per
 *  row. A row needs a name or a company to count. */
export async function importLeadsAction(rows: LeadInputDTO[]): Promise<{ created: number; skipped: number }> {
  const session = await requireSession();
  const { organizationId } = session;
  let created = 0;
  let skipped = 0;
  for (const r of rows.slice(0, 500)) {
    const name = (r.name ?? "").trim();
    const company = (r.company ?? "").trim();
    if (!name && !company) {
      skipped++;
      continue;
    }
    try {
      await createLead(organizationId, {
        name,
        company,
        title: r.title,
        email: r.email,
        phone: r.phone,
        website: r.website,
        industry: r.industry,
        source: "import",
        status: "new",
      });
      created++;
    } catch {
      skipped++;
    }
  }
  if (created > 0) {
    revalidatePath("/leads");
    await recordAudit(session, "import", "lead", null, `${created} imported${skipped ? `, ${skipped} skipped` : ""}`);
  }
  return { created, skipped };
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

export async function bulkDeleteLeadsAction(ids: number[]): Promise<{ error?: string }> {
  const session = await requireSession();
  await bulkDeleteLeads(session.organizationId, ids);
  revalidatePath("/leads");
  await recordAudit(session, "bulk_delete", "lead", null, `${ids.length} lead${ids.length === 1 ? "" : "s"}`);
  return {};
}

export async function bulkSetLeadStatusAction(ids: number[], status: string): Promise<{ error?: string }> {
  const session = await requireSession();
  if (!isLeadStatus(status) || status === "converted") return { error: "Pick a status." };
  await bulkSetLeadStatus(session.organizationId, ids, status);
  revalidatePath("/leads");
  await recordAudit(session, "bulk_update", "lead", null, `set ${status} on ${ids.length}`);
  return {};
}

export async function convertLeadAction(
  id: number,
  opts?: { companyId?: number | null; deal?: { title: string; value?: number; stage?: string } | null }
): Promise<{ companyId?: number; dealId?: number | null; createdCompany?: boolean; error?: string }> {
  const session = await requireSession();
  let deal = opts?.deal ?? null;
  if (deal) {
    const title = (deal.title ?? "").trim();
    deal = title ? { title, value: deal.value ?? 0, stage: deal.stage && isStageId(deal.stage) ? deal.stage : "new" } : null;
  }
  const res = await convertLead(session.organizationId, id, { companyId: opts?.companyId ?? null, deal });
  if (!res) return { error: "Lead not found." };
  await recordAudit(session, "convert", "lead", id, `-> company #${res.companyId}${res.dealId ? ` + deal #${res.dealId}` : ""}`);
  revalidatePath("/leads");
  revalidatePath(`/leads/${id}`);
  revalidatePath("/companies");
  revalidatePath(`/companies/${res.companyId}`);
  revalidatePath("/");
  return { companyId: res.companyId, dealId: res.dealId, createdCompany: res.createdCompany };
}
