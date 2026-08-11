import { randomBytes, createHash } from "crypto";

export { SESSION_COOKIE, SESSION_TTL_DAYS } from "./constants";

// Opaque session tokens. The raw token goes to the browser in an httpOnly
// cookie; only its SHA-256 is stored in the DB, so a database leak can't be
// replayed as a live session (same pattern as the connector token). Pure — the
// DB lookup lives in db.ts.

/** A fresh 256-bit URL-safe session token to hand to the browser. */
export function generateSessionToken(): string {
  return randomBytes(32).toString("base64url");
}

/** The value stored/compared server-side. Never store the raw token. */
export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}
