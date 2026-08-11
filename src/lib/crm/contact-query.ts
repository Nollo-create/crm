// Server-side sorting for the Contacts directory. Allowlisted column
// expressions (the sort key is never interpolated raw, so ORDER BY can't be
// injected). `ct` = crm_contacts, `co` = the joined crm_companies. Pagination
// math is shared from company-query (pageBounds).

export type ContactSortKey = "name" | "role" | "company" | "email" | "influence";

const SORT_EXPR: Record<ContactSortKey, string> = {
  name: "ct.name",
  role: "ct.role",
  company: "co.name",
  email: "ct.email",
  influence: "ct.influence",
};

const KEYS = new Set(Object.keys(SORT_EXPR));

export function isContactSortKey(v: string): v is ContactSortKey {
  return KEYS.has(v);
}

export function buildContactOrderBy(key: string, dir: 1 | -1): string {
  const expr = isContactSortKey(key) ? SORT_EXPR[key] : SORT_EXPR.name;
  const direction = dir === 1 ? "ASC" : "DESC";
  return `ORDER BY ${expr} ${direction}, ct.id DESC`;
}
