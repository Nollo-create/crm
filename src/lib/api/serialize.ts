import type { CompanyStatsRow, ContactStatsRow, DealStatsRow } from "@/lib/db";

// Curated public shapes for the v1 API — an explicit, stable contract, decoupled
// from internal column names (snake_case DB -> camelCase JSON, dates as ISO). Type
// imports only, so this stays a pure module.

const iso = (d: Date | null): string | null => (d ? new Date(d).toISOString() : null);

export function serializeCompany(r: CompanyStatsRow) {
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
    contacts: r.contacts,
    openDeals: r.open_deals,
    openValue: r.open_value,
    lastActivity: iso(r.last_activity),
    createdAt: iso(r.created_at),
  };
}

export function serializeContact(r: ContactStatsRow) {
  return {
    id: r.id,
    companyId: r.company_id,
    company: r.company_name,
    name: r.name,
    role: r.role,
    email: r.email,
    phone: r.phone,
    department: r.department,
    influence: r.influence,
    createdAt: iso(r.created_at),
  };
}

export function serializeDeal(r: DealStatsRow) {
  return {
    id: r.id,
    companyId: r.company_id,
    company: r.company_name,
    title: r.title,
    value: r.value,
    stage: r.stage,
    probability: r.probability,
    expectedClose: iso(r.expected_close),
    owner: r.owner,
    createdAt: iso(r.created_at),
  };
}
