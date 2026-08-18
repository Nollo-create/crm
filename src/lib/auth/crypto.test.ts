import { describe, it, expect } from "vitest";
import { encryptWithKey, decryptWithKey } from "./crypto";

const KEY = Buffer.alloc(32, 7);
const KEY2 = Buffer.alloc(32, 9);

describe("AES-256-GCM encryptWithKey / decryptWithKey", () => {
  it("round-trips a secret", () => {
    const token = encryptWithKey(KEY, "JBSWY3DPEHPK3PXP");
    expect(token).not.toContain("JBSWY3DPEHPK3PXP");
    expect(decryptWithKey(KEY, token)).toBe("JBSWY3DPEHPK3PXP");
  });

  it("produces a different ciphertext each time (random IV)", () => {
    expect(encryptWithKey(KEY, "same")).not.toBe(encryptWithKey(KEY, "same"));
  });

  it("fails closed for the wrong key", () => {
    const token = encryptWithKey(KEY, "secret");
    expect(decryptWithKey(KEY2, token)).toBeNull();
  });

  it("fails closed for tampered ciphertext (auth tag)", () => {
    const token = encryptWithKey(KEY, "secret");
    const parts = token.split(".");
    parts[3] = Buffer.from("tampered!!").toString("base64");
    expect(decryptWithKey(KEY, parts.join("."))).toBeNull();
  });

  it("returns null on garbage input", () => {
    expect(decryptWithKey(KEY, "not-a-token")).toBeNull();
    expect(decryptWithKey(KEY, "")).toBeNull();
  });
});
