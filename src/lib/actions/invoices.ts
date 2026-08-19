"use server";

import { revalidatePath } from "next/cache";
import {
  createInvoice,
  createInvoiceFromQuote,
  listInvoicesPage,
  getInvoice,
  updateInvoice,
  deleteInvoice,
  addInvoiceItem,
  setInvoiceItemQuantity,
  deleteInvoiceItem,
  markInvoicePaid,
  markInvoiceUnpaid,
  invoiceSummary,
  getCompany,
  type InvoiceStatsRow,
  type InvoiceItemRow,
} from "@/lib/db";
import { requireSession, guardWrite } from "@/lib/auth/session";
import { recordAudit } from "@/lib/auth/audit";
import { publicBaseUrl } from "@/lib/email/mailbox";
import { invoiceNumber, isInvoiceStatus, isInvoiceOverdue } from "@/lib/crm/invoices";
import { validated, vString, vInt } from "@/lib/crm/validate";

const ymd = (d: Date | null) => (d ? new Date(d).toISOString().slice(0, 10) : null);
const today = () => new Date().toISOString().slice(0, 10);

export interface Invoice {
  id: number;
  number: string;
  companyId: number;
  companyName: string;
  quoteId: number | null;
  status: string;
  total: number; // euros
  issueDate: string | null;
  dueDate: string | null;
  overdue: boolean;
  createdAt: string;
}
function toInvoice(r: InvoiceStatsRow, todayYmd: string): Invoice {
  return {
    id: r.id,
    number: invoiceNumber(r.id),
    companyId: r.company_id,
    companyName: r.company_name,
    quoteId: r.quote_id,
    status: r.status,
    total: r.total_cents / 100,
    issueDate: ymd(r.issue_date),
    dueDate: ymd(r.due_date),
    overdue: isInvoiceOverdue(r.status, ymd(r.due_date), todayYmd),
    createdAt: new Date(r.created_at).toISOString(),
  };
}

export interface InvoiceItem {
  id: number;
  name: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
}
function toItem(r: InvoiceItemRow): InvoiceItem {
  return { id: r.id, name: r.name, unitPrice: r.unit_price_cents / 100, quantity: r.quantity, lineTotal: r.line_total_cents / 100 };
}

export interface InvoiceDetail {
  invoice: Invoice & { notes: string; publicToken: string; paidAmount: number; paymentMethod: string; paidAt: string | null };
  items: InvoiceItem[];
  baseUrl: string;
}

export interface InvoicesPage {
  rows: Invoice[];
  total: number;
  page: number;
  pageCount: number;
  summary: { outstanding: number; overdue: number; paid: number; draftCount: number };
}

export async function invoicesPageAction(opts: { q?: string; status?: string; sortKey: string; sortDir: 1 | -1; page: number; pageSize: number }): Promise<InvoicesPage> {
  const { organizationId } = await requireSession();
  const [res, sum] = await Promise.all([
    listInvoicesPage(organizationId, { q: opts.q?.trim() || undefined, status: opts.status || undefined, sortKey: opts.sortKey, sortDir: opts.sortDir, page: opts.page, pageSize: opts.pageSize }),
    invoiceSummary(organizationId).catch(() => ({ outstandingCents: 0, overdueCents: 0, paidCents: 0, draftCount: 0 })),
  ]);
  const t = today();
  return {
    rows: res.rows.map((r) => toInvoice(r, t)),
    total: res.total,
    page: res.page,
    pageCount: res.pageCount,
    summary: { outstanding: sum.outstandingCents / 100, overdue: sum.overdueCents / 100, paid: sum.paidCents / 100, draftCount: sum.draftCount },
  };
}

export async function getInvoiceAction(id: number): Promise<InvoiceDetail | null> {
  const { organizationId } = await requireSession();
  const [res, baseUrl] = await Promise.all([getInvoice(organizationId, id), publicBaseUrl().catch(() => "")]);
  if (!res) return null;
  const t = today();
  return {
    invoice: {
      ...toInvoice(res.invoice, t),
      notes: res.invoice.notes,
      publicToken: res.invoice.public_token || "",
      paidAmount: res.invoice.paid_amount_cents / 100,
      paymentMethod: res.invoice.payment_method || "",
      paidAt: res.invoice.paid_at ? new Date(res.invoice.paid_at).toISOString() : null,
    },
    items: res.items.map(toItem),
    baseUrl,
  };
}

export async function createInvoiceAction(companyId: number, opts: { dueDate?: string | null } = {}): Promise<{ id?: number; error?: string }> {
  const g = await guardWrite();
  if ("error" in g) return { error: g.error };
  const { organizationId } = g.session;
  if (!(await getCompany(organizationId, companyId))) return { error: "Company not found." };
  const id = await createInvoice(organizationId, companyId, { issueDate: today(), dueDate: opts.dueDate ?? null }, g.session.email);
  await recordAudit(g.session, "invoice_create", "invoice", id, invoiceNumber(id));
  revalidatePath("/invoices");
  return { id };
}

export async function createInvoiceFromQuoteAction(quoteId: number, opts: { dueDate?: string | null } = {}): Promise<{ id?: number; error?: string }> {
  const g = await guardWrite();
  if ("error" in g) return { error: g.error };
  const id = await createInvoiceFromQuote(g.session.organizationId, quoteId, { dueDate: opts.dueDate ?? null }, g.session.email);
  if (!id) return { error: "Quote not found." };
  await recordAudit(g.session, "invoice_from_quote", "invoice", id, `${invoiceNumber(id)} from quote #${quoteId}`);
  revalidatePath("/invoices");
  revalidatePath(`/invoices/${id}`);
  return { id };
}

export async function updateInvoiceAction(id: number, patch: { notes?: string; issueDate?: string | null; dueDate?: string | null }): Promise<{ error?: string }> {
  const g = await guardWrite();
  if ("error" in g) return { error: g.error };
  const check = validated(() => { vString("Notes", patch.notes, { max: 2000 }); return true; });
  if (!check.ok) return { error: check.error };
  await updateInvoice(g.session.organizationId, id, patch);
  revalidatePath(`/invoices/${id}`);
  return {};
}

export async function setInvoiceStatusAction(id: number, status: string): Promise<{ error?: string }> {
  const g = await guardWrite();
  if ("error" in g) return { error: g.error };
  if (!isInvoiceStatus(status)) return { error: "Unknown status." };
  // Paid is set via markInvoicePaidAction (it snapshots the amount); block the raw path.
  if (status === "paid") return { error: "Use ‘Mark paid’ to record a payment." };
  await updateInvoice(g.session.organizationId, id, { status });
  revalidatePath(`/invoices/${id}`);
  revalidatePath("/invoices");
  return {};
}

export async function markInvoicePaidAction(id: number, method = "manual"): Promise<{ error?: string }> {
  const g = await guardWrite();
  if ("error" in g) return { error: g.error };
  await markInvoicePaid(g.session.organizationId, id, method);
  await recordAudit(g.session, "invoice_paid", "invoice", id, invoiceNumber(id));
  revalidatePath(`/invoices/${id}`);
  revalidatePath("/invoices");
  return {};
}

export async function markInvoiceUnpaidAction(id: number): Promise<{ error?: string }> {
  const g = await guardWrite();
  if ("error" in g) return { error: g.error };
  await markInvoiceUnpaid(g.session.organizationId, id);
  revalidatePath(`/invoices/${id}`);
  revalidatePath("/invoices");
  return {};
}

export async function deleteInvoiceAction(id: number): Promise<{ error?: string }> {
  const g = await guardWrite();
  if ("error" in g) return { error: g.error };
  await deleteInvoice(g.session.organizationId, id);
  revalidatePath("/invoices");
  return {};
}

async function assertDraft(orgId: number, invoiceId: number): Promise<{ error?: string }> {
  const inv = await getInvoice(orgId, invoiceId);
  if (!inv) return { error: "Invoice not found." };
  if (inv.invoice.status !== "draft") return { error: "Only draft invoices can be edited." };
  return {};
}

export async function addInvoiceItemAction(invoiceId: number, item: { name: string; unitPrice: number; quantity: number }): Promise<{ error?: string }> {
  const g = await guardWrite();
  if ("error" in g) return { error: g.error };
  const { organizationId } = g.session;
  const v = validated(() => ({
    name: vString("Line name", item.name, { required: true, max: 200 }),
    quantity: vInt("Quantity", item.quantity, { min: 1, max: 100000 }) ?? 1,
  }));
  if (!v.ok) return { error: v.error };
  if (!Number.isFinite(Number(item.unitPrice)) || Number(item.unitPrice) < 0) return { error: "Unit price must be a positive number." };
  const draft = await assertDraft(organizationId, invoiceId);
  if (draft.error) return draft;
  await addInvoiceItem(organizationId, invoiceId, { name: v.value.name, unitPriceCents: Math.round(Number(item.unitPrice) * 100), quantity: v.value.quantity });
  revalidatePath(`/invoices/${invoiceId}`);
  revalidatePath("/invoices");
  return {};
}

export async function setInvoiceItemQuantityAction(invoiceId: number, itemId: number, quantity: number): Promise<{ error?: string }> {
  const g = await guardWrite();
  if ("error" in g) return { error: g.error };
  const draft = await assertDraft(g.session.organizationId, invoiceId);
  if (draft.error) return draft;
  await setInvoiceItemQuantity(g.session.organizationId, invoiceId, itemId, quantity);
  revalidatePath(`/invoices/${invoiceId}`);
  return {};
}

export async function deleteInvoiceItemAction(invoiceId: number, itemId: number): Promise<{ error?: string }> {
  const g = await guardWrite();
  if ("error" in g) return { error: g.error };
  const draft = await assertDraft(g.session.organizationId, invoiceId);
  if (draft.error) return draft;
  await deleteInvoiceItem(g.session.organizationId, invoiceId, itemId);
  revalidatePath(`/invoices/${invoiceId}`);
  return {};
}
