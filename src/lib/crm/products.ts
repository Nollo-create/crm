// Products domain — pure billing options + the server-side sort allowlist.
// Prices are stored as integer cents in the DB; the action layer exposes them
// as euro numbers. `p` = crm_products.

export type Billing = "onetime" | "monthly" | "yearly";
export const BILLINGS: Billing[] = ["onetime", "monthly", "yearly"];
export const BILLING_LABEL: Record<Billing, string> = { onetime: "One-time", monthly: "Monthly", yearly: "Yearly" };
export const BILLING_SUFFIX: Record<Billing, string> = { onetime: "", monthly: "/mo", yearly: "/yr" };
export function isBilling(v: string): v is Billing {
  return (BILLINGS as string[]).includes(v);
}

export type ProductSortKey = "name" | "sku" | "price" | "created";
const SORT_EXPR: Record<ProductSortKey, string> = {
  name: "p.name",
  sku: "p.sku",
  price: "p.price_cents",
  created: "p.id",
};
const KEYS = new Set(Object.keys(SORT_EXPR));

export function isProductSortKey(v: string): v is ProductSortKey {
  return KEYS.has(v);
}

export function buildProductOrderBy(key: string, dir: 1 | -1): string {
  const expr = isProductSortKey(key) ? SORT_EXPR[key] : SORT_EXPR.name;
  return `ORDER BY ${expr} ${dir === 1 ? "ASC" : "DESC"}, p.id DESC`;
}
