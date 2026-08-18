"use server";

import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth/session";
import { can } from "@/lib/auth/rbac";
import { getOrgFlags, setOrgFlag, getUserTotp } from "@/lib/db";
import { recordAudit } from "@/lib/auth/audit";
import { verifyStepUp, stepUpKind, type StepUpKind } from "@/lib/auth/step-up";

// Owner-only organization security policies. Both are enforced server-side in
// every relevant path — these actions only flip the flag. Changing a policy is
// itself a step-up action (re-verify the owner at the moment of the change).
//
// #7 restrict_member_visibility: a member only sees leads/deals they own or that
//    are unassigned.
// #4 require_admin_mfa: every admin/owner must have two-factor on to manage the
//    org.

export interface PolicyStatus {
  canManage: boolean;
  restrictMembers: boolean;
  requireAdminMfa: boolean;
  /** Whether the acting owner has MFA — the toggle warns if enabling would need it. */
  selfHasMfa: boolean;
  /** What credential step-up will ask for. */
  stepUp: StepUpKind;
}

export async function getPolicyStatusAction(): Promise<PolicyStatus> {
  const { organizationId, role, userId } = await requireSession();
  if (!can(role, "org:manage")) {
    return { canManage: false, restrictMembers: false, requireAdminMfa: false, selfHasMfa: false, stepUp: "password" };
  }
  const [flags, totp, kind] = await Promise.all([
    getOrgFlags(organizationId).catch(() => null),
    getUserTotp(userId).catch(() => null),
    stepUpKind(userId),
  ]);
  return {
    canManage: true,
    restrictMembers: !!flags?.restrictMembers,
    requireAdminMfa: !!flags?.requireAdminMfa,
    selfHasMfa: !!totp?.enabled,
    stepUp: kind,
  };
}

export async function setRestrictMembersAction(on: boolean, credential: string): Promise<{ error?: string }> {
  const session = await requireSession();
  if (!can(session.role, "org:manage")) return { error: "Only an owner can change this." };
  const stepErr = await verifyStepUp(session.userId, credential);
  if (stepErr) return { error: stepErr };
  await setOrgFlag(session.organizationId, "restrict_members", on);
  await recordAudit(session, `restrict_members_${on ? "on" : "off"}`, "organization", session.organizationId);
  revalidatePath("/settings/roles");
  return {};
}

export async function setRequireAdminMfaAction(on: boolean, credential: string): Promise<{ error?: string }> {
  const session = await requireSession();
  if (!can(session.role, "org:manage")) return { error: "Only an owner can change this." };
  // Anti-lockout: you can't require MFA of admins while you yourself don't have
  // it — you'd immediately lock yourself out of org management.
  if (on) {
    const totp = await getUserTotp(session.userId).catch(() => null);
    if (!totp?.enabled) return { error: "Turn on two-factor for your own account before requiring it for admins." };
  }
  const stepErr = await verifyStepUp(session.userId, credential);
  if (stepErr) return { error: stepErr };
  await setOrgFlag(session.organizationId, "require_admin_mfa", on);
  await recordAudit(session, `require_admin_mfa_${on ? "on" : "off"}`, "organization", session.organizationId);
  revalidatePath("/settings/roles");
  return {};
}
