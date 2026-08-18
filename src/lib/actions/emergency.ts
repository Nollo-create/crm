"use server";

import { revalidatePath } from "next/cache";
import { requireSession, getCurrentSessionId } from "@/lib/auth/session";
import { can } from "@/lib/auth/rbac";
import { getOrgFlags, setOrgFlag, revokeAllOrgSessionsExcept, countActiveOrgSessions } from "@/lib/db";
import { enforceAdminMfa } from "@/lib/auth/mfa-policy";
import { recordAudit } from "@/lib/auth/audit";

// Owner-only incident-response kill switches. Each is enforced server-side at its
// seam (API auth / AI actions / automation runner) — not just hidden in the UI.

export interface EmergencyStatus {
  canManage: boolean;
  apiFrozen: boolean;
  aiPaused: boolean;
  automationsPaused: boolean;
  activeSessions: number;
}

const FLAGS = new Set(["api", "ai", "automations"]);
const AUDIT_PREFIX: Record<string, string> = { api: "emergency_api", ai: "emergency_ai", automations: "emergency_automations" };

export async function emergencyStatusAction(): Promise<EmergencyStatus | null> {
  const { organizationId, role } = await requireSession();
  if (!can(role, "org:manage")) return null;
  const flags = await getOrgFlags(organizationId).catch(() => ({ apiFrozen: false, aiPaused: false, automationsPaused: false }));
  const activeSessions = await countActiveOrgSessions(organizationId).catch(() => 0);
  return { canManage: true, apiFrozen: flags.apiFrozen, aiPaused: flags.aiPaused, automationsPaused: flags.automationsPaused, activeSessions };
}

export async function setEmergencyFlagAction(flag: string, on: boolean): Promise<{ error?: string }> {
  const session = await requireSession();
  if (!can(session.role, "org:manage")) return { error: "Only an owner can change these." };
  const mfaErr = await enforceAdminMfa(session);
  if (mfaErr) return { error: mfaErr };
  if (!FLAGS.has(flag)) return { error: "Unknown control." };
  await setOrgFlag(session.organizationId, flag, on);
  await recordAudit(session, `${AUDIT_PREFIX[flag]}_${on ? "on" : "off"}`, "organization", session.organizationId);
  revalidatePath("/settings/emergency");
  return {};
}

/** Revoke every session in the org except the owner's current one. */
export async function forceLogoutOrgAction(): Promise<{ count: number; error?: string }> {
  const session = await requireSession();
  if (!can(session.role, "org:manage")) return { count: 0, error: "Only an owner can do this." };
  const mfaErr = await enforceAdminMfa(session);
  if (mfaErr) return { count: 0, error: mfaErr };
  const keep = (await getCurrentSessionId()) ?? 0;
  const count = await revokeAllOrgSessionsExcept(session.organizationId, keep);
  await recordAudit(session, "force_logout_all", "organization", session.organizationId, `${count} session${count === 1 ? "" : "s"} revoked`);
  revalidatePath("/settings/emergency");
  return { count };
}
