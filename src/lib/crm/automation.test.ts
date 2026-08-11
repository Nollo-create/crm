import { describe, it, expect } from "vitest";
import { getTemplate, isTemplateKey, normalizeParams } from "./automation";

describe("automation templates", () => {
  it("resolves known template keys", () => {
    expect(isTemplateKey("followup_inactive")).toBe(true);
    expect(isTemplateKey("delete_everything")).toBe(false);
    expect(getTemplate("work_new_leads")?.category).toBe("routing");
    expect(getTemplate("nope")).toBeNull();
  });
});

describe("normalizeParams", () => {
  it("applies defaults and coerces to the spec", () => {
    expect(normalizeParams("followup_inactive", null)).toEqual({ days: 30, priority: "normal" });
    expect(normalizeParams("followup_inactive", { days: "45", priority: "high" })).toEqual({ days: 45, priority: "high" });
  });

  it("rejects bad values, clamps ranges, and drops unknown keys", () => {
    expect(normalizeParams("followup_inactive", { days: -5, priority: "boss" })).toEqual({ days: 30, priority: "normal" });
    expect(normalizeParams("work_new_leads", { minScore: 9999 })).toEqual({ minScore: 100, priority: "normal" });
    expect(normalizeParams("nope", { anything: 1 })).toEqual({});
  });
});
