import "server-only";
import { type NextRequest } from "next/server";
import { extractBearer, isApiKeyFormat, hashKey } from "@/lib/crm/api-keys";
import { findEnabledApiKeyByHash, touchApiKey } from "@/lib/db";

// Authenticate a public API request from its bearer key. The org is derived from
// the key itself, so every downstream query is org-scoped by construction — a key
// can only ever read its own tenant's data. Failure is always a plain null (the
// route turns it into a 401); we never leak why.

export interface ApiAuth {
  organizationId: number;
  keyId: number;
}

export async function authenticateApiKey(req: NextRequest): Promise<ApiAuth | null> {
  const raw = extractBearer(req.headers.get("authorization"), req.headers.get("x-api-key"));
  if (!isApiKeyFormat(raw)) return null;
  const found = await findEnabledApiKeyByHash(hashKey(raw)).catch(() => null);
  if (!found) return null;
  void touchApiKey(found.id); // best-effort usage stamp, never blocks
  return { organizationId: found.organizationId, keyId: found.id };
}
