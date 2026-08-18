import { getUserById, getUserTotp } from "@/lib/db";
import { verifyPassword } from "@/lib/auth/password";
import { verifyUserMfaCode } from "@/lib/auth/mfa-verify";

// Step-up re-authentication (master-prompt #4). Some actions are sensitive
// enough that an already-open session shouldn't be enough — we re-verify the
// human at the moment of the action. If they have MFA on, we require a fresh
// authenticator (or recovery) code; otherwise their account password. A hijacked
// session alone can't complete a step-up action.

export type StepUpKind = "code" | "password";

/** What credential the UI should ask for, so the prompt matches what the user has. */
export async function stepUpKind(userId: number): Promise<StepUpKind> {
  const totp = await getUserTotp(userId).catch(() => null);
  return totp?.enabled ? "code" : "password";
}

/** Re-verify the acting user. Returns null on success, else a user-facing error. */
export async function verifyStepUp(userId: number, credential: string): Promise<string | null> {
  const totp = await getUserTotp(userId).catch(() => null);
  if (totp?.enabled) {
    if (!credential) return "Enter a code from your authenticator to confirm.";
    return (await verifyUserMfaCode(userId, credential)) ? null : "That code didn't match.";
  }
  const user = await getUserById(userId).catch(() => null);
  if (!user) return "Could not verify your identity.";
  if (!credential) return "Enter your password to confirm.";
  return (await verifyPassword(credential, user.password_hash)) ? null : "That password didn't match.";
}
