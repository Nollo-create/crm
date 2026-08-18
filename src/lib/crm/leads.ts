// Leads domain — pure data + the server-side sort allowlist, shared by the
// data layer, actions and UI. A lead is a raw inbound prospect that gets
// qualified and then CONVERTED into a company (+ contact). `l` = crm_leads.

export type LeadStatus = "new" | "working" | "qualified" | "unqualified" | "converted";
export const LEAD_STATUSES: LeadStatus[] = ["new", "working", "qualified", "unqualified", "converted"];
export const LEAD_STATUS_LABEL: Record<LeadStatus, string> = {
  new: "New",
  working: "Working",
  qualified: "Qualified",
  unqualified: "Unqualified",
  converted: "Converted",
};
export function isLeadStatus(v: string): v is LeadStatus {
  return (LEAD_STATUSES as string[]).includes(v);
}

export type LeadSource = "web" | "referral" | "event" | "cold" | "import" | "other";
export const LEAD_SOURCES: LeadSource[] = ["web", "referral", "event", "cold", "import", "other"];
export const LEAD_SOURCE_LABEL: Record<LeadSource, string> = {
  web: "Website",
  referral: "Referral",
  event: "Event",
  cold: "Cold outreach",
  import: "Imported",
  other: "Other",
};
export function isLeadSource(v: string): v is LeadSource {
  return (LEAD_SOURCES as string[]).includes(v);
}

export type LeadPriority = "low" | "normal" | "high";
export const LEAD_PRIORITIES: LeadPriority[] = ["low", "normal", "high"];
export const LEAD_PRIORITY_LABEL: Record<LeadPriority, string> = { low: "Low", normal: "Normal", high: "High" };
export function isLeadPriority(v: string): v is LeadPriority {
  return (LEAD_PRIORITIES as string[]).includes(v);
}

export type LeadSortKey = "name" | "company" | "source" | "status" | "score" | "created";
const SORT_EXPR: Record<LeadSortKey, string> = {
  name: "l.name",
  company: "l.company",
  source: "l.source",
  status: "l.status",
  score: "l.lead_score",
  created: "l.id",
};
const KEYS = new Set(Object.keys(SORT_EXPR));
export function isLeadSortKey(v: string): v is LeadSortKey {
  return KEYS.has(v);
}
export function buildLeadOrderBy(key: string, dir: 1 | -1): string {
  const expr = isLeadSortKey(key) ? SORT_EXPR[key] : SORT_EXPR.score;
  return `ORDER BY ${expr} ${dir === 1 ? "ASC" : "DESC"}, l.id DESC`;
}
