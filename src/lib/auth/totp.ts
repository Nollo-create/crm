import { createHmac, createHash, randomBytes, timingSafeEqual } from "node:crypto";

// RFC 6238 TOTP (SHA-1, 6 digits, 30s) — what every authenticator app speaks.
// Pure + unit-tested against the RFC test vectors. No native/3rd-party deps.

const B32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

export function base32Encode(buf: Buffer): string {
  let bits = 0;
  let value = 0;
  let out = "";
  for (const byte of buf) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      out += B32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) out += B32_ALPHABET[(value << (5 - bits)) & 31];
  return out;
}

export function base32Decode(s: string): Buffer {
  const clean = s.toUpperCase().replace(/=+$/, "").replace(/\s/g, "");
  let bits = 0;
  let value = 0;
  const out: number[] = [];
  for (const ch of clean) {
    const idx = B32_ALPHABET.indexOf(ch);
    if (idx === -1) continue;
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      out.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }
  return Buffer.from(out);
}

/** A fresh base32 TOTP secret (160-bit, the RFC-recommended size). */
export function generateTotpSecret(bytes = 20): string {
  return base32Encode(randomBytes(bytes));
}

function hotp(key: Buffer, counter: number, digits = 6): string {
  const buf = Buffer.alloc(8);
  buf.writeUInt32BE(Math.floor(counter / 2 ** 32), 0);
  buf.writeUInt32BE(counter >>> 0, 4);
  const hmac = createHmac("sha1", key).update(buf).digest();
  const offset = hmac[hmac.length - 1] & 0xf;
  const bin = ((hmac[offset] & 0x7f) << 24) | (hmac[offset + 1] << 16) | (hmac[offset + 2] << 8) | hmac[offset + 3];
  return (bin % 10 ** digits).toString().padStart(digits, "0");
}

/** The current code for a secret at `timeSec` (seconds since epoch). */
export function totp(secret: string, timeSec: number, step = 30, digits = 6): string {
  return hotp(base32Decode(secret), Math.floor(timeSec / step), digits);
}

/** Verify a submitted 6-digit code, allowing ±`window` 30s steps for clock drift.
 *  Constant-time compare so a wrong code leaks nothing by timing. */
export function verifyTotp(secret: string, token: string, timeSec: number, window = 1): boolean {
  const t = (token ?? "").replace(/\s/g, "");
  if (!/^\d{6}$/.test(t)) return false;
  const key = base32Decode(secret);
  const counter = Math.floor(timeSec / 30);
  const submitted = Buffer.from(t);
  for (let w = -window; w <= window; w++) {
    if (counter + w < 0) continue;
    const code = Buffer.from(hotp(key, counter + w, 6));
    if (code.length === submitted.length && timingSafeEqual(code, submitted)) return true;
  }
  return false;
}

/** otpauth:// URI for QR / manual entry. */
export function otpauthUrl(secret: string, account: string, issuer = "Sajtpress CRM"): string {
  const label = encodeURIComponent(`${issuer}:${account}`);
  const params = new URLSearchParams({ secret, issuer, algorithm: "SHA1", digits: "6", period: "30" });
  return `otpauth://totp/${label}?${params.toString()}`;
}

/** Group a base32 secret into 4-char blocks for readable manual entry. */
export function formatSecretForDisplay(secret: string): string {
  return secret.replace(/(.{4})/g, "$1 ").trim();
}

// ---- Recovery codes (single-use fallback when the authenticator is lost) ----

/** Human-friendly codes like "j3k9-2m7q". Store only their hashes. */
export function generateRecoveryCodes(count = 10): string[] {
  const alphabet = "abcdefghijkmnpqrstuvwxyz23456789"; // no ambiguous 0/o/1/l
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    const bytes = randomBytes(8);
    let s = "";
    for (const b of bytes) s += alphabet[b % alphabet.length];
    codes.push(`${s.slice(0, 4)}-${s.slice(4, 8)}`);
  }
  return codes;
}

/** Normalize (lowercase, strip separators) then SHA-256 — what's stored/compared. */
export function hashRecoveryCode(code: string): string {
  const norm = (code ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");
  return createHash("sha256").update(norm).digest("hex");
}
