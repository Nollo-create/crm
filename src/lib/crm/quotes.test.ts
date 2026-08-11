import { describe, it, expect } from "vitest";
import { buildQuoteOrderBy, isQuoteSortKey, isQuoteStatus, quoteNumber } from "./quotes";

describe("quote helpers", () => {
  it("validates statuses and formats the quote number", () => {
    expect(isQuoteStatus("accepted")).toBe(true);
    expect(isQuoteStatus("void")).toBe(false);
    expect(quoteNumber(7)).toBe("Q-0007");
    expect(quoteNumber(1234)).toBe("Q-1234");
  });
});

describe("buildQuoteOrderBy", () => {
  it("maps known keys to their column + direction, with an id tiebreaker", () => {
    expect(buildQuoteOrderBy("total", -1)).toBe("ORDER BY q.total_cents DESC, q.id DESC");
    expect(buildQuoteOrderBy("company", 1)).toBe("ORDER BY co.name ASC, q.id DESC");
    expect(buildQuoteOrderBy("number", -1)).toBe("ORDER BY q.id DESC, q.id DESC");
  });

  it("falls back to the default (created) for unknown / injection input", () => {
    expect(buildQuoteOrderBy("total); DROP TABLE crm_quotes; --", -1)).toBe("ORDER BY q.created_at DESC, q.id DESC");
    expect(buildQuoteOrderBy("evil--", 1)).not.toContain("evil--");
  });

  it("recognises exactly the sortable keys", () => {
    for (const k of ["number", "company", "status", "total", "created"]) expect(isQuoteSortKey(k)).toBe(true);
    expect(isQuoteSortKey("notes")).toBe(false);
  });
});
