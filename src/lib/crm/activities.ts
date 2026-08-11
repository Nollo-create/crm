// Activities domain — pure types + the server-side sort allowlist. An activity
// is a logged touch (note/call/email/…) on a company. `a` = crm_activities,
// `co` = joined crm_companies.

export type ActivityType = "note" | "call" | "email" | "meeting" | "quote";
export const ACTIVITY_TYPES: ActivityType[] = ["note", "call", "email", "meeting", "quote"];
export const ACTIVITY_TYPE_LABEL: Record<ActivityType, string> = {
  note: "Note",
  call: "Call",
  email: "Email",
  meeting: "Meeting",
  quote: "Quote",
};
export function isActivityType(v: string): v is ActivityType {
  return (ACTIVITY_TYPES as string[]).includes(v);
}

export type ActivitySortKey = "created" | "type" | "company";
const SORT_EXPR: Record<ActivitySortKey, string> = {
  created: "a.created_at",
  type: "a.type",
  company: "co.name",
};
const KEYS = new Set(Object.keys(SORT_EXPR));

export function isActivitySortKey(v: string): v is ActivitySortKey {
  return KEYS.has(v);
}

export function buildActivityOrderBy(key: string, dir: 1 | -1): string {
  const expr = isActivitySortKey(key) ? SORT_EXPR[key] : SORT_EXPR.created;
  return `ORDER BY ${expr} ${dir === 1 ? "ASC" : "DESC"}, a.id DESC`;
}
