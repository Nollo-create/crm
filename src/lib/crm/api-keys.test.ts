import { describe, it, expect } from "vitest";
import { normalizeScopes, scopesToString, hasScope, expiryFromDays, API_SCOPES } from "./api-keys";

describe("api-key scopes", () => {
  it("keeps known scopes, dedups, drops junk", () => {
    expect(normalizeScopes(["companies", "deals", "companies", "evil"])).toEqual(["companies", "deals"]);
  });
  it("fails CLOSED on empty/invalid — grants nothing, never everything (SEC-12)", () => {
    // Legacy keys carry the explicit 'companies,contacts,deals' DB default, so
    // they keep working; only a deliberately empty/garbage list yields no access.
    expect(normalizeScopes([])).toEqual([]);
    expect(normalizeScopes("nonsense")).toEqual([]);
    expect(normalizeScopes(undefined)).toEqual([]);
    expect(normalizeScopes("companies,contacts,deals")).toEqual([...API_SCOPES]);
  });
  it("parses a comma string", () => {
    expect(normalizeScopes("companies, contacts")).toEqual(["companies", "contacts"]);
  });
  it("round-trips to a string", () => {
    expect(scopesToString(["deals", "companies"])).toBe("deals,companies");
  });
  it("hasScope checks membership", () => {
    expect(hasScope(["companies"], "companies")).toBe(true);
    expect(hasScope(["companies"], "deals")).toBe(false);
  });
});

describe("api-key expiry", () => {
  const NOW = 1_000_000_000_000;
  it("null/0/negative = never expires", () => {
    expect(expiryFromDays(null, NOW)).toBeNull();
    expect(expiryFromDays(0, NOW)).toBeNull();
    expect(expiryFromDays(-5, NOW)).toBeNull();
  });
  it("computes a future date, capped at 10 years", () => {
    expect(expiryFromDays(30, NOW)!.getTime()).toBe(NOW + 30 * 86_400_000);
    expect(expiryFromDays(100000, NOW)!.getTime()).toBe(NOW + 3650 * 86_400_000);
  });
});
