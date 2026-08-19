// Quotes domain — pure statuses + the server-side sort allowlist. A quote has a
// header (crm_quotes) and line items (crm_quote_items); totals are stored in
// integer cents. `q` = crm_quotes, `co` = joined company.

export type QuoteStatus = "draft" | "sent" | "accepted" | "declined";
export const QUOTE_STATUSES: QuoteStatus[] = ["draft", "sent", "accepted", "declined"];
export const QUOTE_STATUS_LABEL: Record<QuoteStatus, string> = {
  draft: "Draft",
  sent: "Sent",
  accepted: "Accepted",
  declined: "Declined",
};
export function isQuoteStatus(v: string): v is QuoteStatus {
  return (QUOTE_STATUSES as string[]).includes(v);
}

/** Human quote reference from the id, e.g. Q-0007. */
export function quoteNumber(id: number): string {
  return `Q-${String(id).padStart(4, "0")}`;
}

/** A quote is expired once its valid-until date is strictly before today.
 *  Both args are YYYY-MM-DD (lexicographic compare is date-correct). */
export function isQuoteExpired(validUntil: string | null, todayYmd: string): boolean {
  if (!validUntil) return false;
  return validUntil.slice(0, 10) < todayYmd;
}

export type QuoteSortKey = "number" | "company" | "status" | "total" | "created";
const SORT_EXPR: Record<QuoteSortKey, string> = {
  number: "q.id",
  company: "co.name",
  status: "q.status",
  total: "q.total_cents",
  created: "q.created_at",
};
const KEYS = new Set(Object.keys(SORT_EXPR));

export function isQuoteSortKey(v: string): v is QuoteSortKey {
  return KEYS.has(v);
}

export function buildQuoteOrderBy(key: string, dir: 1 | -1): string {
  const expr = isQuoteSortKey(key) ? SORT_EXPR[key] : SORT_EXPR.created;
  return `ORDER BY ${expr} ${dir === 1 ? "ASC" : "DESC"}, q.id DESC`;
}
