import { createHash, randomBytes } from "crypto";

// API key primitives. Mirrors the WordPress connector's trusted pattern: the key
// is shown to the user exactly once at creation; we persist only its SHA-256 and
// compare with a timing-safe check. A stored hash can't be reversed into a usable
// key, so a DB leak never yields live credentials. Read-only, org-scoped keys.

export const API_KEY_PREFIX = "crmk_";

/** SHA-256 hex of the plaintext key (deterministic — the storable fingerprint). */
export function hashKey(plain: string): string {
  return createHash("sha256").update(plain).digest("hex");
}

export interface GeneratedKey {
  plain: string;
  hash: string;
  last4: string;
}

/** Mint a new key: 24 random bytes, url-safe, prefixed. Returns the plaintext
 *  (shown once), its hash (stored) and last 4 chars (stored for display). */
export function generateApiKey(): GeneratedKey {
  const plain = API_KEY_PREFIX + randomBytes(24).toString("base64url");
  return { plain, hash: hashKey(plain), last4: plain.slice(-4) };
}

/** Cheap shape check before hashing an incoming credential. */
export function isApiKeyFormat(v: unknown): v is string {
  return typeof v === "string" && v.startsWith(API_KEY_PREFIX) && v.length >= API_KEY_PREFIX.length + 20;
}

/** Display form — we never store or re-show the plaintext, only `crmk_••••ab12`. */
export function maskKey(last4: string): string {
  return `${API_KEY_PREFIX}••••${last4}`;
}

/** Pull the bearer token from an Authorization header or x-api-key. Pure so it's
 *  testable without a request object. */
export function extractBearer(headerValue: string | null, apiKeyHeader?: string | null): string | null {
  if (apiKeyHeader && apiKeyHeader.trim()) return apiKeyHeader.trim();
  if (!headerValue) return null;
  const m = /^Bearer\s+(.+)$/i.exec(headerValue.trim());
  return m ? m[1].trim() : null;
}

// ---- Scopes: a key can be limited to a subset of the read-only resources ----

export const API_SCOPES = ["companies", "contacts", "deals"] as const;
export type ApiScope = (typeof API_SCOPES)[number];

/** Sanitize a scope list (array or comma string) to known values; an empty or
 *  all-invalid input falls back to every scope (back-compat for old keys). */
export function normalizeScopes(raw: unknown): ApiScope[] {
  const arr = Array.isArray(raw) ? raw : typeof raw === "string" ? raw.split(",") : [];
  const clean = arr.map((s) => String(s).trim()).filter((s): s is ApiScope => (API_SCOPES as readonly string[]).includes(s));
  return clean.length ? [...new Set(clean)] : [...API_SCOPES];
}
export const scopesToString = (scopes: ApiScope[]): string => normalizeScopes(scopes).join(",");
export const hasScope = (scopes: ApiScope[], needed: ApiScope): boolean => scopes.includes(needed);

// ---- Expiry ----

export const API_KEY_EXPIRY_DAYS = [30, 90, 365] as const;

/** A day count (or null/0 = never) → an expiry Date. `now` is injectable for
 *  tests. Capped at 10 years. */
export function expiryFromDays(days: number | null | undefined, now: number = Date.now()): Date | null {
  const d = Number(days);
  if (!Number.isFinite(d) || d <= 0) return null;
  return new Date(now + Math.min(3650, Math.floor(d)) * 86_400_000);
}
