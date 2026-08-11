import { describe, it, expect } from "vitest";
import { weightedValue, summarizePipeline, leadScore, type DealLike } from "./pipeline";

describe("weightedValue", () => {
  it("uses the stage default, an override, and closes correctly", () => {
    expect(weightedValue({ value: 10000, stage: "negotiation" })).toBe(8500); // 85%
    expect(weightedValue({ value: 10000, stage: "negotiation", probability: 70 })).toBe(7000);
    expect(weightedValue({ value: 10000, stage: "won" })).toBe(10000);
    expect(weightedValue({ value: 10000, stage: "lost" })).toBe(0);
  });
});

describe("summarizePipeline", () => {
  it("splits open / won, sums weighted, computes win rate", () => {
    const deals: DealLike[] = [
      { value: 12500, stage: "negotiation" }, // open, weighted 10625
      { value: 7500, stage: "quote" }, // open, weighted 5625
      { value: 20000, stage: "won" }, // won
      { value: 5000, stage: "lost" }, // lost
    ];
    const s = summarizePipeline(deals);
    expect(s.open).toBe(20000);
    expect(s.weighted).toBe(16250);
    expect(s.won).toBe(20000);
    expect(s.openCount).toBe(2);
    expect(s.wonCount).toBe(1);
    expect(s.lostCount).toBe(1);
    expect(s.winRate).toBe(50); // 1 won / 2 closed
    expect(s.byStage.negotiation).toEqual({ count: 1, value: 12500 });
  });

  it("handles an empty pipeline", () => {
    const s = summarizePipeline([]);
    expect(s).toMatchObject({ open: 0, weighted: 0, won: 0, winRate: 0 });
  });
});

describe("leadScore", () => {
  it("rewards fit + size, clamps to 0..100", () => {
    expect(leadScore({ hasWebsite: true, employees: 80, industryMatch: true, annualValue: 50000 })).toBe(95);
    expect(leadScore({ hasWebsite: false, employees: 2, industryMatch: false })).toBe(30);
    expect(leadScore({ hasWebsite: true, employees: 500, industryMatch: true, annualValue: 100000 })).toBe(100);
  });
});
