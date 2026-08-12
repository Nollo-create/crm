import { describe, it, expect } from "vitest";
import { customerMetrics, customerHealth, type DealLike } from "./customer";

const deal = (stage: string, value: number, closedAt: string | null = null): DealLike => ({ stage, value, closedAt });

describe("customerMetrics", () => {
  it("sums won revenue, averages, and derives since/last-purchase", () => {
    const m = customerMetrics([
      deal("won", 10000, "2026-01-10"),
      deal("won", 30000, "2026-05-02"),
      deal("negotiation", 5000),
      deal("lost", 9000, "2026-03-01"),
    ]);
    expect(m.wonCount).toBe(2);
    expect(m.totalRevenue).toBe(40000);
    expect(m.avgDeal).toBe(20000);
    expect(m.openCount).toBe(1); // negotiation only (won + lost excluded)
    expect(m.customerSince).toBe("2026-01-10");
    expect(m.lastPurchase).toBe("2026-05-02");
  });
  it("handles a company with no won deals", () => {
    const m = customerMetrics([deal("new", 1000), deal("lost", 2000, "2026-02-02")]);
    expect(m.wonCount).toBe(0);
    expect(m.totalRevenue).toBe(0);
    expect(m.avgDeal).toBe(0);
    expect(m.customerSince).toBeNull();
    expect(m.lastPurchase).toBeNull();
    expect(m.openCount).toBe(1);
  });
  it("ignores won deals with no recorded close date for since/last", () => {
    const m = customerMetrics([deal("won", 5000, null), deal("won", 7000, "2026-04-01")]);
    expect(m.wonCount).toBe(2);
    expect(m.customerSince).toBe("2026-04-01");
    expect(m.lastPurchase).toBe("2026-04-01");
  });
});

describe("customerHealth", () => {
  it("healthy: recent activity with open pipeline", () => {
    expect(customerHealth({ lastActivityDays: 5, openCount: 2, daysSincePurchase: 200 }).state).toBe("healthy");
  });
  it("healthy: recent activity + recent purchase, no open pipeline", () => {
    expect(customerHealth({ lastActivityDays: 10, openCount: 0, daysSincePurchase: 30 }).state).toBe("healthy");
  });
  it("at risk: long silence", () => {
    expect(customerHealth({ lastActivityDays: 75, openCount: 3, daysSincePurchase: 10 }).state).toBe("at_risk");
  });
  it("at risk: quiet 30+ days and no open pipeline", () => {
    expect(customerHealth({ lastActivityDays: 40, openCount: 0, daysSincePurchase: 120 }).state).toBe("at_risk");
  });
  it("attention: no activity yet", () => {
    expect(customerHealth({ lastActivityDays: null, openCount: 0, daysSincePurchase: null }).state).toBe("attention");
  });
  it("attention: engaged-ish but no open pipeline and old purchase", () => {
    expect(customerHealth({ lastActivityDays: 20, openCount: 0, daysSincePurchase: 200 }).state).toBe("attention");
  });
});
