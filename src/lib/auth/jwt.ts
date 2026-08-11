import { createHmac, timingSafeEqual } from "crypto";

// Minimal HS256 JWT verify, so the CRM can validate the webapp's SSO handoff
// code without pulling in a JWT library. Interoperates with jose's SignJWT
// (same HMAC-SHA256 over base64url(header).base64url(payload), UTF-8 secret).
// Pins the algorithm (no alg-confusion), compares the signature in constant
// time and enforces `exp`. Pure — unit-tested.

function b64urlJson(obj: unknown): string {
  return Buffer.from(JSON.stringify(obj)).toString("base64url");
}

/** Sign a minimal HS256 JWT. The webapp is the real signer; this exists so the
 *  verifier can be tested against a known-good token. */
export function signHS256(payload: Record<string, unknown>, secret: string): string {
  const data = `${b64urlJson({ alg: "HS256", typ: "JWT" })}.${b64urlJson(payload)}`;
  const sig = createHmac("sha256", secret).update(data).digest("base64url");
  return `${data}.${sig}`;
}

export function verifyHS256(token: string, secret: string, now: number = Date.now()): Record<string, unknown> | null {
  if (!token || !secret) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [h, p, sig] = parts;

  let header: { alg?: string };
  let payload: Record<string, unknown>;
  try {
    header = JSON.parse(Buffer.from(h, "base64url").toString("utf8"));
    payload = JSON.parse(Buffer.from(p, "base64url").toString("utf8"));
  } catch {
    return null;
  }
  if (header.alg !== "HS256") return null; // never verify with any other algorithm

  const expected = createHmac("sha256", secret).update(`${h}.${p}`).digest("base64url");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  if (typeof payload.exp === "number" && now / 1000 > payload.exp) return null;
  return payload;
}
