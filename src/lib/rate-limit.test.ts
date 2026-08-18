import { describe, it, expect, beforeEach } from "vitest";
import { checkRateLimit, resetRateLimit, retryMessage } from "./rate-limit";

const OPTS = { limit: 3, windowMs: 1000, blockMs: 5000 };

describe("checkRateLimit", () => {
  beforeEach(() => resetRateLimit());

  it("allows up to the limit within a window", () => {
    for (let i = 0; i < 3; i++) expect(checkRateLimit("k", OPTS, 1000).ok).toBe(true);
  });

  it("blocks the (limit+1)th call and reports retryAfter", () => {
    for (let i = 0; i < 3; i++) checkRateLimit("k", OPTS, 1000);
    const r = checkRateLimit("k", OPTS, 1000);
    expect(r.ok).toBe(false);
    expect(r.retryAfter).toBe(5); // blockMs 5000 -> 5s
  });

  it("stays blocked for the whole cooldown, then recovers", () => {
    for (let i = 0; i < 4; i++) checkRateLimit("k", OPTS, 1000); // trips block at t=1000, until 6000
    expect(checkRateLimit("k", OPTS, 5999).ok).toBe(false);
    expect(checkRateLimit("k", OPTS, 6001).ok).toBe(true);
  });

  it("resets the count after the window rolls over", () => {
    for (let i = 0; i < 3; i++) checkRateLimit("k", OPTS, 1000);
    // new window (>= windowMs later) starts fresh
    expect(checkRateLimit("k", OPTS, 2000).ok).toBe(true);
  });

  it("keys are independent", () => {
    for (let i = 0; i < 4; i++) checkRateLimit("a", OPTS, 1000);
    expect(checkRateLimit("a", OPTS, 1000).ok).toBe(false);
    expect(checkRateLimit("b", OPTS, 1000).ok).toBe(true);
  });

  it("resetRateLimit(key) clears a single key", () => {
    for (let i = 0; i < 4; i++) checkRateLimit("k", OPTS, 1000);
    resetRateLimit("k");
    expect(checkRateLimit("k", OPTS, 1000).ok).toBe(true);
  });
});

describe("retryMessage", () => {
  it("renders minutes and seconds", () => {
    expect(retryMessage(120)).toContain("2 minutes");
    expect(retryMessage(60)).toContain("1 minute");
    expect(retryMessage(5)).toContain("5 seconds");
  });
});
