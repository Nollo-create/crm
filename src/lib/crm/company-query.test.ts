import { describe, it, expect } from "vitest";
import { buildCompanyOrderBy, isCompanySortKey, pageBounds } from "./company-query";

describe("buildCompanyOrderBy", () => {
  it("maps known keys to their column and direction, with an id tiebreaker", () => {
    expect(buildCompanyOrderBy("name", 1)).toBe("ORDER BY c.name ASC, c.id DESC");
    expect(buildCompanyOrderBy("score", -1)).toBe("ORDER BY c.lead_score DESC, c.id DESC");
    expect(buildCompanyOrderBy("openValue", -1)).toBe("ORDER BY open_value DESC, c.id DESC");
    expect(buildCompanyOrderBy("health", 1)).toBe("ORDER BY health_rank ASC, c.id DESC");
  });

  it("falls back to the default column for unknown / injection input", () => {
    expect(buildCompanyOrderBy("id; DROP TABLE crm_companies; --", -1)).toBe("ORDER BY c.lead_score DESC, c.id DESC");
    expect(buildCompanyOrderBy("", 1)).toBe("ORDER BY c.lead_score ASC, c.id DESC");
    // never contains the raw untrusted string
    expect(buildCompanyOrderBy("name)--", 1)).not.toContain("name)--");
  });

  it("recognises exactly the sortable keys", () => {
    for (const k of ["name", "industry", "contacts", "openValue", "score", "health", "lastActivity"]) {
      expect(isCompanySortKey(k)).toBe(true);
    }
    expect(isCompanySortKey("password")).toBe(false);
  });
});

describe("pageBounds", () => {
  it("computes offset + pageCount and clamps the page", () => {
    expect(pageBounds(2, 25, 60)).toEqual({ page: 2, pageSize: 25, offset: 25, pageCount: 3 });
    expect(pageBounds(99, 25, 60).page).toBe(3); // clamped to last page
    expect(pageBounds(0, 25, 60).page).toBe(1);
  });

  it("clamps page size to 1..100 and survives an empty set", () => {
    expect(pageBounds(1, 9999, 10).pageSize).toBe(100);
    expect(pageBounds(1, 0, 10).pageSize).toBe(25); // 0 -> default
    expect(pageBounds(1, 25, 0)).toEqual({ page: 1, pageSize: 25, offset: 0, pageCount: 1 });
  });
});
