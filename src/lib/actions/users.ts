"use server";

import { revalidatePath } from "next/cache";
import {
  listUsers,
  getUserById,
  createUser,
  updateUserRole,
  setUserStatus,
  countActiveOwners,
  type UserRow,
} from "@/lib/db";
import { requireSession } from "@/lib/auth/session";
import { can, isRole } from "@/lib/auth/rbac";
import { inviteRoleError, roleChangeError, statusChangeError } from "@/lib/auth/user-admin";
import { recordAudit } from "@/lib/auth/audit";
import { hashPassword } from "@/lib/auth/password";

export interface OrgUser {
  id: number;
  name: string;
  email: string;
  role: string;
  status: string;
  createdAt: string;
  lastLoginAt: string | null;
}

function toOrgUser(r: UserRow): OrgUser {
  return {
    id: r.id,
    name: r.name,
    email: r.email,
    role: r.role,
    status: r.status,
    createdAt: new Date(r.created_at).toISOString(),
    lastLoginAt: r.last_login_at ? new Date(r.last_login_at).toISOString() : null,
  };
}

const validEmail = (e: string) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e);

export async function listUsersAction(): Promise<OrgUser[]> {
  const { organizationId, role } = await requireSession();
  if (!can(role, "member:manage")) return [];
  const rows = await listUsers(organizationId);
  return rows.map(toOrgUser);
}

export async function inviteUserAction(input: { name: string; email: string; role: string; password: string }): Promise<{ error?: string }> {
  const session = await requireSession();
  if (!can(session.role, "member:manage")) return { error: "You don't have permission to add users." };

  const email = input.email.trim().toLowerCase();
  const role = isRole(input.role) ? input.role : "member";
  if (!validEmail(email)) return { error: "Enter a valid email address." };
  if (input.password.length < 8) return { error: "Password must be at least 8 characters." };
  const roleErr = inviteRoleError(session.role, role);
  if (roleErr) return { error: roleErr };

  let userId: number;
  try {
    const passwordHash = await hashPassword(input.password);
    userId = await createUser({ organizationId: session.organizationId, email, name: input.name.trim(), passwordHash, role });
  } catch {
    return { error: "A user with that email already exists." };
  }
  await recordAudit(session, "invite", "user", userId, `${email} as ${role}`);
  revalidatePath("/settings/users");
  return {};
}

export async function setUserRoleAction(userId: number, role: string): Promise<{ error?: string }> {
  const session = await requireSession();
  if (!can(session.role, "member:manage")) return { error: "You don't have permission." };

  const target = await getUserById(userId);
  if (!target || target.organization_id !== session.organizationId) return { error: "User not found." };
  const activeOwners = await countActiveOwners(session.organizationId);
  const err = roleChangeError(
    { userId: session.userId, role: session.role },
    { userId: target.id, role: target.role },
    role,
    activeOwners
  );
  if (err) return { error: err };

  await updateUserRole(session.organizationId, userId, role);
  await recordAudit(session, "role_change", "user", userId, `${target.email} → ${role}`);
  revalidatePath("/settings/users");
  return {};
}

export async function setUserStatusAction(userId: number, status: "active" | "disabled"): Promise<{ error?: string }> {
  const session = await requireSession();
  if (!can(session.role, "member:manage")) return { error: "You don't have permission." };

  const target = await getUserById(userId);
  if (!target || target.organization_id !== session.organizationId) return { error: "User not found." };
  const activeOwners = await countActiveOwners(session.organizationId);
  const err = statusChangeError(
    { userId: session.userId, role: session.role },
    { userId: target.id, role: target.role },
    status,
    activeOwners
  );
  if (err) return { error: err };

  await setUserStatus(session.organizationId, userId, status);
  await recordAudit(session, "status_change", "user", userId, `${target.email} → ${status}`);
  revalidatePath("/settings/users");
  return {};
}
