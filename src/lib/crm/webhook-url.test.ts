import { describe, it, expect } from "vitest";
import { isSafeWebhookUrl } from "./webhook-url";

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
});
