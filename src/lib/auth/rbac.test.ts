import { describe, it, expect } from "vitest";
import { can, isRole, toRole } from "./rbac";

describe("rbac", () => {
  it("owner can do everything", () => {
    for (const p of ["company:read", "company:delete", "member:manage", "org:manage"] as const) {
      expect(can("owner", p)).toBe(true);
    }
  });

  it("member can read/write but not delete or manage", () => {
    expect(can("member", "company:read")).toBe(true);
    expect(can("member", "company:write")).toBe(true);
    expect(can("member", "company:delete")).toBe(false);
    expect(can("member", "member:manage")).toBe(false);
    expect(can("member", "org:manage")).toBe(false);
  });

  it("admin can delete and manage members, but not the org", () => {
    expect(can("admin", "company:delete")).toBe(true);
    expect(can("admin", "member:manage")).toBe(true);
    expect(can("admin", "org:manage")).toBe(false);
  });

  it("validates and normalises roles", () => {
    expect(isRole("owner")).toBe(true);
    expect(isRole("root")).toBe(false);
    expect(toRole("admin")).toBe("admin");
    expect(toRole("nonsense")).toBe("member");
    expect(toRole(null)).toBe("member");
  });
});
