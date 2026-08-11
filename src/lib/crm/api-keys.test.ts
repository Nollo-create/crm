import { describe, it, expect } from "vitest";
import { hashKey, generateApiKey, isApiKeyFormat, maskKey, extractBearer, API_KEY_PREFIX } from "./api-keys";

describe("hashKey", () => {
  it("is deterministic 64-hex sha256", () => {
    const h = hashKey("crmk_abc");
    expect(h).toMatch(/^[0-9a-f]{64}$/);
    expect(hashKey("crmk_abc")).toBe(h);
    expect(hashKey("crmk_abd")).not.toBe(h);
  });
});

describe("generateApiKey", () => {
  it("mints a prefixed key whose hash matches and last4 lines up", () => {
    const k = generateApiKey();
    expect(k.plain.startsWith(API_KEY_PREFIX)).toBe(true);
    expect(k.hash).toBe(hashKey(k.plain));
    expect(k.plain.slice(-4)).toBe(k.last4);
    expect(isApiKeyFormat(k.plain)).toBe(true);
  });
  it("is unique across calls", () => {
    expect(generateApiKey().plain).not.toBe(generateApiKey().plain);
  });
});

describe("isApiKeyFormat", () => {
  it("accepts well-formed keys, rejects junk", () => {
    expect(isApiKeyFormat(generateApiKey().plain)).toBe(true);
    expect(isApiKeyFormat("crmk_short")).toBe(false);
    expect(isApiKeyFormat("nope_" + "x".repeat(30))).toBe(false);
    expect(isApiKeyFormat(null)).toBe(false);
    expect(isApiKeyFormat(123)).toBe(false);
  });
});

describe("maskKey", () => {
  it("shows only the last 4", () => {
    expect(maskKey("ab12")).toBe(`${API_KEY_PREFIX}••••ab12`);
  });
});

describe("extractBearer", () => {
  it("reads Authorization: Bearer and x-api-key, prefers x-api-key", () => {
    expect(extractBearer("Bearer crmk_xyz")).toBe("crmk_xyz");
    expect(extractBearer("bearer  crmk_xyz ")).toBe("crmk_xyz");
    expect(extractBearer(null, "crmk_fromheader")).toBe("crmk_fromheader");
    expect(extractBearer("Bearer a", "crmk_wins")).toBe("crmk_wins");
    expect(extractBearer(null)).toBeNull();
    expect(extractBearer("Basic abc")).toBeNull();
  });
});
