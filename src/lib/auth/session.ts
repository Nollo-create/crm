import "server-only";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { generateSessionToken, hashToken, SESSION_COOKIE, SESSION_TTL_DAYS } from "./tokens";
import { toRole, can, type Role } from "./rbac";
import { createSession, deleteSessionByTokenHash, getSessionByTokenHash, getUserById, touchSession } from "@/lib/db";
import { clientIpFromHeaders } from "@/lib/net/client-ip";
import { integration } from "@/lib/config";

/** Best-effort IP + user agent for the current request (empty outside one). */
async function sessionRequestContext(): Promise<{ ip: string; userAgent: string }> {
  try {
    const h = await headers();
    const ip0 = clientIpFromHeaders(h);
    const ip = (ip0 === "unknown" ? "" : ip0).slice(0, 45);
    return { ip, userAgent: (h.get("user-agent") || "").slice(0, 255) };
  } catch {
    return { ip: "", userAgent: "" };
  }
}

// The session boundary. A DB-backed opaque token in an httpOnly cookie; the
// cookie holds the raw token, the DB holds only its SHA-256. Everything that
// needs "who is calling" goes through getSession()/requireSession() — never the
// cookie directly.

export interface SessionUser {
  userId: number;
  organizationId: number;
  email: string;
  name: string;
  role: Role;
}

/** Read and validate the current session (cookie -> DB). null if missing, expired
 *  or the user is gone/disabled. */
export async function getSession(): Promise<SessionUser | null> {
  const jar = await cookies();
  const raw = jar.get(SESSION_COOKIE)?.value;
  if (!raw) return null;
  const tokenHash = hashToken(raw);
  const row = await getSessionByTokenHash(tokenHash).catch(() => null);
  if (!row) return null;
  const user = await getUserById(row.user_id).catch(() => null);
  if (!user || user.status !== "active") return null;
  // Refresh "last active" at most every ~5 minutes (not a write per request).
  const lastUsed = row.last_used_at ? new Date(row.last_used_at).getTime() : 0;
  if (Date.now() - lastUsed > 5 * 60_000) void touchSession(tokenHash);
  return {
    userId: user.id,
    organizationId: user.organization_id,
    email: user.email,
    name: user.name,
    role: toRole(user.role),
  };
}

/** For protected server components: return the session or redirect to /login. */
export async function requireSession(): Promise<SessionUser> {
  const session = await getSession();
  if (!session) redirect("/login");
  return session;
}

/** Write gate for mutating actions: the session, or an error a read-only (viewer)
 *  role gets back. Server-side authorization — the UI hiding buttons is not it. */
export async function guardWrite(): Promise<{ session: SessionUser } | { error: string }> {
  const session = await requireSession();
  if (!can(session.role, "record:write")) return { error: "Your role is read-only — ask an admin for edit access." };
  return { session };
}

export interface IssuedSession {
  name: string;
  value: string;
  options: {
    httpOnly: true;
    secure: boolean;
    sameSite: "lax";
    path: string;
    expires: Date;
    domain?: string;
  };
}

/** Create the session row + return the cookie to set. Lets a Route Handler set
 *  it on its own NextResponse (where next/headers cookies() wouldn't apply). */
export async function issueSession(userId: number, organizationId: number): Promise<IssuedSession> {
  const token = generateSessionToken();
  const expiresAt = new Date(Date.now() + SESSION_TTL_DAYS * 86_400_000);
  const ctx = await sessionRequestContext();
  await createSession({ userId, organizationId, tokenHash: hashToken(token), expiresAt, ip: ctx.ip, userAgent: ctx.userAgent });
  return {
    name: SESSION_COOKIE,
    value: token,
    options: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      expires: expiresAt,
      domain: integration.cookieDomain || undefined,
    },
  };
}

/** Mint a session and set the cookie. Call only from a Server Action / Route Handler. */
export async function startSession(userId: number, organizationId: number): Promise<void> {
  const { name, value, options } = await issueSession(userId, organizationId);
  const jar = await cookies();
  jar.set(name, value, options);
}

/** Revoke the current session (DB + cookie). */
export async function endSession(): Promise<void> {
  const jar = await cookies();
  const raw = jar.get(SESSION_COOKIE)?.value;
  if (raw) await deleteSessionByTokenHash(hashToken(raw)).catch(() => {});
  jar.delete(SESSION_COOKIE);
}

/** The DB id of the session behind the current cookie — so the sessions view can
 *  mark "this device" and "log out others" can keep it. null if not signed in. */
export async function getCurrentSessionId(): Promise<number | null> {
  const jar = await cookies();
  const raw = jar.get(SESSION_COOKIE)?.value;
  if (!raw) return null;
  const row = await getSessionByTokenHash(hashToken(raw)).catch(() => null);
  return row?.id ?? null;
}
