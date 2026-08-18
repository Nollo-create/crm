"use server";

import { redirect } from "next/navigation";
import { headers, cookies } from "next/headers";
import { countUsers, createOrganization, createUser, getUserByEmail, getUserById, setUserLastLogin, createMfaChallenge, getMfaChallenge, deleteMfaChallenge } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { startSession, endSession, getSession } from "@/lib/auth/session";
import { generateSessionToken, hashToken } from "@/lib/auth/tokens";
import { MFA_COOKIE, MFA_CHALLENGE_TTL_MIN } from "@/lib/auth/constants";
import { verifyUserMfaCode } from "@/lib/auth/mfa-verify";
import { recordAuthEvent } from "@/lib/auth/audit";
import { checkRateLimit, resetRateLimit, retryMessage } from "@/lib/rate-limit";
import { integration } from "@/lib/config";

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

async function issueMfaChallenge(userId: number): Promise<void> {
  const token = generateSessionToken();
  const expiresAt = new Date(Date.now() + MFA_CHALLENGE_TTL_MIN * 60_000);
  await createMfaChallenge(userId, hashToken(token), expiresAt);
  const jar = await cookies();
  jar.set(MFA_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
    domain: integration.cookieDomain || undefined,
  });
}

export async function loginAction(input: { email: string; password: string }): Promise<{ ok?: true; mfaRequired?: true; error?: string }> {
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

  // Password step passed — clear this user's/IP's counters so earlier fumbles
  // don't linger. (The 2FA step below has its own limiter.)
  resetRateLimit(emailKey);
  resetRateLimit(ipKey);

  // If this account has 2FA on, DON'T start a session yet — issue a short-lived
  // challenge and require the code. Accounts without 2FA follow the original path.
  if (user.totp_enabled) {
    await issueMfaChallenge(user.id);
    return { mfaRequired: true };
  }

  await startSession(user.id, user.organization_id);
  await setUserLastLogin(user.id).catch(() => {});
  await recordAuthEvent({ organizationId: user.organization_id, userId: user.id, actorEmail: user.email, action: "login" });
  return { ok: true };
}

/** Step 2 of login for 2FA accounts: verify the authenticator (or recovery) code
 *  against the pending challenge, then start the real session. */
export async function verifyLoginMfaAction(input: { code: string }): Promise<{ ok?: true; error?: string }> {
  const jar = await cookies();
  const raw = jar.get(MFA_COOKIE)?.value;
  if (!raw) return { error: "Your sign-in step expired — please sign in again." };

  const ip = await clientIp();
  const ipRl = checkRateLimit(`mfa-login:ip:${ip}`, { limit: 12, windowMs: 5 * 60_000, blockMs: 15 * 60_000 });
  if (!ipRl.ok) return { error: retryMessage(ipRl.retryAfter) };

  const tokenHash = hashToken(raw);
  const challenge = await getMfaChallenge(tokenHash).catch(() => null);
  if (!challenge) {
    jar.delete(MFA_COOKIE);
    return { error: "Your sign-in step expired — please sign in again." };
  }
  const user = await getUserById(challenge.userId).catch(() => null);
  if (!user || user.status !== "active") {
    await deleteMfaChallenge(tokenHash).catch(() => {});
    jar.delete(MFA_COOKIE);
    return { error: "Please sign in again." };
  }

  const userRl = checkRateLimit(`mfa-login:user:${user.id}`, { limit: 8, windowMs: 5 * 60_000, blockMs: 15 * 60_000 });
  if (!userRl.ok) return { error: retryMessage(userRl.retryAfter) };

  if (!(await verifyUserMfaCode(user.id, input.code))) {
    await recordAuthEvent({ organizationId: user.organization_id, userId: user.id, actorEmail: user.email, action: "login_failed", summary: "wrong 2FA code" });
    return { error: "That code didn't match. Try again." };
  }

  await deleteMfaChallenge(tokenHash).catch(() => {});
  jar.delete(MFA_COOKIE);
  await startSession(user.id, user.organization_id);
  await setUserLastLogin(user.id).catch(() => {});
  await recordAuthEvent({ organizationId: user.organization_id, userId: user.id, actorEmail: user.email, action: "login", summary: "with 2FA" });
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
