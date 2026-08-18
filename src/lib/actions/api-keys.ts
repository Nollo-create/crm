"use server";

import { revalidatePath } from "next/cache";
import { listApiKeys, createApiKey, setApiKeyEnabled, deleteApiKey, getUserById } from "@/lib/db";
import { requireSession } from "@/lib/auth/session";
import { can } from "@/lib/auth/rbac";
import { verifyPassword } from "@/lib/auth/password";
import { enforceAdminMfa } from "@/lib/auth/mfa-policy";
import { recordAudit } from "@/lib/auth/audit";
import { recordSecurityAlert } from "@/lib/security/alerts";
import { checkRateLimit, retryMessage } from "@/lib/rate-limit";
import { generateApiKey, maskKey, normalizeScopes, scopesToString, expiryFromDays, API_SCOPES, type ApiScope } from "@/lib/crm/api-keys";

const MAX_KEYS = 20;

export interface ApiKeyView {
  id: number;
  name: string;
  masked: string;
  enabled: boolean;
  lastUsedAt: string | null;
  requestCount: number;
  createdBy: string;
  createdAt: string;
  expiresAt: string | null;
  expired: boolean;
  scopes: ApiScope[];
}

export interface ApiKeysData {
  keys: ApiKeyView[];
  canManage: boolean;
}

export async function listApiKeysAction(): Promise<ApiKeysData> {
  const session = await requireSession();
  const rows = await listApiKeys(session.organizationId).catch(() => []);
  return {
    canManage: can(session.role, "org:manage"),
    keys: rows.map((r) => ({
      id: r.id,
      name: r.name,
      masked: maskKey(r.last4),
      enabled: !!r.enabled,
      lastUsedAt: r.last_used_at ? new Date(r.last_used_at).toISOString() : null,
      requestCount: r.request_count,
      createdBy: r.created_by_email,
      createdAt: new Date(r.created_at).toISOString(),
      expiresAt: r.expires_at ? new Date(r.expires_at).toISOString() : null,
      expired: !!r.expires_at && new Date(r.expires_at).getTime() < Date.now(),
      scopes: normalizeScopes(r.scopes),
    })),
  };
}

/** Create a key and return its plaintext ONCE. After this it can never be shown
 *  again (we store only the hash). */
export async function createApiKeyAction(
  name: string,
  password: string,
  opts: { expiresInDays?: number | null; scopes?: string[] } = {}
): Promise<{ plain?: string; error?: string }> {
  const session = await requireSession();
  if (!can(session.role, "org:manage")) return { error: "Only an owner can create API keys." };
  const mfaErr = await enforceAdminMfa(session);
  if (mfaErr) return { error: mfaErr };
  // Step-up: a new key grants standing programmatic access, so re-verify the
  // password (a hijacked session alone can't mint one).
  const rl = checkRateLimit(`apikey-create:${session.userId}`, { limit: 8, windowMs: 10 * 60_000, blockMs: 15 * 60_000 });
  if (!rl.ok) return { error: retryMessage(rl.retryAfter) };
  const user = await getUserById(session.userId).catch(() => null);
  if (!user || !(await verifyPassword(password || "", user.password_hash))) return { error: "Enter your password to create a key." };
  const label = (name || "").trim().slice(0, 120) || "API key";
  const existing = await listApiKeys(session.organizationId).catch(() => []);
  if (existing.length >= MAX_KEYS) return { error: `You can have at most ${MAX_KEYS} keys. Revoke one first.` };
  // Omitted scopes → all (back-compat for API callers); an explicitly empty or
  // all-invalid selection is rejected rather than silently granting everything.
  const scopeList = opts.scopes === undefined ? [...API_SCOPES] : normalizeScopes(opts.scopes);
  if (scopeList.length === 0) return { error: "Choose at least one scope for the key." };
  const scopes = scopesToString(scopeList);
  const expiresAt = expiryFromDays(opts.expiresInDays ?? null);
  const key = generateApiKey();
  await createApiKey(session.organizationId, { name: label, keyHash: key.hash, last4: key.last4, createdByEmail: session.email, expiresAt, scopes });
  await recordAudit(session, "apikey_create", "api_key", null, `created "${label}" (${scopes}${expiresAt ? `, expires ${expiresAt.toISOString().slice(0, 10)}` : ""})`);
  await recordSecurityAlert(session.organizationId, { type: "apikey_created", severity: "medium", message: `A new API key "${label}" was created`, actorEmail: session.email, meta: scopes });
  revalidatePath("/settings/api");
  return { plain: key.plain };
}

export async function toggleApiKeyAction(id: number, enabled: boolean): Promise<{ error?: string }> {
  const session = await requireSession();
  if (!can(session.role, "org:manage")) return { error: "Only an owner can change API keys." };
  const mfaErr = await enforceAdminMfa(session);
  if (mfaErr) return { error: mfaErr };
  await setApiKeyEnabled(session.organizationId, id, enabled);
  await recordAudit(session, enabled ? "apikey_enable" : "apikey_disable", "api_key", id);
  revalidatePath("/settings/api");
  return {};
}

export async function deleteApiKeyAction(id: number): Promise<{ error?: string }> {
  const session = await requireSession();
  if (!can(session.role, "org:manage")) return { error: "Only an owner can revoke API keys." };
  const mfaErr = await enforceAdminMfa(session);
  if (mfaErr) return { error: mfaErr };
  await deleteApiKey(session.organizationId, id);
  await recordAudit(session, "apikey_revoke", "api_key", id);
  revalidatePath("/settings/api");
  return {};
}
