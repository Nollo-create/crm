import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { generateSessionToken, hashToken, SESSION_COOKIE, SESSION_TTL_DAYS } from "./tokens";
import { toRole, type Role } from "./rbac";
import { createSession, deleteSessionByTokenHash, getSessionByTokenHash, getUserById } from "@/lib/db";
import { integration } from "@/lib/config";

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
  const row = await getSessionByTokenHash(hashToken(raw)).catch(() => null);
  if (!row) return null;
  const user = await getUserById(row.user_id).catch(() => null);
  if (!user || user.status !== "active") return null;
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
  await createSession({ userId, organizationId, tokenHash: hashToken(token), expiresAt });
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
