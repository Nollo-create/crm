import { describe, it, expect } from "vitest";
import { bpToPercent, percentToBp, commissionCents } from "./commissions";

describe("commission rate conversion", () => {
  it("round-trips percent <-> basis points", () => {
    expect(percentToBp(10)).toBe(1000);
    expect(percentToBp(12.5)).toBe(1250);
    expect(bpToPercent(1000)).toBe(10);
    expect(bpToPercent(1250)).toBe(12.5);
  });
  it("clamps negatives to zero", () => {
    expect(percentToBp(-5)).toBe(0);
  });
});

describe("commissionCents", () => {
  it("computes commission in cents from euro revenue and a bp rate", () => {
    expect(commissionCents(1000, 1000)).toBe(10000); // €1000 @ 10% = €100.00
    expect(commissionCents(1500, 1250)).toBe(18750); // €1500 @ 12.5% = €187.50
    expect(commissionCents(0, 1000)).toBe(0);
    expect(commissionCents(1000, 0)).toBe(0);
  });
});
