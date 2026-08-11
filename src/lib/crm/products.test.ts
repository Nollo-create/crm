import { describe, it, expect } from "vitest";
import { buildProductOrderBy, isProductSortKey, isBilling } from "./products";

describe("product validation", () => {
  it("recognises valid billing periods", () => {
    expect(isBilling("monthly")).toBe(true);
    expect(isBilling("weekly")).toBe(false);
  });
});

describe("buildProductOrderBy", () => {
  it("maps known keys to their column + direction, with an id tiebreaker", () => {
    expect(buildProductOrderBy("name", 1)).toBe("ORDER BY p.name ASC, p.id DESC");
    expect(buildProductOrderBy("price", -1)).toBe("ORDER BY p.price_cents DESC, p.id DESC");
    expect(buildProductOrderBy("sku", 1)).toBe("ORDER BY p.sku ASC, p.id DESC");
  });

  it("falls back to the default (name) for unknown / injection input", () => {
    expect(buildProductOrderBy("price); DROP TABLE crm_products; --", -1)).toBe("ORDER BY p.name DESC, p.id DESC");
    expect(buildProductOrderBy("evil--", 1)).not.toContain("evil--");
  });

  it("recognises exactly the sortable keys", () => {
    for (const k of ["name", "sku", "price", "created"]) expect(isProductSortKey(k)).toBe(true);
    expect(isProductSortKey("billing")).toBe(false);
  });
});
