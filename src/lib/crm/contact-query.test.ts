import { describe, it, expect } from "vitest";
import { buildContactOrderBy, isContactSortKey } from "./contact-query";

describe("buildContactOrderBy", () => {
  it("maps known keys to their column + direction, with an id tiebreaker", () => {
    expect(buildContactOrderBy("name", 1)).toBe("ORDER BY ct.name ASC, ct.id DESC");
    expect(buildContactOrderBy("company", -1)).toBe("ORDER BY co.name DESC, ct.id DESC");
    expect(buildContactOrderBy("influence", 1)).toBe("ORDER BY ct.influence ASC, ct.id DESC");
  });

  it("falls back to the default column for unknown / injection input", () => {
    expect(buildContactOrderBy("phone); DROP TABLE crm_contacts; --", -1)).toBe("ORDER BY ct.name DESC, ct.id DESC");
    expect(buildContactOrderBy("", 1)).toBe("ORDER BY ct.name ASC, ct.id DESC");
    expect(buildContactOrderBy("evil--", 1)).not.toContain("evil--");
  });

  it("recognises exactly the sortable keys", () => {
    for (const k of ["name", "role", "company", "email", "influence"]) expect(isContactSortKey(k)).toBe(true);
    expect(isContactSortKey("phone")).toBe(false);
  });
});
