// Roles & permissions — pure, so access rules are testable on their own and
// shared by the data layer, server actions and UI. A simple rank model: a role
// grants a permission when its rank meets the permission's minimum. Enforcement
// always happens server-side, next to the org filter (never trust the UI).

export type Role = "owner" | "admin" | "member" | "viewer";
export const ROLES: Role[] = ["owner", "admin", "member", "viewer"];

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
  | "record:write" // create/edit any CRM record (the general write gate)
  | "member:manage"
  | "org:manage";

// Rank model: a role grants a permission when its rank meets the permission's
// minimum. `viewer` (0) sits below `member` (1) — it can read everything but the
// write permissions require `member`, so a viewer is read-only by construction.
const RANK: Record<Role, number> = { owner: 3, admin: 2, member: 1, viewer: 0 };

/** Minimum role each permission requires. */
const REQUIRED: Record<Permission, Role> = {
  "company:read": "viewer",
  "company:write": "member",
  "company:delete": "admin",
  "deal:read": "viewer",
  "deal:write": "member",
  "deal:delete": "admin",
  "record:write": "member",
  "member:manage": "admin",
  "org:manage": "owner",
};

export function can(role: Role, permission: Permission): boolean {
  return RANK[role] >= RANK[REQUIRED[permission]];
}

/** Normalise an unknown stored value into a safe role (defaults to the least
 *  privileged). */
export function toRole(v: string | null | undefined): Role {
  // Fail closed: an unrecognized/corrupt stored role gets the least privilege,
  // never a write-capable one.
  return v && isRole(v) ? v : "viewer";
}
