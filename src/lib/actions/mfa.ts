"use server";

import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth/session";
import {
  getUserTotp,
  setUserTotpSecret,
  enableUserTotp,
  disableUserTotp,
  replaceRecoveryCodes,
  countUnusedRecoveryCodes,
} from "@/lib/db";
import { isMfaCryptoConfigured, encryptSecret, decryptSecret } from "@/lib/auth/crypto";
import { generateTotpSecret, verifyTotp, otpauthUrl, formatSecretForDisplay, generateRecoveryCodes, hashRecoveryCode } from "@/lib/auth/totp";
import { verifyUserMfaCode } from "@/lib/auth/mfa-verify";
import { recordAudit } from "@/lib/auth/audit";
import { checkRateLimit, retryMessage } from "@/lib/rate-limit";

const nowSec = () => Math.floor(Date.now() / 1000);

export interface MfaStatus {
  configured: boolean; // server has MFA_ENCRYPTION_KEY
  enabled: boolean;
  recoveryRemaining: number;
}

export async function mfaStatusAction(): Promise<MfaStatus> {
  const session = await requireSession();
  const totp = await getUserTotp(session.userId).catch(() => null);
  const recoveryRemaining = totp?.enabled ? await countUnusedRecoveryCodes(session.userId).catch(() => 0) : 0;
  return { configured: isMfaCryptoConfigured(), enabled: !!totp?.enabled, recoveryRemaining };
}

/** Step 1: mint a pending secret and hand back what the user needs to add it to
 *  their authenticator (secret + otpauth URL). Not active until confirmed. */
export async function beginMfaEnrollAction(): Promise<{ secret?: string; formatted?: string; otpauth?: string; error?: string }> {
  const session = await requireSession();
  if (!isMfaCryptoConfigured()) return { error: "Two-factor isn't available — the server needs MFA_ENCRYPTION_KEY configured." };
  const current = await getUserTotp(session.userId).catch(() => null);
  if (current?.enabled) return { error: "Two-factor is already on. Disable it first to re-enroll." };

  const secret = generateTotpSecret();
  const enc = encryptSecret(secret);
  if (!enc) return { error: "Could not secure the secret." };
  await setUserTotpSecret(session.userId, enc);
  return { secret, formatted: formatSecretForDisplay(secret), otpauth: otpauthUrl(secret, session.email) };
}

/** Step 2: confirm a code from the authenticator, then turn MFA on and issue
 *  one-time recovery codes (shown once). */
export async function confirmMfaEnrollAction(code: string): Promise<{ recoveryCodes?: string[]; error?: string }> {
  const session = await requireSession();
  if (!isMfaCryptoConfigured()) return { error: "Two-factor isn't available on this server." };
  const rl = checkRateLimit(`mfa-enroll:${session.userId}`, { limit: 8, windowMs: 5 * 60_000, blockMs: 10 * 60_000 });
  if (!rl.ok) return { error: retryMessage(rl.retryAfter) };

  const totp = await getUserTotp(session.userId).catch(() => null);
  if (!totp || totp.enabled) return { error: "Start setup again." };
  const secret = decryptSecret(totp.secret);
  if (!secret || !verifyTotp(secret, code, nowSec())) return { error: "That code didn't match. Check your authenticator and try again." };

  await enableUserTotp(session.userId);
  const codes = generateRecoveryCodes(10);
  await replaceRecoveryCodes(session.userId, codes.map(hashRecoveryCode));
  await recordAudit(session, "mfa_enable", "user", session.userId);
  revalidatePath("/settings/sessions");
  return { recoveryCodes: codes };
}

/** Turn MFA off — requires a current code (step-up), so a hijacked session alone
 *  can't remove it. */
export async function disableMfaAction(code: string): Promise<{ error?: string }> {
  const session = await requireSession();
  const rl = checkRateLimit(`mfa-disable:${session.userId}`, { limit: 8, windowMs: 5 * 60_000, blockMs: 10 * 60_000 });
  if (!rl.ok) return { error: retryMessage(rl.retryAfter) };
  const totp = await getUserTotp(session.userId).catch(() => null);
  if (!totp?.enabled) return { error: "Two-factor isn't on." };
  if (!(await verifyUserMfaCode(session.userId, code))) return { error: "That code didn't match." };
  await disableUserTotp(session.userId);
  await recordAudit(session, "mfa_disable", "user", session.userId);
  revalidatePath("/settings/sessions");
  return {};
}

/** Replace the recovery codes (also step-up gated). Shows the new set once. */
export async function regenerateRecoveryCodesAction(code: string): Promise<{ recoveryCodes?: string[]; error?: string }> {
  const session = await requireSession();
  const rl = checkRateLimit(`mfa-recovery:${session.userId}`, { limit: 8, windowMs: 5 * 60_000, blockMs: 10 * 60_000 });
  if (!rl.ok) return { error: retryMessage(rl.retryAfter) };
  const totp = await getUserTotp(session.userId).catch(() => null);
  if (!totp?.enabled) return { error: "Two-factor isn't on." };
  if (!(await verifyUserMfaCode(session.userId, code))) return { error: "That code didn't match." };
  const codes = generateRecoveryCodes(10);
  await replaceRecoveryCodes(session.userId, codes.map(hashRecoveryCode));
  await recordAudit(session, "mfa_recovery_regen", "user", session.userId);
  return { recoveryCodes: codes };
}
