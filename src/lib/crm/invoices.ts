// Invoices domain — pure statuses, numbering, overdue rule, and the server-side
// sort allowlist. An invoice has a header (crm_invoices) and line items
// (crm_invoice_items); money is stored in integer cents. `i` = crm_invoices,
// `co` = joined company.

export type InvoiceStatus = "draft" | "sent" | "paid" | "void";
export const INVOICE_STATUSES: InvoiceStatus[] = ["draft", "sent", "paid", "void"];
export const INVOICE_STATUS_LABEL: Record<InvoiceStatus, string> = {
  draft: "Draft",
  sent: "Sent",
  paid: "Paid",
  void: "Void",
};
export function isInvoiceStatus(v: string): v is InvoiceStatus {
  return (INVOICE_STATUSES as string[]).includes(v);
}

/** Human invoice reference from the id, e.g. INV-0007. */
export function invoiceNumber(id: number): string {
  return `INV-${String(id).padStart(4, "0")}`;
}

/** Overdue = issued (sent), unpaid, past its due date. Draft/paid/void never
 *  count. Both dates are YYYY-MM-DD (lexicographic compare is date-correct). */
export function isInvoiceOverdue(status: string, dueDate: string | null, todayYmd: string): boolean {
  if (status !== "sent" || !dueDate) return false;
  return dueDate.slice(0, 10) < todayYmd;
}

export type InvoiceSortKey = "number" | "company" | "status" | "total" | "due" | "created";
const SORT_EXPR: Record<InvoiceSortKey, string> = {
  number: "i.id",
  company: "co.name",
  status: "i.status",
  total: "i.total_cents",
  due: "i.due_date",
  created: "i.created_at",
};
const KEYS = new Set(Object.keys(SORT_EXPR));

export function isInvoiceSortKey(v: string): v is InvoiceSortKey {
  return KEYS.has(v);
}

export function buildInvoiceOrderBy(key: string, dir: 1 | -1): string {
  const expr = isInvoiceSortKey(key) ? SORT_EXPR[key] : SORT_EXPR.created;
  return `ORDER BY ${expr} ${dir === 1 ? "ASC" : "DESC"}, i.id DESC`;
}
