"use server";

import { revalidatePath } from "next/cache";
import {
  createQuote,
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
import { requireSession } from "@/lib/auth/session";
import { isQuoteStatus, quoteNumber } from "@/lib/crm/quotes";

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
  const { organizationId } = await requireSession();
  if (!(await getCompany(organizationId, companyId))) return { error: "Company not found." };
  const id = await createQuote(organizationId, companyId, opts);
  revalidatePath("/quotes");
  return { id };
}

export async function getQuoteAction(id: number): Promise<QuoteDetail | null> {
  const { organizationId } = await requireSession();
  const res = await getQuote(organizationId, id);
  if (!res) return null;
  return { quote: { ...toQuote(res.quote), notes: res.quote.notes }, items: res.items.map(toItem) };
}

export async function updateQuoteStatusAction(id: number, status: string): Promise<{ error?: string }> {
  const { organizationId } = await requireSession();
  if (!isQuoteStatus(status)) return { error: "Unknown status." };
  await updateQuote(organizationId, id, { status });
  revalidatePath("/quotes");
  revalidatePath(`/quotes/${id}`);
  return {};
}

export async function updateQuoteAction(id: number, patch: { notes?: string; validUntil?: string | null }): Promise<{ error?: string }> {
  const { organizationId } = await requireSession();
  await updateQuote(organizationId, id, patch);
  revalidatePath(`/quotes/${id}`);
  return {};
}

export async function deleteQuoteAction(id: number): Promise<void> {
  const { organizationId } = await requireSession();
  await deleteQuote(organizationId, id);
  revalidatePath("/quotes");
}

export async function addQuoteItemAction(quoteId: number, item: { productId?: number | null; name: string; unitPrice: number; quantity: number }): Promise<{ error?: string }> {
  const { organizationId } = await requireSession();
  if (!item?.name?.trim()) return { error: "The line needs a name." };
  const q = await getQuote(organizationId, quoteId);
  if (!q) return { error: "Quote not found." };
  if (q.quote.status !== "draft") return { error: "Only draft quotes can be edited." };
  await addQuoteItem(organizationId, quoteId, {
    productId: item.productId ?? null,
    name: item.name.trim(),
    unitPriceCents: Math.round((Number(item.unitPrice) || 0) * 100),
    quantity: item.quantity,
  });
  revalidatePath(`/quotes/${quoteId}`);
  revalidatePath("/quotes");
  return {};
}

export async function setQuoteItemQuantityAction(quoteId: number, itemId: number, quantity: number): Promise<{ error?: string }> {
  const { organizationId } = await requireSession();
  const q = await getQuote(organizationId, quoteId);
  if (!q) return { error: "Quote not found." };
  if (q.quote.status !== "draft") return { error: "Only draft quotes can be edited." };
  await setQuoteItemQuantity(organizationId, quoteId, itemId, quantity);
  revalidatePath(`/quotes/${quoteId}`);
  return {};
}

export async function deleteQuoteItemAction(quoteId: number, itemId: number): Promise<{ error?: string }> {
  const { organizationId } = await requireSession();
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
