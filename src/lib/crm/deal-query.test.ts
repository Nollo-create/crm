import { describe, it, expect } from "vitest";
import { buildDealOrderBy, isDealSortKey } from "./deal-query";

describe("buildDealOrderBy", () => {
  it("maps known keys to their column + direction, with an id tiebreaker", () => {
    expect(buildDealOrderBy("value", -1)).toBe("ORDER BY d.value DESC, d.id DESC");
    expect(buildDealOrderBy("company", 1)).toBe("ORDER BY co.name ASC, d.id DESC");
    expect(buildDealOrderBy("expectedClose", 1)).toBe("ORDER BY d.expected_close ASC, d.id DESC");
  });

  it("sorts stage in pipeline order via FIELD() over the canonical stage ids", () => {
    const clause = buildDealOrderBy("stage", 1);
    expect(clause).toContain("FIELD(d.stage, 'new', 'qualified'");
    expect(clause).toContain("'won', 'lost')");
    expect(clause.endsWith("ASC, d.id DESC")).toBe(true);
  });

  it("falls back to the default column for unknown / injection input", () => {
    expect(buildDealOrderBy("value); DROP TABLE crm_deals; --", -1)).toBe("ORDER BY d.value DESC, d.id DESC");
    expect(buildDealOrderBy("evil--", 1)).not.toContain("evil--");
  });

  it("recognises exactly the sortable keys", () => {
    for (const k of ["title", "company", "value", "stage", "expectedClose", "created"]) expect(isDealSortKey(k)).toBe(true);
    expect(isDealSortKey("owner")).toBe(false);
  });
});
