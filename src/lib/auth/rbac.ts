// Roles & permissions — pure, so access rules are testable on their own and
// shared by the data layer, server actions and UI. A simple rank model: a role
// grants a permission when its rank meets the permission's minimum. Enforcement
// always happens server-side, next to the org filter (never trust the UI).

export type Role = "owner" | "admin" | "member";
export const ROLES: Role[] = ["owner", "admin", "member"];

export function isRole(v: string): v is Role {
  return (ROLES as string[]).includes(v);
}

export type Permission =
  | "company:read"
  | "company:write"
  | "company:delete"
  | "deal:read"
  | "deal:write"
  | "deal:delete"
  | "member:manage"
  | "org:manage";

const RANK: Record<Role, number> = { owner: 3, admin: 2, member: 1 };

/** Minimum role each permission requires. */
const REQUIRED: Record<Permission, Role> = {
  "company:read": "member",
  "company:write": "member",
  "company:delete": "admin",
  "deal:read": "member",
  "deal:write": "member",
  "deal:delete": "admin",
  "member:manage": "admin",
  "org:manage": "owner",
};

export function can(role: Role, permission: Permission): boolean {
  return RANK[role] >= RANK[REQUIRED[permission]];
}

/** Normalise an unknown stored value into a safe role (defaults to the least
 *  privileged). */
export function toRole(v: string | null | undefined): Role {
  return v && isRole(v) ? v : "member";
}
