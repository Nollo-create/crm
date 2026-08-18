import { getOrgFlags, getUserTotp } from "@/lib/db";
import { can } from "@/lib/auth/rbac";
import type { SessionUser } from "@/lib/auth/session";

// Admin-enforced MFA (master-prompt #4). An owner can require that every
// privileged user (admin and owner) has two-factor on. Enforced server-side in
// every org-management mutation — not just hinted in the UI. Off by default, so
// existing orgs are unaffected until an owner turns it on.

/** Returns a user-facing error string if this session is a privileged user who
 *  must enable MFA before managing the org, else null. Members and viewers are
 *  exempt (they don't manage the org). Enrolling MFA is a self-account action,
 *  never gated by this, so a blocked admin can always comply. */
export async function enforceAdminMfa(session: SessionUser): Promise<string | null> {
  if (!can(session.role, "member:manage")) return null; // members/viewers exempt
  const flags = await getOrgFlags(session.organizationId).catch(() => null);
  if (!flags?.requireAdminMfa) return null; // policy off
  const totp = await getUserTotp(session.userId).catch(() => null);
  if (totp?.enabled) return null;
  return "Two-factor authentication is required to manage this organization. Turn it on in Account Security first.";
}
