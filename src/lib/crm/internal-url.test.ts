import { describe, it, expect } from "vitest";
import { buildInternalUrl } from "./internal-url";

const BASE = "https://webapp.sajtpress.rs";

describe("buildInternalUrl (SSRF guard)", () => {
  it("allows code-defined internal paths on the configured origin", () => {
    expect(buildInternalUrl(BASE, "/api/internal/ping")).toBe("https://webapp.sajtpress.rs/api/internal/ping");
    expect(buildInternalUrl(BASE, "/api/internal/ai/complete")).toBe("https://webapp.sajtpress.rs/api/internal/ai/complete");
  });

  it("preserves the origin even when the base has no trailing slash", () => {
    // The classic pivot: base + ".evil.com" must not become a different host.
    expect(buildInternalUrl(BASE, ".evil.com/api/internal/x")).toBeNull();
  });

  it("rejects absolute URLs to another host", () => {
    expect(buildInternalUrl(BASE, "https://evil.com/api/internal/ping")).toBeNull();
    expect(buildInternalUrl(BASE, "http://169.254.169.254/latest/meta-data")).toBeNull();
  });

  it("rejects protocol-relative and non-slash paths", () => {
    expect(buildInternalUrl(BASE, "//evil.com/x")).toBeNull();
    expect(buildInternalUrl(BASE, "api/internal/ping")).toBeNull();
    expect(buildInternalUrl(BASE, "")).toBeNull();
  });

  it("rejects paths outside /api/internal/", () => {
    expect(buildInternalUrl(BASE, "/api/public/x")).toBeNull();
    expect(buildInternalUrl(BASE, "/etc/passwd")).toBeNull();
    expect(buildInternalUrl(BASE, "/api/internalX")).toBeNull();
  });

  it("rejects a malformed or non-http base", () => {
    expect(buildInternalUrl("not a url", "/api/internal/ping")).toBeNull();
    expect(buildInternalUrl("file:///etc", "/api/internal/ping")).toBeNull();
  });
});
