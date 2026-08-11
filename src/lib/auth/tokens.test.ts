import { describe, it, expect } from "vitest";
import { generateSessionToken, hashToken } from "./tokens";

describe("session tokens", () => {
  it("generates unique, URL-safe, high-entropy tokens", () => {
    const a = generateSessionToken();
    const b = generateSessionToken();
    expect(a).not.toBe(b);
    expect(a).toMatch(/^[A-Za-z0-9_-]+$/); // base64url, no padding chars
    expect(a.length).toBeGreaterThanOrEqual(43); // 32 bytes -> 43 base64url chars
  });

  it("hashes deterministically to 64 hex chars, differently per token", () => {
    const t = generateSessionToken();
    expect(hashToken(t)).toBe(hashToken(t));
    expect(hashToken(t)).toMatch(/^[0-9a-f]{64}$/);
    expect(hashToken("a")).not.toBe(hashToken("b"));
  });
});
