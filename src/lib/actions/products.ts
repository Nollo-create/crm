"use server";

import { revalidatePath } from "next/cache";
import { createProduct, updateProduct, setProductActive, deleteProduct, duplicateProduct, listProductsPage, type ProductStatsRow } from "@/lib/db";
import { requireSession } from "@/lib/auth/session";
import { isBilling } from "@/lib/crm/products";

export interface Product {
  id: number;
  name: string;
  sku: string;
  description: string;
  price: number; // euros
  billing: string;
  active: boolean;
  quoteUses: number;
  createdAt: string;
}

function toProduct(r: ProductStatsRow): Product {
  return {
    id: r.id,
    name: r.name,
    sku: r.sku,
    description: r.description,
    price: r.price_cents / 100,
    billing: r.billing,
    active: !!r.active,
    quoteUses: Number(r.quote_uses) || 0,
    createdAt: new Date(r.created_at).toISOString(),
  };
}

export interface ProductsPage {
  rows: Product[];
  total: number;
  page: number;
  pageCount: number;
}

export async function productsPageAction(opts: {
  q?: string;
  active?: boolean;
  billing?: string;
  sortKey: string;
  sortDir: 1 | -1;
  page: number;
  pageSize: number;
}): Promise<ProductsPage> {
  const { organizationId } = await requireSession();
  const res = await listProductsPage(organizationId, {
    q: opts.q?.trim() || undefined,
    active: opts.active,
    billing: opts.billing || undefined,
    sortKey: opts.sortKey,
    sortDir: opts.sortDir,
    page: opts.page,
    pageSize: opts.pageSize,
  });
  return { rows: res.rows.map(toProduct), total: res.total, page: res.page, pageCount: res.pageCount };
}

export interface ProductDTO {
  name: string;
  sku?: string;
  description?: string;
  price?: number; // euros
  billing?: string;
  active?: boolean;
}

const toInput = (p: ProductDTO) => ({
  name: (p.name ?? "").trim(),
  sku: p.sku,
  description: p.description,
  priceCents: Math.round((Number(p.price) || 0) * 100),
  billing: p.billing && isBilling(p.billing) ? p.billing : "onetime",
  active: p.active,
});

export async function createProductAction(input: ProductDTO): Promise<{ id?: number; error?: string }> {
  const { organizationId } = await requireSession();
  if (!input?.name?.trim()) return { error: "The product needs a name." };
  const id = await createProduct(organizationId, toInput(input));
  revalidatePath("/products");
  return { id };
}

export async function updateProductAction(id: number, input: ProductDTO): Promise<{ error?: string }> {
  const { organizationId } = await requireSession();
  if (!input?.name?.trim()) return { error: "The product needs a name." };
  await updateProduct(organizationId, id, toInput(input));
  revalidatePath("/products");
  return {};
}

export async function setProductActiveAction(id: number, active: boolean): Promise<{ error?: string }> {
  const { organizationId } = await requireSession();
  await setProductActive(organizationId, id, active);
  revalidatePath("/products");
  return {};
}

export async function deleteProductAction(id: number): Promise<void> {
  const { organizationId } = await requireSession();
  await deleteProduct(organizationId, id);
  revalidatePath("/products");
}

export async function duplicateProductAction(id: number): Promise<{ id?: number; error?: string }> {
  const { organizationId } = await requireSession();
  const newId = await duplicateProduct(organizationId, id);
  if (!newId) return { error: "Product not found." };
  revalidatePath("/products");
  return { id: newId };
}
