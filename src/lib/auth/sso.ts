import "server-only";
import { verifyHS256 } from "./jwt";
import { integration, isConnected } from "@/lib/config";

// Validate the webapp's SSO handoff code. The code is an HS256 JWT the webapp
// signed with the shared INTERNAL_API_SECRET; we verify it with the same secret.
// It only asserts identity — the caller still has to match it to an existing,
// active CRM user (match-existing-only policy) and check the CSRF `state`.

export function verifySsoCode(code: string): { email: string; name: string } | null {
  if (!isConnected(integration) || !code) return null;
  const payload = verifyHS256(code, integration.secret);
  if (!payload || payload.use !== "crm-sso") return null;
  // Require a bounded lifetime: reject a handoff code with no `exp`, or one
  // whose window is implausibly long (a captured code must not be replayable
  // indefinitely). verifyHS256 already rejects an expired code.
  if (typeof payload.exp !== "number") return null;
  const iat = typeof payload.iat === "number" ? payload.iat : payload.exp - 300;
  if (payload.exp - iat > 600) return null; // max 10-minute handoff window
  const email = String(payload.email ?? "").toLowerCase().trim();
  const name = String(payload.name ?? "");
  if (!email) return null;
  return { email, name };
}
