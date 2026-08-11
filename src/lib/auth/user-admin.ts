import { isRole, type Role } from "./rbac";

// Pure guard rules for managing members — kept out of the DB layer so the rules
// that prevent an org locking itself out (last owner, self-demotion) are
// testable. Each returns an error string, or null when the action is allowed.
// `member:manage` (the entry permission) is checked separately in the action.

export interface Actor {
  userId: number;
  role: Role;
}
export interface Target {
  userId: number;
  role: string;
}

/** Validate the role requested when inviting a new user. */
export function inviteRoleError(actorRole: Role, requestedRole: string): string | null {
  if (!isRole(requestedRole)) return "Unknown role.";
  if (requestedRole === "owner" && actorRole !== "owner") return "Only an owner can add another owner.";
  return null;
}

/** Validate changing an existing user's role. */
export function roleChangeError(actor: Actor, target: Target, newRole: string, activeOwners: number): string | null {
  if (!isRole(newRole)) return "Unknown role.";
  if (actor.userId === target.userId) return "You can't change your own role.";
  if ((newRole === "owner" || target.role === "owner") && actor.role !== "owner") return "Only an owner can manage owners.";
  if (target.role === "owner" && newRole !== "owner" && activeOwners <= 1) return "You can't demote the last owner.";
  return null;
}

/** Validate activating / disabling a user. */
export function statusChangeError(actor: Actor, target: Target, newStatus: string, activeOwners: number): string | null {
  if (newStatus !== "active" && newStatus !== "disabled") return "Unknown status.";
  if (actor.userId === target.userId) return "You can't disable your own account.";
  if (target.role === "owner" && actor.role !== "owner") return "Only an owner can manage owners.";
  if (newStatus === "disabled" && target.role === "owner" && activeOwners <= 1) return "You can't disable the last owner.";
  return null;
}
