// Record-level access scoping (master-prompt #7). Optional, per-org, off by
// default. When an owner turns on "restrict members to their own records", a
// member sees/edits only records they own or that are unassigned; owners, admins
// and viewers (read-only oversight) always see everything.
//
// Pure so the rule is unit-tested independently of any query. `column` is always
// a code-provided constant (e.g. "l.owner_user_id"), never user input.

export interface OwnerFilter {
  sql: string; // "" when no filter applies, else " AND (col = ? OR col IS NULL)"
  params: number[];
}

function scoped(role: string, restricted: boolean): boolean {
  // Only a member is ever scoped; and only when the org has restriction on.
  return restricted && role === "member";
}

/** WHERE fragment appended to a list query. Empty for unrestricted viewers. */
export function ownerFilter(column: string, role: string, userId: number, restricted: boolean): OwnerFilter {
  if (!scoped(role, restricted)) return { sql: "", params: [] };
  return { sql: ` AND (${column} = ? OR ${column} IS NULL)`, params: [userId] };
}

/** Whether a user may open/edit a single record given its owner. Unassigned
 *  (null owner) records stay accessible so legacy data isn't hidden. */
export function canAccessOwned(role: string, userId: number, restricted: boolean, recordOwnerUserId: number | null): boolean {
  if (!scoped(role, restricted)) return true;
  return recordOwnerUserId === null || recordOwnerUserId === userId;
}
