import type { CompanySortKey } from "./views";

// Server-side sorting for the Companies table. The sort key is an allowlisted
// column expression — it is NEVER interpolated as a raw string, so ORDER BY
// can't be injected. Two columns aren't plain fields:
//   - `score`  -> c.lead_score, a denormalised column db.ts keeps in sync from
//                 the single-source leadScore() on every write (no drift).
//   - `health` -> health_rank, a CASE expression the query builds that mirrors
//                 the health() heuristic in companies/page.tsx (kept in sync
//                 there — 4 buckets from last activity age + open pipeline).

const SORT_EXPR: Record<CompanySortKey, string> = {
  name: "c.name",
  industry: "c.industry",
  contacts: "contacts",
  openValue: "open_value",
  score: "c.lead_score",
  health: "health_rank",
  lastActivity: "last_activity",
};

const KEYS = new Set(Object.keys(SORT_EXPR));

export function isCompanySortKey(v: string): v is CompanySortKey {
  return KEYS.has(v);
}

/** A safe `ORDER BY` clause from an untrusted key + direction, with a stable id
 *  tiebreaker so paging never repeats or skips a row. Unknown key -> default. */
export function buildCompanyOrderBy(key: string, dir: 1 | -1): string {
  const expr = isCompanySortKey(key) ? SORT_EXPR[key] : SORT_EXPR.score;
  const direction = dir === 1 ? "ASC" : "DESC";
  return `ORDER BY ${expr} ${direction}, c.id DESC`;
}

export interface PageBounds {
  page: number;
  pageSize: number;
  offset: number;
  pageCount: number;
}

/** Normalise a requested page against the known total. pageSize is clamped to
 *  1..100; page is clamped into [1, pageCount]. */
export function pageBounds(page: number, pageSize: number, total: number): PageBounds {
  const size = Math.min(100, Math.max(1, Math.floor(pageSize) || 25));
  const pageCount = Math.max(1, Math.ceil(total / size));
  const p = Math.min(Math.max(1, Math.floor(page) || 1), pageCount);
  return { page: p, pageSize: size, offset: (p - 1) * size, pageCount };
}
