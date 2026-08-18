import { describe, it, expect } from "vitest";
import { describeUserAgent } from "./user-agent";

describe("describeUserAgent", () => {
  const cases: [string, string, string][] = [
    // ua, expected browser, expected os
    ["Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36", "Chrome", "Windows"],
    ["Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36 Edg/120.0", "Edge", "Windows"],
    ["Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15", "Safari", "macOS"],
    ["Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1", "Safari", "iPhone"],
    ["Mozilla/5.0 (X11; Linux x86_64; rv:121.0) Gecko/20100101 Firefox/121.0", "Firefox", "Linux"],
    ["Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Mobile Safari/537.36", "Chrome", "Android"],
  ];

  it.each(cases)("parses %s", (ua, browser, os) => {
    const d = describeUserAgent(ua);
    expect(d.browser).toBe(browser);
    expect(d.os).toBe(os);
    expect(d.label).toBe(`${browser} on ${os}`);
  });

  it("degrades gracefully on empty/garbage", () => {
    expect(describeUserAgent("").label).toBe("Unknown device");
    expect(describeUserAgent(null).label).toBe("Unknown device");
    expect(describeUserAgent("curl/8.0").label).toBe("Unknown device");
  });
});
