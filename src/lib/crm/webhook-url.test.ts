import { describe, it, expect } from "vitest";
import { isSafeWebhookUrl, isBlockedIp } from "./webhook-url";

describe("isSafeWebhookUrl", () => {
  it("accepts a normal public https webhook", () => {
    for (const u of [
      "https://hooks.slack.com/services/T000/B000/xyz",
      "https://discord.com/api/webhooks/123/abc",
      "https://example.com/alerts",
      "https://api.pagerduty.com/x",
    ]) {
      expect(isSafeWebhookUrl(u).ok, u).toBe(true);
    }
  });

  it("rejects non-https", () => {
    expect(isSafeWebhookUrl("http://example.com/x").ok).toBe(false);
    expect(isSafeWebhookUrl("ftp://example.com/x").ok).toBe(false);
  });

  it("rejects empty / malformed", () => {
    expect(isSafeWebhookUrl("").ok).toBe(false);
    expect(isSafeWebhookUrl("   ").ok).toBe(false);
    expect(isSafeWebhookUrl("not a url").ok).toBe(false);
  });

  it("rejects credentials in the URL", () => {
    expect(isSafeWebhookUrl("https://user:pass@example.com/x").ok).toBe(false);
  });

  it("blocks loopback and localhost", () => {
    for (const u of ["https://localhost/x", "https://127.0.0.1/x", "https://[::1]/x", "https://foo.localhost/x"]) {
      expect(isSafeWebhookUrl(u).ok, u).toBe(false);
    }
  });

  it("blocks the cloud metadata endpoint", () => {
    expect(isSafeWebhookUrl("https://169.254.169.254/latest/meta-data").ok).toBe(false);
    expect(isSafeWebhookUrl("https://metadata.google.internal/x").ok).toBe(false);
  });

  it("blocks RFC1918 private ranges", () => {
    for (const u of [
      "https://10.0.0.5/x",
      "https://192.168.1.1/x",
      "https://172.16.9.9/x",
      "https://172.31.255.255/x",
    ]) {
      expect(isSafeWebhookUrl(u).ok, u).toBe(false);
    }
  });

  it("allows public IPs adjacent to private ranges", () => {
    expect(isSafeWebhookUrl("https://172.15.0.1/x").ok).toBe(true); // just below 172.16
    expect(isSafeWebhookUrl("https://172.32.0.1/x").ok).toBe(true); // just above 172.31
    expect(isSafeWebhookUrl("https://8.8.8.8/x").ok).toBe(true);
  });

  it("blocks .local / .internal / CGNAT", () => {
    expect(isSafeWebhookUrl("https://printer.local/x").ok).toBe(false);
    expect(isSafeWebhookUrl("https://svc.internal/x").ok).toBe(false);
    expect(isSafeWebhookUrl("https://100.64.0.1/x").ok).toBe(false);
  });

  // SEC-01 regression: string-only bypasses that previously passed.
  it("blocks IPv4-mapped IPv6 literals", () => {
    for (const u of ["https://[::ffff:127.0.0.1]/x", "https://[::ffff:169.254.169.254]/x", "https://[::ffff:7f00:1]/x", "https://[::ffff:a9fe:a9fe]/x"]) {
      expect(isSafeWebhookUrl(u).ok, u).toBe(false);
    }
  });
  it("blocks trailing-dot FQDN forms of internal hosts", () => {
    for (const u of ["https://localhost./x", "https://metadata.google.internal./x", "https://svc.internal./x"]) {
      expect(isSafeWebhookUrl(u).ok, u).toBe(false);
    }
  });
  it("still allows a normal public host with a trailing dot", () => {
    expect(isSafeWebhookUrl("https://hooks.slack.com./services/x").ok).toBe(true);
  });
});

describe("isBlockedIp (used on every DNS-resolved address before sending)", () => {
  it("blocks private / loopback / link-local / metadata / CGNAT / multicast", () => {
    for (const ip of ["127.0.0.1", "10.1.2.3", "192.168.0.1", "172.16.0.1", "172.31.255.255", "169.254.169.254", "0.0.0.0", "100.64.0.1", "224.0.0.1", "::1", "fd00::1", "fe80::1", "::ffff:127.0.0.1", "::ffff:169.254.169.254", "fec0::1", "feff::1", "192.0.0.192"]) {
      expect(isBlockedIp(ip), ip).toBe(true);
    }
  });
  it("allows public addresses", () => {
    for (const ip of ["8.8.8.8", "1.1.1.1", "172.15.0.1", "172.32.0.1", "2606:4700:4700::1111"]) {
      expect(isBlockedIp(ip), ip).toBe(false);
    }
  });
});
