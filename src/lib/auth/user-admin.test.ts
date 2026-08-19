import { describe, it, expect } from "vitest";
import { inviteRoleError, roleChangeError, statusChangeError, type Actor, type Target } from "./user-admin";

const owner: Actor = { userId: 1, role: "owner" };
const admin: Actor = { userId: 2, role: "admin" };
const memberTarget: Target = { userId: 3, role: "member" };
const ownerTarget: Target = { userId: 4, role: "owner" };

describe("inviteRoleError", () => {
  it("rejects unknown roles and admin-created owners", () => {
    expect(inviteRoleError("admin", "member")).toBeNull();
    expect(inviteRoleError("admin", "wizard")).toBe("Unknown role.");
    expect(inviteRoleError("admin", "owner")).toBe("Only an owner can add another owner.");
    expect(inviteRoleError("owner", "owner")).toBeNull();
  });
});

const adminTarget: Target = { userId: 5, role: "admin" };

describe("roleChangeError", () => {
  it("allows an admin to change a member's non-privileged role", () => {
    expect(roleChangeError(admin, memberTarget, "viewer", 1)).toBeNull();
  });
  it("blocks changing your own role", () => {
    expect(roleChangeError(admin, { userId: 2, role: "admin" }, "member", 1)).toBe("You can't change your own role.");
  });
  it("only an owner may grant or revoke owner", () => {
    expect(roleChangeError(admin, memberTarget, "owner", 1)).toBe("Only an owner can manage admins and owners.");
    expect(roleChangeError(admin, ownerTarget, "member", 2)).toBe("Only an owner can manage admins and owners.");
    expect(roleChangeError(owner, memberTarget, "owner", 1)).toBeNull();
  });
  it("only an owner may mint or manage admins (SEC-21)", () => {
    expect(roleChangeError(admin, memberTarget, "admin", 1)).toBe("Only an owner can manage admins and owners."); // admin can't create an admin
    expect(roleChangeError(admin, adminTarget, "member", 1)).toBe("Only an owner can manage admins and owners."); // admin can't demote a peer admin
    expect(roleChangeError(owner, adminTarget, "member", 2)).toBeNull(); // owner can
    expect(roleChangeError(owner, memberTarget, "admin", 2)).toBeNull(); // owner can mint an admin
  });
  it("refuses to demote the last owner", () => {
    expect(roleChangeError(owner, ownerTarget, "admin", 1)).toBe("You can't demote the last owner.");
    expect(roleChangeError(owner, ownerTarget, "admin", 2)).toBeNull();
  });
});

describe("statusChangeError", () => {
  it("blocks disabling yourself and the last owner", () => {
    expect(statusChangeError(admin, { userId: 2, role: "admin" }, "disabled", 1)).toBe("You can't disable your own account.");
    expect(statusChangeError(owner, ownerTarget, "disabled", 1)).toBe("You can't disable the last owner.");
    expect(statusChangeError(owner, ownerTarget, "disabled", 2)).toBeNull();
    expect(statusChangeError(admin, memberTarget, "disabled", 1)).toBeNull();
  });
  it("an admin can't disable a peer admin — owner only (SEC-21)", () => {
    expect(statusChangeError(admin, adminTarget, "disabled", 2)).toBe("Only an owner can manage admins and owners.");
    expect(statusChangeError(owner, adminTarget, "disabled", 2)).toBeNull();
  });
});
