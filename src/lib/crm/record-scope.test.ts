import { describe, it, expect } from "vitest";
import { ownerFilter, canAccessOwned } from "./record-scope";

describe("ownerFilter", () => {
  it("no filter when restriction is off", () => {
    expect(ownerFilter("l.owner_user_id", "member", 7, false)).toEqual({ sql: "", params: [] });
  });
  it("no filter for owner/admin/viewer even when restricted", () => {
    for (const r of ["owner", "admin", "viewer"]) {
      expect(ownerFilter("l.owner_user_id", r, 7, true).sql).toBe("");
    }
  });
  it("scopes a restricted member to own-or-unassigned", () => {
    const f = ownerFilter("l.owner_user_id", "member", 7, true);
    expect(f.sql).toBe(" AND (l.owner_user_id = ? OR l.owner_user_id IS NULL)");
    expect(f.params).toEqual([7]);
  });
});

describe("canAccessOwned", () => {
  it("everyone passes when restriction is off", () => {
    expect(canAccessOwned("member", 7, false, 9)).toBe(true);
  });
  it("owner/admin/viewer always pass", () => {
    expect(canAccessOwned("admin", 7, true, 9)).toBe(true);
    expect(canAccessOwned("owner", 7, true, 9)).toBe(true);
    expect(canAccessOwned("viewer", 7, true, 9)).toBe(true);
  });
  it("restricted member: own or unassigned only", () => {
    expect(canAccessOwned("member", 7, true, 7)).toBe(true); // own
    expect(canAccessOwned("member", 7, true, null)).toBe(true); // unassigned
    expect(canAccessOwned("member", 7, true, 9)).toBe(false); // someone else's
  });
});
