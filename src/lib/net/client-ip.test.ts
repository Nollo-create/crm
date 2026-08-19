import { describe, it, expect } from "vitest";
import { pickClientIp } from "./client-ip";

describe("pickClientIp (SEC-10)", () => {
  it("takes the right-most XFF entry (the trusted proxy's observed peer), not the spoofable left-most", () => {
    // Client forged "1.2.3.4"; the proxy appended the real peer "203.0.113.9".
    expect(pickClientIp("1.2.3.4, 203.0.113.9", null, 1)).toBe("203.0.113.9");
  });
  it("indexes from the right by the trusted-hop count", () => {
    expect(pickClientIp("evil, cdn, 203.0.113.9", null, 2)).toBe("cdn");
    expect(pickClientIp("a, b, c", null, 3)).toBe("a");
    expect(pickClientIp("a, b, c", null, 99)).toBe("a"); // clamp, never underflow
  });
  it("single entry returns it", () => {
    expect(pickClientIp("203.0.113.9", null, 1)).toBe("203.0.113.9");
  });
  it("falls back to x-real-ip, then 'unknown'", () => {
    expect(pickClientIp("", "198.51.100.7", 1)).toBe("198.51.100.7");
    expect(pickClientIp(null, null, 1)).toBe("unknown");
    expect(pickClientIp("   ", "  ", 1)).toBe("unknown");
  });
  it("a lone spoofed XFF (no real proxy) is still returned as the last entry — acceptable since IP is non-authoritative", () => {
    // With a correctly-configured single proxy this can't happen (the proxy always
    // appends); documented so the behavior is explicit.
    expect(pickClientIp("1.2.3.4", null, 1)).toBe("1.2.3.4");
  });
});
