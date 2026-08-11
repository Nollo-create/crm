"use server";

import { revalidatePath } from "next/cache";
import { listApiKeys, createApiKey, setApiKeyEnabled, deleteApiKey } from "@/lib/db";
import { requireSession } from "@/lib/auth/session";
import { can } from "@/lib/auth/rbac";
import { recordAudit } from "@/lib/auth/audit";
import { generateApiKey, maskKey } from "@/lib/crm/api-keys";

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
    })),
  };
}

/** Create a key and return its plaintext ONCE. After this it can never be shown
 *  again (we store only the hash). */
export async function createApiKeyAction(name: string): Promise<{ plain?: string; error?: string }> {
  const session = await requireSession();
  if (!can(session.role, "org:manage")) return { error: "Only an owner can create API keys." };
  const label = (name || "").trim().slice(0, 120) || "API key";
  const existing = await listApiKeys(session.organizationId).catch(() => []);
  if (existing.length >= MAX_KEYS) return { error: `You can have at most ${MAX_KEYS} keys. Revoke one first.` };
  const key = generateApiKey();
  await createApiKey(session.organizationId, { name: label, keyHash: key.hash, last4: key.last4, createdByEmail: session.email });
  await recordAudit(session, "apikey_create", "api_key", null, `created "${label}"`);
  revalidatePath("/settings/api");
  return { plain: key.plain };
}

export async function toggleApiKeyAction(id: number, enabled: boolean): Promise<{ error?: string }> {
  const session = await requireSession();
  if (!can(session.role, "org:manage")) return { error: "Only an owner can change API keys." };
  await setApiKeyEnabled(session.organizationId, id, enabled);
  await recordAudit(session, enabled ? "apikey_enable" : "apikey_disable", "api_key", id);
  revalidatePath("/settings/api");
  return {};
}

export async function deleteApiKeyAction(id: number): Promise<{ error?: string }> {
  const session = await requireSession();
  if (!can(session.role, "org:manage")) return { error: "Only an owner can revoke API keys." };
  await deleteApiKey(session.organizationId, id);
  await recordAudit(session, "apikey_revoke", "api_key", id);
  revalidatePath("/settings/api");
  return {};
}
