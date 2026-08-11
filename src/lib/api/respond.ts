import { NextResponse } from "next/server";

// Shared response helpers for the public /api/v1 surface. Everything is no-store:
// these are per-key live reads, never cacheable.

const NO_STORE = { "cache-control": "no-store" };

export function apiJson(data: unknown, status = 200): NextResponse {
  return NextResponse.json(data, { status, headers: NO_STORE });
}

export function apiError(status: number, message: string): NextResponse {
  return NextResponse.json({ error: message }, { status, headers: NO_STORE });
}

export const unauthorized = () => apiError(401, "Invalid or missing API key.");

export interface Paging {
  page: number;
  pageSize: number;
  q: string;
  sortKey: string;
  sortDir: 1 | -1;
}

/** Parse pagination/sort/search from the query string. pageSize hard-capped at
 *  100; the sort key is passed through to the module's allowlist builder (unknown
 *  keys fall back to that module's default). */
export function parsePaging(sp: URLSearchParams): Paging {
  const page = Math.max(1, parseInt(sp.get("page") || "1", 10) || 1);
  const pageSize = Math.min(100, Math.max(1, parseInt(sp.get("limit") || "25", 10) || 25));
  const q = (sp.get("q") || "").slice(0, 120);
  const sortKey = (sp.get("sort") || "").slice(0, 40);
  const sortDir: 1 | -1 = (sp.get("dir") || "desc").toLowerCase() === "asc" ? 1 : -1;
  return { page, pageSize, q, sortKey, sortDir };
}
