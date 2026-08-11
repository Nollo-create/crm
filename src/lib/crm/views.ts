// Saved views for the Companies list — a named status + sort combination the
// user can flip between. Pure and storage-agnostic: the page owns localStorage
// I/O, this module defines the shape, the built-in views, matching, and safe
// (de)serialisation so malformed stored data can never crash the list. When
// auth + multi-tenant land (Etapa 2) these move to per-user rows unchanged.

export type CompanySortKey =
  | "name" | "industry" | "contacts" | "openValue" | "score" | "health" | "lastActivity";

export const COMPANY_SORT_KEYS: CompanySortKey[] = [
  "name", "industry", "contacts", "openValue", "score", "health", "lastActivity",
];

export interface CompanyView {
  id: string;
  name: string;
  status: string; // "" = all statuses
  sortKey: CompanySortKey;
  sortDir: 1 | -1;
}

/** The list state a view captures. Search text is intentionally transient and
 *  not part of a view. */
export interface ViewState {
  status: string;
  sortKey: CompanySortKey;
  sortDir: 1 | -1;
}

/** Always-present, non-deletable starting points. */
export const BUILTIN_VIEWS: CompanyView[] = [
  { id: "all", name: "All companies", status: "", sortKey: "score", sortDir: -1 },
  { id: "leads", name: "Leads", status: "lead", sortKey: "score", sortDir: -1 },
  { id: "at-risk", name: "At risk", status: "at_risk", sortKey: "lastActivity", sortDir: 1 },
  { id: "top-pipeline", name: "Top pipeline", status: "", sortKey: "openValue", sortDir: -1 },
];

export function viewMatches(v: CompanyView, s: ViewState): boolean {
  return v.status === s.status && v.sortKey === s.sortKey && v.sortDir === s.sortDir;
}

/** The active view id for the current state, or null when it's a custom
 *  (unsaved) combination. Order matters: pass built-ins before saved views. */
export function activeViewId(views: CompanyView[], s: ViewState): string | null {
  return views.find((v) => viewMatches(v, s))?.id ?? null;
}

export function makeView(id: string, name: string, s: ViewState): CompanyView {
  return { id, name: name.trim(), status: s.status, sortKey: s.sortKey, sortDir: s.sortDir };
}

/** Validate whatever came out of localStorage into clean user views. */
export function normalizeViews(raw: unknown): CompanyView[] {
  if (!Array.isArray(raw)) return [];
  const out: CompanyView[] = [];
  for (const r of raw) {
    if (!r || typeof r !== "object") continue;
    const o = r as Record<string, unknown>;
    if (
      typeof o.id === "string" &&
      typeof o.name === "string" &&
      o.name.trim() !== "" &&
      typeof o.status === "string" &&
      typeof o.sortKey === "string" &&
      COMPANY_SORT_KEYS.includes(o.sortKey as CompanySortKey) &&
      (o.sortDir === 1 || o.sortDir === -1)
    ) {
      out.push({ id: o.id, name: o.name.trim(), status: o.status, sortKey: o.sortKey as CompanySortKey, sortDir: o.sortDir });
    }
  }
  return out;
}
