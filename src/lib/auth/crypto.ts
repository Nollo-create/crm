import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

// Application-level encryption for the one genuinely reversible secret the CRM
// now stores: a user's TOTP seed (master-prompt §34 — sensitive credentials get
// app-level encryption, key kept SEPARATE from the data). AES-256-GCM (authenticated
// so tampering fails closed). The key comes from MFA_ENCRYPTION_KEY (any long
// random string; hashed to 32 bytes) — if it isn't set, MFA is simply unavailable
// rather than storing a seed in the clear.
//
// The key-less core (encryptWithKey/decryptWithKey) is pure and unit-tested; only
// the env lookup is impure.

const VERSION = "v1";

export function encryptWithKey(key: Buffer, plaintext: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const ct = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [VERSION, iv.toString("base64"), tag.toString("base64"), ct.toString("base64")].join(".");
}

export function decryptWithKey(key: Buffer, token: string): string | null {
  try {
    const [v, ivB, tagB, ctB] = token.split(".");
    if (v !== VERSION || !ivB || !tagB || !ctB) return null;
    const decipher = createDecipheriv("aes-256-gcm", key, Buffer.from(ivB, "base64"));
    decipher.setAuthTag(Buffer.from(tagB, "base64"));
    const pt = Buffer.concat([decipher.update(Buffer.from(ctB, "base64")), decipher.final()]);
    return pt.toString("utf8");
  } catch {
    return null;
  }
}

/** 32-byte key derived from MFA_ENCRYPTION_KEY, or null if not configured. */
function keyFromEnv(): Buffer | null {
  const raw = (process.env.MFA_ENCRYPTION_KEY ?? "").trim();
  if (raw.length < 16) return null;
  return createHash("sha256").update(raw).digest();
}

export function isMfaCryptoConfigured(): boolean {
  return keyFromEnv() !== null;
}

export function encryptSecret(plaintext: string): string | null {
  const key = keyFromEnv();
  return key ? encryptWithKey(key, plaintext) : null;
}

export function decryptSecret(token: string): string | null {
  const key = keyFromEnv();
  return key ? decryptWithKey(key, token) : null;
}
