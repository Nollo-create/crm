"use server";

import { revalidatePath } from "next/cache";
import {
  createQuote,
  duplicateQuote,
  listQuotesPage,
  getQuote,
  updateQuote,
  deleteQuote,
  addQuoteItem,
  setQuoteItemQuantity,
  deleteQuoteItem,
  searchProducts,
  getCompany,
  type QuoteStatsRow,
  type QuoteItemRow,
  type ProductRow,
} from "@/lib/db";
import { requireSession, guardWrite } from "@/lib/auth/session";
import { isQuoteStatus, quoteNumber } from "@/lib/crm/quotes";
import { validated, vString, vInt } from "@/lib/crm/validate";

const ymd = (d: Date | null) => (d ? new Date(d).toISOString().slice(0, 10) : null);

export interface Quote {
  id: number;
  number: string;
  companyId: number;
  companyName: string;
  status: string;
  total: number; // euros
  validUntil: string | null;
  createdAt: string;
}
function toQuote(r: QuoteStatsRow): Quote {
  return {
    id: r.id,
    number: quoteNumber(r.id),
    companyId: r.company_id,
    companyName: r.company_name,
    status: r.status,
    total: r.total_cents / 100,
    validUntil: ymd(r.valid_until),
    createdAt: new Date(r.created_at).toISOString(),
  };
}

export interface QuoteItem {
  id: number;
  productId: number | null;
  name: string;
  unitPrice: number; // euros
  quantity: number;
  lineTotal: number; // euros
}
function toItem(r: QuoteItemRow): QuoteItem {
  return {
    id: r.id,
    productId: r.product_id,
    name: r.name,
    unitPrice: r.unit_price_cents / 100,
    quantity: r.quantity,
    lineTotal: r.line_total_cents / 100,
  };
}

export interface QuoteDetail {
  quote: Quote & { notes: string };
  items: QuoteItem[];
}

export interface QuotesPage {
  rows: Quote[];
  total: number;
  page: number;
  pageCount: number;
}

export async function quotesPageAction(opts: {
  q?: string;
  status?: string;
  sortKey: string;
  sortDir: 1 | -1;
  page: number;
  pageSize: number;
}): Promise<QuotesPage> {
  const { organizationId } = await requireSession();
  const res = await listQuotesPage(organizationId, {
    q: opts.q?.trim() || undefined,
    status: opts.status || undefined,
    sortKey: opts.sortKey,
    sortDir: opts.sortDir,
    page: opts.page,
    pageSize: opts.pageSize,
  });
  return { rows: res.rows.map(toQuote), total: res.total, page: res.page, pageCount: res.pageCount };
}

export async function createQuoteAction(companyId: number, opts: { notes?: string; validUntil?: string | null } = {}): Promise<{ id?: number; error?: string }> {
  const g = await guardWrite();
  if ("error" in g) return { error: g.error };
  const { organizationId } = g.session;
  if (!(await getCompany(organizationId, companyId))) return { error: "Company not found." };
  const id = await createQuote(organizationId, companyId, opts);
  revalidatePath("/quotes");
  return { id };
}

export async function duplicateQuoteAction(id: number): Promise<{ id?: number; error?: string }> {
  const g = await guardWrite();
  if ("error" in g) return { error: g.error };
  const { organizationId } = g.session;
  const newId = await duplicateQuote(organizationId, id);
  if (!newId) return { error: "Quote not found." };
  revalidatePath("/quotes");
  return { id: newId };
}

export async function getQuoteAction(id: number): Promise<QuoteDetail | null> {
  const { organizationId } = await requireSession();
  const res = await getQuote(organizationId, id);
  if (!res) return null;
  return { quote: { ...toQuote(res.quote), notes: res.quote.notes }, items: res.items.map(toItem) };
}

export async function updateQuoteStatusAction(id: number, status: string): Promise<{ error?: string }> {
  const g = await guardWrite();
  if ("error" in g) return { error: g.error };
  const { organizationId } = g.session;
  if (!isQuoteStatus(status)) return { error: "Unknown status." };
  // State machine: a quote that has left draft can't be reverted to draft —
  // otherwise the "only draft quotes are editable" line-item lock is defeated by
  // reopening, editing prices, and re-sending. Duplicate it to make a new draft.
  if (status === "draft") {
    const cur = await getQuote(organizationId, id).catch(() => null);
    if (cur && cur.quote.status !== "draft") {
      return { error: "A quote that's been sent can't be reopened to draft — duplicate it instead." };
    }
  }
  await updateQuote(organizationId, id, { status });
  revalidatePath("/quotes");
  revalidatePath(`/quotes/${id}`);
  return {};
}

export async function updateQuoteAction(id: number, patch: { notes?: string; validUntil?: string | null }): Promise<{ error?: string }> {
  const g = await guardWrite();
  if ("error" in g) return { error: g.error };
  const { organizationId } = g.session;
  const check = validated(() => { vString("Notes", patch.notes, { max: 2000 }); return true; });
  if (!check.ok) return { error: check.error };
  await updateQuote(organizationId, id, patch);
  revalidatePath(`/quotes/${id}`);
  return {};
}

export async function deleteQuoteAction(id: number): Promise<{ error?: string }> {
  const g = await guardWrite();
  if ("error" in g) return { error: g.error };
  await deleteQuote(g.session.organizationId, id);
  revalidatePath("/quotes");
  return {};
}

export async function addQuoteItemAction(quoteId: number, item: { productId?: number | null; name: string; unitPrice: number; quantity: number }): Promise<{ error?: string }> {
  const g = await guardWrite();
  if ("error" in g) return { error: g.error };
  const { organizationId } = g.session;
  const v = validated(() => ({
    name: vString("Line name", item.name, { required: true, max: 200 }),
    quantity: vInt("Quantity", item.quantity, { min: 1, max: 100000 }) ?? 1,
  }));
  if (!v.ok) return { error: v.error };
  if (!Number.isFinite(Number(item.unitPrice)) || Number(item.unitPrice) < 0) return { error: "Unit price must be a positive number." };
  const q = await getQuote(organizationId, quoteId);
  if (!q) return { error: "Quote not found." };
  if (q.quote.status !== "draft") return { error: "Only draft quotes can be edited." };
  await addQuoteItem(organizationId, quoteId, {
    productId: item.productId ?? null,
    name: v.value.name,
    unitPriceCents: Math.round(Number(item.unitPrice) * 100),
    quantity: v.value.quantity,
  });
  revalidatePath(`/quotes/${quoteId}`);
  revalidatePath("/quotes");
  return {};
}

export async function setQuoteItemQuantityAction(quoteId: number, itemId: number, quantity: number): Promise<{ error?: string }> {
  const g = await guardWrite();
  if ("error" in g) return { error: g.error };
  const { organizationId } = g.session;
  const q = await getQuote(organizationId, quoteId);
  if (!q) return { error: "Quote not found." };
  if (q.quote.status !== "draft") return { error: "Only draft quotes can be edited." };
  await setQuoteItemQuantity(organizationId, quoteId, itemId, quantity);
  revalidatePath(`/quotes/${quoteId}`);
  return {};
}

export async function deleteQuoteItemAction(quoteId: number, itemId: number): Promise<{ error?: string }> {
  const g = await guardWrite();
  if ("error" in g) return { error: g.error };
  const { organizationId } = g.session;
  const q = await getQuote(organizationId, quoteId);
  if (!q) return { error: "Quote not found." };
  if (q.quote.status !== "draft") return { error: "Only draft quotes can be edited." };
  await deleteQuoteItem(organizationId, quoteId, itemId);
  revalidatePath(`/quotes/${quoteId}`);
  return {};
}

export interface ProductHit {
  id: number;
  name: string;
  sku: string;
  price: number; // euros
}
export async function searchProductsAction(q: string): Promise<ProductHit[]> {
  const { organizationId } = await requireSession();
  const s = q.trim();
  if (!s) return [];
  const rows = await searchProducts(organizationId, s);
  return rows.map((r: ProductRow) => ({ id: r.id, name: r.name, sku: r.sku, price: r.price_cents / 100 }));
}
