import { describe, it, expect } from "vitest";
import { describeUserAgent } from "./user-agent";

describe("describeUserAgent", () => {
  const cases: [string, string, string, "Mobile" | "Tablet" | "Desktop"][] = [
    // ua, expected browser, expected os, expected device type
    ["Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36", "Chrome", "Windows", "Desktop"],
    ["Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36 Edg/120.0", "Edge", "Windows", "Desktop"],
    ["Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15", "Safari", "macOS", "Desktop"],
    ["Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1", "Safari", "iPhone", "Mobile"],
    ["Mozilla/5.0 (X11; Linux x86_64; rv:121.0) Gecko/20100101 Firefox/121.0", "Firefox", "Linux", "Desktop"],
    ["Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Mobile Safari/537.36", "Chrome", "Android", "Mobile"],
    ["Mozilla/5.0 (Linux; Android 13; SM-X710) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36", "Chrome", "Android", "Tablet"],
    ["Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1", "Safari", "iPad", "Tablet"],
    // Windows with the platform-version client hint appended (CHPV): 15 -> 11, 10 -> 10.
    ["Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36 CHPV/15.0.0", "Chrome", "Windows 11", "Desktop"],
    ["Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36 CHPV/10.0.0", "Chrome", "Windows 10", "Desktop"],
  ];

  it.each(cases)("parses %s", (ua, browser, os, deviceType) => {
    const d = describeUserAgent(ua);
    expect(d.browser).toBe(browser);
    expect(d.os).toBe(os);
    expect(d.deviceType).toBe(deviceType);
    expect(d.label).toBe(`${browser} on ${os}`);
  });

  it("degrades gracefully on empty/garbage", () => {
    expect(describeUserAgent("").label).toBe("Unknown device");
    expect(describeUserAgent(null).label).toBe("Unknown device");
    expect(describeUserAgent("curl/8.0").label).toBe("Unknown device");
  });
});
