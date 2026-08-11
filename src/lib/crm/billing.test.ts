import { describe, it, expect } from "vitest";
import { PLANS, getPlan, isPlanKey, usageStatus, formatLimit, DEFAULT_PLAN_KEY } from "./billing";

describe("billing plans", () => {
  it("has a stable, unique set of plan keys", () => {
    const keys = PLANS.map((p) => p.key);
    expect(new Set(keys).size).toBe(keys.length);
    expect(keys).toContain(DEFAULT_PLAN_KEY);
  });
  it("getPlan / isPlanKey resolve known keys and reject junk", () => {
    expect(getPlan("pro")?.name).toBe("Pro");
    expect(getPlan("nope")).toBeNull();
    expect(isPlanKey("business")).toBe(true);
    expect(isPlanKey("enterprise")).toBe(false);
  });
  it("business is unlimited on every resource", () => {
    const biz = getPlan("business")!;
    for (const v of Object.values(biz.limits)) expect(v).toBe(-1);
  });
});

describe("formatLimit", () => {
  it("prints Unlimited for -1 and groups numbers", () => {
    expect(formatLimit(-1)).toBe("Unlimited");
    expect(formatLimit(10000)).toBe("10,000");
    expect(formatLimit(0)).toBe("0");
  });
});

describe("usageStatus", () => {
  it("classifies ok / warn / over against a cap", () => {
    expect(usageStatus(10, 100).state).toBe("ok");
    expect(usageStatus(80, 100).state).toBe("warn");
    expect(usageStatus(100, 100).state).toBe("over");
    expect(usageStatus(150, 100).state).toBe("over");
  });
  it("computes pct clamped to 100", () => {
    expect(usageStatus(25, 100).pct).toBe(25);
    expect(usageStatus(200, 100).pct).toBe(100);
  });
  it("treats -1 as unlimited (always ok, pct 0)", () => {
    const s = usageStatus(9999, -1);
    expect(s.unlimited).toBe(true);
    expect(s.state).toBe("ok");
    expect(s.pct).toBe(0);
  });
  it("guards a zero cap and negative/garbage usage", () => {
    expect(usageStatus(1, 0).state).toBe("over");
    expect(usageStatus(0, 0).state).toBe("ok");
    expect(usageStatus(-5, 100).used).toBe(0);
  });
});
