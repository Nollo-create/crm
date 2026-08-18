import "server-only";
import { getUserTotp, consumeRecoveryCode } from "@/lib/db";
import { decryptSecret } from "./crypto";
import { verifyTotp, hashRecoveryCode } from "./totp";

// Shared by the "disable MFA" step-up and the login MFA step. A 6-digit input is
// treated as a TOTP code (never falls through to a recovery code); anything else
// is tried as a single-use recovery code. Recovery codes are spent on success.
export async function verifyUserMfaCode(userId: number, code: string): Promise<boolean> {
  const rec = await getUserTotp(userId);
  if (!rec || !rec.enabled) return false;
  const t = (code ?? "").replace(/\s/g, "");
  if (/^\d{6}$/.test(t)) {
    const secret = decryptSecret(rec.secret);
    return !!secret && verifyTotp(secret, t, Math.floor(Date.now() / 1000));
  }
  if (!t) return false;
  return consumeRecoveryCode(userId, hashRecoveryCode(code));
}
