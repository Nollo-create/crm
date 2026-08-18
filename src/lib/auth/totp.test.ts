import { describe, it, expect } from "vitest";
import { base32Encode, base32Decode, totp, verifyTotp, generateTotpSecret, otpauthUrl, generateRecoveryCodes, hashRecoveryCode } from "./totp";

// RFC 6238 test secret: ASCII "12345678901234567890" in base32.
const RFC_SECRET = "GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ";

describe("base32", () => {
  it("round-trips arbitrary bytes", () => {
    const buf = Buffer.from([0, 1, 2, 250, 255, 128, 64, 32, 7]);
    expect(base32Decode(base32Encode(buf)).equals(buf)).toBe(true);
  });
  it("decodes the RFC secret to the ASCII seed", () => {
    expect(base32Decode(RFC_SECRET).toString("utf8")).toBe("12345678901234567890");
  });
});

describe("totp (RFC 6238 vectors, SHA-1 / 6 digits)", () => {
  const cases: [number, string][] = [
    [59, "287082"],
    [1111111109, "081804"],
    [1234567890, "005924"],
    [2000000000, "279037"],
  ];
  it.each(cases)("t=%i -> %s", (t, code) => {
    expect(totp(RFC_SECRET, t)).toBe(code);
  });
});

describe("verifyTotp", () => {
  it("accepts the current code", () => {
    expect(verifyTotp(RFC_SECRET, "287082", 59)).toBe(true);
  });
  it("rejects a wrong or malformed code", () => {
    expect(verifyTotp(RFC_SECRET, "000000", 59)).toBe(false);
    expect(verifyTotp(RFC_SECRET, "28708", 59)).toBe(false);
    expect(verifyTotp(RFC_SECRET, "abcdef", 59)).toBe(false);
    expect(verifyTotp(RFC_SECRET, "", 59)).toBe(false);
  });
  it("tolerates ±1 step of clock drift within the window", () => {
    const code = totp(RFC_SECRET, 60); // step 2
    expect(verifyTotp(RFC_SECRET, code, 60 + 30)).toBe(true); // step 3, within +1
    expect(verifyTotp(RFC_SECRET, code, 60 + 90)).toBe(false); // step 5, outside window
  });
});

describe("secrets + otpauth", () => {
  it("generates unique base32 secrets", () => {
    const a = generateTotpSecret();
    const b = generateTotpSecret();
    expect(a).not.toBe(b);
    expect(/^[A-Z2-7]+$/.test(a)).toBe(true);
  });
  it("builds a scannable otpauth URI", () => {
    const url = otpauthUrl("ABC234", "user@acme.rs");
    expect(url.startsWith("otpauth://totp/")).toBe(true);
    expect(url).toContain("secret=ABC234");
    expect(url).toContain("issuer=Sajtpress");
  });
});

describe("recovery codes", () => {
  it("generates the requested count of formatted codes", () => {
    const codes = generateRecoveryCodes(10);
    expect(codes).toHaveLength(10);
    expect(new Set(codes).size).toBe(10);
    expect(/^[a-z0-9]{4}-[a-z0-9]{4}$/.test(codes[0])).toBe(true);
  });
  it("hashes deterministically and ignores case/format", () => {
    expect(hashRecoveryCode("J3K9-2M7Q")).toBe(hashRecoveryCode("j3k92m7q"));
    expect(hashRecoveryCode("aaaa-bbbb")).not.toBe(hashRecoveryCode("aaaa-bbbc"));
    expect(hashRecoveryCode("x")).toHaveLength(64);
  });
});
