import { describe, it, expect } from "vitest";
import { buildActivityOrderBy, isActivitySortKey, isActivityType } from "./activities";

describe("activity validation", () => {
  it("recognises valid types", () => {
    expect(isActivityType("call")).toBe(true);
    expect(isActivityType("smoke-signal")).toBe(false);
  });
});

describe("buildActivityOrderBy", () => {
  it("maps known keys to their column + direction, with an id tiebreaker", () => {
    expect(buildActivityOrderBy("created", -1)).toBe("ORDER BY a.created_at DESC, a.id DESC");
    expect(buildActivityOrderBy("company", 1)).toBe("ORDER BY co.name ASC, a.id DESC");
    expect(buildActivityOrderBy("type", 1)).toBe("ORDER BY a.type ASC, a.id DESC");
  });

  it("falls back to the default (created) for unknown / injection input", () => {
    expect(buildActivityOrderBy("summary); DROP TABLE crm_activities; --", -1)).toBe("ORDER BY a.created_at DESC, a.id DESC");
    expect(buildActivityOrderBy("evil--", 1)).not.toContain("evil--");
  });

  it("recognises exactly the sortable keys", () => {
    for (const k of ["created", "type", "company"]) expect(isActivitySortKey(k)).toBe(true);
    expect(isActivitySortKey("summary")).toBe(false);
  });
});
