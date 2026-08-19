"use server";

import { revalidatePath } from "next/cache";
import { guardWrite } from "@/lib/auth/session";
import { recordAudit } from "@/lib/auth/audit";
import { createCompany, updateCompanyDetails, addContact, listCompanies } from "@/lib/db";

export interface ImportResult {
  created: number;
  skipped: number;
  error?: string;
}

const CAP = 500;

export async function importCompaniesAction(
  rows: { name?: string; industry?: string; city?: string; website?: string; phone?: string; email?: string; country?: string; vatId?: string }[]
): Promise<ImportResult> {
  const g = await guardWrite();
  if ("error" in g) return { created: 0, skipped: 0, error: g.error };
  const { organizationId } = g.session;
  const clean = (Array.isArray(rows) ? rows : []).filter((r) => (r.name || "").trim()).slice(0, CAP);
  let created = 0;
  let skipped = 0;
  for (const r of clean) {
    try {
      const id = await createCompany(organizationId, { name: r.name!.trim(), industry: r.industry, city: r.city, website: r.website });
      if (r.phone || r.email || r.country || r.vatId) {
        await updateCompanyDetails(organizationId, id, {
          legalName: "",
          phone: r.phone ?? "",
          email: r.email ?? "",
          country: r.country ?? "",
          address: "",
          vatId: r.vatId ?? "",
          description: "",
        }).catch(() => {});
      }
      created++;
    } catch {
      skipped++;
    }
  }
  await recordAudit(g.session, "companies_import", "company", 0, `${created} imported`);
  revalidatePath("/companies");
  return { created, skipped };
}

export async function importContactsAction(
  rows: { name?: string; company?: string; email?: string; phone?: string; title?: string }[]
): Promise<ImportResult> {
  const g = await guardWrite();
  if ("error" in g) return { created: 0, skipped: 0, error: g.error };
  const { organizationId } = g.session;
  const clean = (Array.isArray(rows) ? rows : []).filter((r) => (r.name || "").trim() && (r.company || "").trim()).slice(0, CAP);
  // Find-or-create the company by name, cached so one CSV doesn't create dupes.
  const companyCache = new Map<string, number>();
  let created = 0;
  let skipped = 0;
  for (const r of clean) {
    const companyName = r.company!.trim();
    const key = companyName.toLowerCase();
    try {
      let companyId = companyCache.get(key);
      if (companyId == null) {
        const existing = await listCompanies(organizationId, { q: companyName }).catch(() => []);
        const match = existing.find((c) => c.name.trim().toLowerCase() === key);
        companyId = match ? match.id : await createCompany(organizationId, { name: companyName });
        companyCache.set(key, companyId);
      }
      await addContact(organizationId, companyId, { name: r.name!.trim(), email: r.email ?? "", phone: r.phone ?? "", role: r.title ?? "" });
      created++;
    } catch {
      skipped++;
    }
  }
  await recordAudit(g.session, "contacts_import", "contact", 0, `${created} imported`);
  revalidatePath("/contacts");
  return { created, skipped };
}
