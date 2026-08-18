"use server";

import { requireSession, getCurrentSessionId } from "@/lib/auth/session";
import { getUserById, updateUserPassword, revokeOtherSessions } from "@/lib/db";
import { verifyPassword, hashPassword } from "@/lib/auth/password";
import { recordAudit } from "@/lib/auth/audit";
import { checkRateLimit, retryMessage } from "@/lib/rate-limit";

/** Change the signed-in user's password. Requires the current password (step-up),
 *  and signs out every other device on success. */
export async function changePasswordAction(input: { current: string; next: string }): Promise<{ ok?: true; error?: string }> {
  const session = await requireSession();
  const rl = checkRateLimit(`pwchange:${session.userId}`, { limit: 8, windowMs: 10 * 60_000, blockMs: 15 * 60_000 });
  if (!rl.ok) return { error: retryMessage(rl.retryAfter) };

  const user = await getUserById(session.userId).catch(() => null);
  if (!user) return { error: "Please sign in again." };
  if (!(await verifyPassword(input.current || "", user.password_hash))) return { error: "Your current password is incorrect." };

  const next = input.next || "";
  if (next.length < 8) return { error: "New password must be at least 8 characters." };
  if (next === input.current) return { error: "Choose a password different from your current one." };

  await updateUserPassword(session.userId, await hashPassword(next));
  // Sign out other devices — a password change should invalidate them.
  const keep = (await getCurrentSessionId()) ?? 0;
  const revoked = await revokeOtherSessions(session.userId, keep).catch(() => 0);
  await recordAudit(session, "password_change", "user", session.userId, revoked ? `${revoked} other session${revoked === 1 ? "" : "s"} signed out` : "");
  return { ok: true };
}
