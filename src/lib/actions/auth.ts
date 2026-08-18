"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { countUsers, createOrganization, createUser, getUserByEmail, setUserLastLogin } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { startSession, endSession, getSession } from "@/lib/auth/session";
import { recordAuthEvent } from "@/lib/auth/audit";
import { checkRateLimit, resetRateLimit, retryMessage } from "@/lib/rate-limit";

/** Best-effort client IP from the proxy chain (cPanel/Passenger sets these). */
async function clientIp(): Promise<string> {
  const h = await headers();
  const fwd = h.get("x-forwarded-for");
  return (fwd ? fwd.split(",")[0].trim() : "") || h.get("x-real-ip") || "unknown";
}

// A dummy hash to verify against when no user matches, so login timing doesn't
// reveal whether an email exists.
const DUMMY_HASH = "scrypt$16384$8$1$AAAAAAAAAAAAAAAAAAAAAA==$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=";

function slugify(s: string): string {
  return (
    s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 120) || "org"
  );
}
const validEmail = (e: string) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e);

/** First-run bootstrap: create the first organization + owner. Allowed only
 *  while the instance has zero users. */
export async function setupAction(input: { orgName: string; name: string; email: string; password: string }): Promise<{ ok?: true; error?: string }> {
  // Setup is one-time, but throttle it anyway so it can't be hammered pre-owner.
  const ip = await clientIp();
  const rl = checkRateLimit(`setup:ip:${ip}`, { limit: 5, windowMs: 60 * 60_000, blockMs: 30 * 60_000 });
  if (!rl.ok) return { error: retryMessage(rl.retryAfter) };

  let n: number;
  try {
    n = await countUsers();
  } catch {
    return { error: "Database not reachable — check the server configuration." };
  }
  if (n > 0) return { error: "Setup has already been completed. Please sign in." };

  const orgName = input.orgName.trim();
  const email = input.email.trim().toLowerCase();
  if (!orgName) return { error: "Organization name is required." };
  if (!validEmail(email)) return { error: "Enter a valid email address." };
  if (input.password.length < 8) return { error: "Password must be at least 8 characters." };

  const orgId = await createOrganization(orgName, slugify(orgName));
  const passwordHash = await hashPassword(input.password);
  const userId = await createUser({ organizationId: orgId, email, name: input.name.trim(), passwordHash, role: "owner" });
  await startSession(userId, orgId);
  await recordAuthEvent({ organizationId: orgId, userId, actorEmail: email, action: "setup", summary: `created organization ${orgName}` });
  return { ok: true };
}

export async function loginAction(input: { email: string; password: string }): Promise<{ ok?: true; error?: string }> {
  const email = input.email.trim().toLowerCase();

  // Brute-force protection: throttle by IP (credential stuffing) and by email
  // (targeted). Generous enough that a real person mistyping never notices.
  const ip = await clientIp();
  const ipKey = `login:ip:${ip}`;
  const emailKey = `login:email:${email}`;
  const ipRl = checkRateLimit(ipKey, { limit: 15, windowMs: 5 * 60_000, blockMs: 15 * 60_000 });
  if (!ipRl.ok) return { error: retryMessage(ipRl.retryAfter) };
  const emRl = checkRateLimit(emailKey, { limit: 8, windowMs: 5 * 60_000, blockMs: 15 * 60_000 });
  if (!emRl.ok) return { error: retryMessage(emRl.retryAfter) };

  let user;
  try {
    user = await getUserByEmail(email);
  } catch {
    return { error: "Database not reachable — check the server configuration." };
  }
  // Always run a verify to keep timing uniform whether or not the user exists.
  const ok = await verifyPassword(input.password, user?.password_hash ?? DUMMY_HASH);
  if (!user || !ok) {
    // Record a failed attempt only against a real account (we then know the org);
    // unknown emails are left unlogged to avoid enumeration noise.
    if (user && !ok) {
      await recordAuthEvent({ organizationId: user.organization_id, userId: user.id, actorEmail: user.email, action: "login_failed", summary: "wrong password" });
    }
    return { error: "Invalid email or password." };
  }

  // Success: clear this user's/IP's counters so earlier fumbles don't linger.
  resetRateLimit(emailKey);
  resetRateLimit(ipKey);
  await startSession(user.id, user.organization_id);
  await setUserLastLogin(user.id).catch(() => {});
  await recordAuthEvent({ organizationId: user.organization_id, userId: user.id, actorEmail: user.email, action: "login" });
  return { ok: true };
}

export async function logoutAction(): Promise<void> {
  const session = await getSession().catch(() => null);
  if (session) {
    await recordAuthEvent({ organizationId: session.organizationId, userId: session.userId, actorEmail: session.email, action: "logout" });
  }
  await endSession();
  redirect("/login");
}
