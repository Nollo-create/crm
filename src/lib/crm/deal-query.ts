import { STAGE_IDS } from "./pipeline";

// Server-side sorting for the Deals list. Allowlisted column expressions (the
// sort key is never interpolated raw). `d` = crm_deals, `co` = joined company.
// "stage" sorts in real pipeline order via FIELD() built from the canonical
// STAGE_IDS (trusted constants — no drift, no injection).

export type DealSortKey = "title" | "company" | "value" | "stage" | "expectedClose" | "created";

const STAGE_FIELD = `FIELD(d.stage, ${STAGE_IDS.map((s) => `'${s}'`).join(", ")})`;

const SORT_EXPR: Record<DealSortKey, string> = {
  title: "d.title",
  company: "co.name",
  value: "d.value",
  stage: STAGE_FIELD,
  expectedClose: "d.expected_close",
  created: "d.id",
};

const KEYS = new Set(Object.keys(SORT_EXPR));

export function isDealSortKey(v: string): v is DealSortKey {
  return KEYS.has(v);
}

export function buildDealOrderBy(key: string, dir: 1 | -1): string {
  const expr = isDealSortKey(key) ? SORT_EXPR[key] : SORT_EXPR.value;
  return `ORDER BY ${expr} ${dir === 1 ? "ASC" : "DESC"}, d.id DESC`;
}
