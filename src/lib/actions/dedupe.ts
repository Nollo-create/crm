"use server";

import { revalidatePath } from "next/cache";
import { requireSession, guardWrite } from "@/lib/auth/session";
import { recordAudit } from "@/lib/auth/audit";
import { findDuplicateGroups, type DedupeCompany, type DuplicateReason } from "@/lib/crm/dedupe";
import { listCompaniesForDedupe, mergeCompanies, addActivity, getCompany, type MergeResult } from "@/lib/db";

export interface DedupeCompanySummary {
  id: number;
  name: string;
  website: string;
  email: string;
  vatId: string;
  city: string;
  status: string;
  createdAt: string;
  contacts: number;
  deals: number;
  activities: number;
}

export interface DuplicateGroupView {
  reason: DuplicateReason;
  value: string;
  companies: DedupeCompanySummary[];
}

export async function duplicateGroupsAction(): Promise<DuplicateGroupView[]> {
  const { organizationId } = await requireSession();
  const rows = await listCompaniesForDedupe(organizationId).catch(() => []);
  const byId = new Map(rows.map((r) => [r.id, r]));
  const forDetect: DedupeCompany[] = rows.map((r) => ({ id: r.id, name: r.name, website: r.website, email: r.email, vatId: r.vat_id }));
  const groups = findDuplicateGroups(forDetect);
  return groups.map((g) => ({
    reason: g.reason,
    value: g.value,
    companies: g.ids
      .map((id) => byId.get(id))
      .filter((r): r is NonNullable<typeof r> => !!r)
      .map((r) => ({
        id: r.id,
        name: r.name,
        website: r.website,
        email: r.email,
        vatId: r.vat_id,
        city: r.city,
        status: r.status,
        createdAt: new Date(r.created_at).toISOString(),
        contacts: Number(r.contact_count),
        deals: Number(r.deal_count),
        activities: Number(r.activity_count),
      })),
  }));
}

export async function mergeCompaniesAction(primaryId: number, duplicateId: number): Promise<{ moved?: MergeResult; error?: string }> {
  const g = await guardWrite();
  if ("error" in g) return { error: g.error };
  const { organizationId } = g.session;
  if (primaryId === duplicateId) return { error: "Pick two different companies." };

  // Names for the audit/activity trail, captured before the duplicate is gone.
  const [primary, dup] = await Promise.all([getCompany(organizationId, primaryId), getCompany(organizationId, duplicateId)]);
  if (!primary || !dup) return { error: "One of the companies no longer exists." };

  const moved = await mergeCompanies(organizationId, primaryId, duplicateId).catch(() => null);
  if (!moved) return { error: "Couldn't merge those companies." };

  await recordAudit(g.session, "company_merge", "company", primaryId, `Merged "${dup.name}" into "${primary.name}"`);
  await addActivity(organizationId, {
    companyId: primaryId,
    type: "note",
    summary: `Merged duplicate "${dup.name}" into this company — moved ${moved.contacts} contact(s), ${moved.deals} deal(s), ${moved.quotes} quote(s)`,
  }).catch(() => {});

  revalidatePath("/duplicates");
  revalidatePath("/companies");
  return { moved };
}
