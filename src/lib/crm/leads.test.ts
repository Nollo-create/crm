import { describe, it, expect } from "vitest";
import { buildLeadOrderBy, isLeadSortKey, isLeadStatus, isLeadSource } from "./leads";

describe("lead validation", () => {
  it("recognises valid statuses and sources", () => {
    expect(isLeadStatus("qualified")).toBe(true);
    expect(isLeadStatus("archived")).toBe(false);
    expect(isLeadSource("referral")).toBe(true);
    expect(isLeadSource("carrier-pigeon")).toBe(false);
  });
});

describe("buildLeadOrderBy", () => {
  it("maps known keys to their column + direction, with an id tiebreaker", () => {
    expect(buildLeadOrderBy("score", -1)).toBe("ORDER BY l.lead_score DESC, l.id DESC");
    expect(buildLeadOrderBy("name", 1)).toBe("ORDER BY l.name ASC, l.id DESC");
    expect(buildLeadOrderBy("created", -1)).toBe("ORDER BY l.id DESC, l.id DESC");
  });

  it("falls back to the default column for unknown / injection input", () => {
    expect(buildLeadOrderBy("name); DROP TABLE crm_leads; --", -1)).toBe("ORDER BY l.lead_score DESC, l.id DESC");
    expect(buildLeadOrderBy("", 1)).toBe("ORDER BY l.lead_score ASC, l.id DESC");
    expect(buildLeadOrderBy("evil--", 1)).not.toContain("evil--");
  });

  it("recognises exactly the sortable keys", () => {
    for (const k of ["name", "company", "source", "status", "score", "created"]) expect(isLeadSortKey(k)).toBe(true);
    expect(isLeadSortKey("email")).toBe(false);
  });
});
