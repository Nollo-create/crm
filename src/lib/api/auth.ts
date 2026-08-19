import "server-only";
import { NextResponse, type NextRequest } from "next/server";
import { extractBearer, isApiKeyFormat, hashKey, normalizeScopes, hasScope, type ApiScope } from "@/lib/crm/api-keys";
import { findEnabledApiKeyByHash, touchApiKey, getOrgFlags } from "@/lib/db";
import { checkRateLimit } from "@/lib/rate-limit";
import { clientIpFromHeaders } from "@/lib/net/client-ip";
import { apiError, unauthorized } from "./respond";

// Authenticate a public API request from its bearer key. The org is derived from
// the key itself, so every downstream query is org-scoped by construction — a key
// can only ever read its own tenant's data. Failure is always a plain null (the
// route turns it into a 401); we never leak why. Expired/disabled keys don't
// authenticate (the DB lookup filters them).

export interface ApiAuth {
  organizationId: number;
  keyId: number;
  scopes: ApiScope[];
}

export async function authenticateApiKey(req: NextRequest): Promise<ApiAuth | null> {
  const raw = extractBearer(req.headers.get("authorization"), req.headers.get("x-api-key"));
  if (!isApiKeyFormat(raw)) return null;
  const found = await findEnabledApiKeyByHash(hashKey(raw)).catch(() => null);
  if (!found) return null;
  // Emergency freeze: an owner can cut off all API access for the org at once.
  const flags = await getOrgFlags(found.organizationId).catch(() => null);
  if (flags?.apiFrozen) return null;
  void touchApiKey(found.id); // best-effort usage stamp, never blocks
  return { organizationId: found.organizationId, keyId: found.id, scopes: normalizeScopes(found.scopes) };
}

/** Guard a resource route against the key's scopes. Returns a 403 to return
 *  as-is, or null when the key is allowed. */
export function requireScope(auth: ApiAuth, scope: ApiScope): NextResponse | null {
  return hasScope(auth.scopes, scope) ? null : apiError(403, `This key isn't scoped for "${scope}".`);
}

function apiClientIp(req: NextRequest): string {
  return clientIpFromHeaders(req.headers);
}

function tooManyRequests(retryAfter: number): NextResponse {
  return NextResponse.json(
    { error: "Too many requests." },
    { status: 429, headers: { "cache-control": "no-store", "retry-after": String(Math.max(1, retryAfter)) } }
  );
}

/**
 * The one prologue every /api/v1 route runs: authenticate + rate-limit. Returns
 * the ApiAuth on success, or a NextResponse (401 / 429) to return as-is.
 *  - Bad/missing keys are throttled per IP (anti key-guessing).
 *  - A valid key is throttled per key (abuse / runaway client).
 */
export async function apiGuard(req: NextRequest): Promise<ApiAuth | NextResponse> {
  const auth = await authenticateApiKey(req);
  if (!auth) {
    const rl = checkRateLimit(`api:bad:${apiClientIp(req)}`, { limit: 20, windowMs: 10 * 60_000, blockMs: 30 * 60_000 });
    return rl.ok ? unauthorized() : tooManyRequests(rl.retryAfter);
  }
  const rl = checkRateLimit(`api:key:${auth.keyId}`, { limit: 120, windowMs: 60_000, blockMs: 60_000 });
  if (!rl.ok) return tooManyRequests(rl.retryAfter);
  return auth;
}
