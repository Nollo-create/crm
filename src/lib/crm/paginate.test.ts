import { describe, it, expect } from "vitest";
import { paginate } from "./paginate";

const nums = Array.from({ length: 23 }, (_, i) => i + 1); // 1..23

describe("paginate", () => {
  it("returns the right slice and range for a middle page", () => {
    const p = paginate(nums, 2, 10);
    expect(p.rows).toEqual([11, 12, 13, 14, 15, 16, 17, 18, 19, 20]);
    expect(p).toMatchObject({ total: 23, page: 2, pageCount: 3, from: 11, to: 20 });
  });

  it("caps the last page to the remaining rows", () => {
    const p = paginate(nums, 3, 10);
    expect(p.rows).toEqual([21, 22, 23]);
    expect(p).toMatchObject({ page: 3, pageCount: 3, from: 21, to: 23 });
  });

  it("clamps an out-of-range page back into bounds", () => {
    expect(paginate(nums, 99, 10).page).toBe(3);
    expect(paginate(nums, 0, 10).page).toBe(1);
    expect(paginate(nums, -5, 10).page).toBe(1);
  });

  it("handles an empty list", () => {
    expect(paginate([], 1, 10)).toEqual({ rows: [], total: 0, page: 1, pageCount: 1, from: 0, to: 0 });
  });

  it("handles a single partial page", () => {
    const p = paginate([1, 2, 3], 1, 25);
    expect(p).toMatchObject({ total: 3, page: 1, pageCount: 1, from: 1, to: 3 });
  });
});
