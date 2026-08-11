import { describe, it, expect } from "vitest";
import { signHS256, verifyHS256 } from "./jwt";

const SECRET = "a-shared-internal-secret-value";
const now = 1_700_000_000_000; // fixed clock (ms)

describe("verifyHS256", () => {
  it("round-trips a valid token", () => {
    const token = signHS256({ email: "a@b.co", use: "crm-sso", exp: now / 1000 + 90 }, SECRET);
    expect(verifyHS256(token, SECRET, now)).toMatchObject({ email: "a@b.co", use: "crm-sso" });
  });

  it("rejects a wrong secret and a tampered payload", () => {
    const token = signHS256({ email: "a@b.co", use: "crm-sso" }, SECRET);
    expect(verifyHS256(token, "different-secret", now)).toBeNull();
    const [h, , sig] = token.split(".");
    const forged = `${h}.${Buffer.from(JSON.stringify({ email: "evil@x.co", use: "crm-sso" })).toString("base64url")}.${sig}`;
    expect(verifyHS256(forged, SECRET, now)).toBeNull();
  });

  it("rejects an expired token", () => {
    const token = signHS256({ email: "a@b.co", use: "crm-sso", exp: now / 1000 - 1 }, SECRET);
    expect(verifyHS256(token, SECRET, now)).toBeNull();
  });

  it("refuses any algorithm other than HS256 (no alg-confusion)", () => {
    const header = Buffer.from(JSON.stringify({ alg: "none", typ: "JWT" })).toString("base64url");
    const body = Buffer.from(JSON.stringify({ email: "a@b.co" })).toString("base64url");
    expect(verifyHS256(`${header}.${body}.`, SECRET, now)).toBeNull();
  });

  it("rejects malformed input", () => {
    for (const bad of ["", "a.b", "not-a-token", "a.b.c.d"]) {
      expect(verifyHS256(bad, SECRET, now)).toBeNull();
    }
  });
});
