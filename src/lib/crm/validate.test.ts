import { describe, it, expect } from "vitest";
import { vString, vEmail, vInt, vEnum, validated, ValidationError } from "./validate";

describe("vString", () => {
  it("trims and returns", () => expect(vString("Name", "  Acme  ")).toBe("Acme"));
  it("requires when asked", () => expect(() => vString("Name", "  ", { required: true })).toThrow(ValidationError));
  it("allows empty when optional", () => expect(vString("Name", "")).toBe(""));
  it("enforces max length", () => expect(() => vString("Name", "abcdef", { max: 5 })).toThrow(/too long/));
  it("enforces min length", () => expect(() => vString("Name", "ab", { min: 3 })).toThrow(/too short/));
});

describe("vEmail", () => {
  it("lowercases valid emails", () => expect(vEmail("Email", "A@B.com")).toBe("a@b.com"));
  it("rejects malformed", () => expect(() => vEmail("Email", "nope")).toThrow(/valid email/));
  it("allows empty when optional", () => expect(vEmail("Email", "")).toBe(""));
});

describe("vInt", () => {
  it("parses and truncates", () => expect(vInt("N", "42.9")).toBe(42));
  it("null when optional + empty", () => expect(vInt("N", "")).toBeNull());
  it("enforces min/max", () => {
    expect(() => vInt("N", 0, { min: 1 })).toThrow(/at least/);
    expect(() => vInt("N", 500, { max: 100 })).toThrow(/at most/);
  });
  it("rejects non-numbers", () => expect(() => vInt("N", "abc")).toThrow(/must be a number/));
});

describe("vEnum", () => {
  const S = ["new", "won", "lost"] as const;
  it("passes allowed values", () => expect(vEnum("Status", "won", S)).toBe("won"));
  it("falls back when provided", () => expect(vEnum("Status", "x", S, { fallback: "new" })).toBe("new"));
  it("throws without a fallback", () => expect(() => vEnum("Status", "x", S)).toThrow(ValidationError));
});

describe("validated", () => {
  it("returns ok with the built value", () => {
    const r = validated(() => ({ name: vString("Name", " A ", { required: true }) }));
    expect(r).toEqual({ ok: true, value: { name: "A" } });
  });
  it("captures the first validation error", () => {
    const r = validated(() => ({ name: vString("Name", "", { required: true }) }));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toMatch(/required/);
  });
  it("rethrows non-validation errors", () => {
    expect(() => validated(() => { throw new Error("boom"); })).toThrow("boom");
  });
});
