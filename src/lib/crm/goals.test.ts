import { describe, it, expect } from "vitest";
import { isGoalMetric, isValidMonth, monthBounds, shiftMonth, monthLabel, goalPct, daysInMonth, monthElapsedPct } from "./goals";

describe("daysInMonth", () => {
  it("handles 31/30/28-day months", () => {
    expect(daysInMonth("2026-08")).toBe(31);
    expect(daysInMonth("2026-09")).toBe(30);
    expect(daysInMonth("2026-02")).toBe(28);
    expect(daysInMonth("2028-02")).toBe(29); // leap year
  });
});

describe("monthElapsedPct", () => {
  it("is 100 for past months and 0 for future months", () => {
    expect(monthElapsedPct("2026-07", "2026-08-19")).toBe(100);
    expect(monthElapsedPct("2026-09", "2026-08-19")).toBe(0);
  });
  it("scales by day within the current month", () => {
    expect(monthElapsedPct("2026-08", "2026-08-01")).toBe(3); // 1/31
    expect(monthElapsedPct("2026-08", "2026-08-31")).toBe(100); // 31/31
    expect(monthElapsedPct("2026-06", "2026-06-15")).toBe(50); // 15/30
  });
});

describe("goal metrics", () => {
  it("validates metric keys", () => {
    expect(isGoalMetric("revenue")).toBe(true);
    expect(isGoalMetric("deals_won")).toBe(true);
    expect(isGoalMetric("bogus")).toBe(false);
  });
});

describe("month helpers", () => {
  it("validates YYYY-MM", () => {
    expect(isValidMonth("2026-08")).toBe(true);
    expect(isValidMonth("2026-13")).toBe(false);
    expect(isValidMonth("2026-8")).toBe(false);
    expect(isValidMonth("nope")).toBe(false);
  });

  it("computes half-open month bounds", () => {
    expect(monthBounds("2026-08")).toEqual({ start: "2026-08-01", end: "2026-09-01" });
    // December rolls the year over.
    expect(monthBounds("2026-12")).toEqual({ start: "2026-12-01", end: "2027-01-01" });
  });

  it("shifts months across year boundaries", () => {
    expect(shiftMonth("2026-08", 1)).toBe("2026-09");
    expect(shiftMonth("2026-12", 1)).toBe("2027-01");
    expect(shiftMonth("2026-01", -1)).toBe("2025-12");
    expect(shiftMonth("2026-08", -8)).toBe("2025-12");
  });

  it("labels a period", () => {
    expect(monthLabel("2026-08")).toBe("August 2026");
    expect(monthLabel("2026-01")).toBe("January 2026");
  });
});

describe("goalPct", () => {
  it("is a rounded, non-negative percentage", () => {
    expect(goalPct(50, 100)).toBe(50);
    expect(goalPct(150, 100)).toBe(150); // over-achievement allowed
    expect(goalPct(0, 0)).toBe(0); // no target
    expect(goalPct(1, 3)).toBe(33);
  });
});
