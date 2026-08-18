"use server";

import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth/session";
import { can } from "@/lib/auth/rbac";
import { getOrgFlags, setOrgFlag } from "@/lib/db";
import { recordAudit } from "@/lib/auth/audit";

// Owner-only record-level access policy (master-prompt #7). When "restrict
// members" is on, a member only sees and edits leads and deals they own or that
// are unassigned; owners, admins and read-only viewers are unaffected. Enforced
// server-side in every list/get/write path — this action only flips the flag.

export async function getRestrictMembersAction(): Promise<{ canManage: boolean; on: boolean }> {
  const { organizationId, role } = await requireSession();
  if (!can(role, "org:manage")) return { canManage: false, on: false };
  const flags = await getOrgFlags(organizationId).catch(() => null);
  return { canManage: true, on: !!flags?.restrictMembers };
}

export async function setRestrictMembersAction(on: boolean): Promise<{ error?: string }> {
  const session = await requireSession();
  if (!can(session.role, "org:manage")) return { error: "Only an owner can change this." };
  await setOrgFlag(session.organizationId, "restrict_members", on);
  await recordAudit(session, `restrict_members_${on ? "on" : "off"}`, "organization", session.organizationId);
  revalidatePath("/settings/roles");
  return {};
}
