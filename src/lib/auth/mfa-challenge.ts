import "server-only";
import { cookies } from "next/headers";
import { createMfaChallenge } from "@/lib/db";
import { generateSessionToken, hashToken } from "@/lib/auth/tokens";
import { MFA_COOKIE, MFA_CHALLENGE_TTL_MIN } from "@/lib/auth/constants";
import { integration } from "@/lib/config";

// Second-factor login challenge, shared by the password-login path
// (actions/auth.ts) and the SSO callback so a 2FA-enrolled user is ALWAYS forced
// through the TOTP step before a session is minted — whichever door they came
// in. Not a server action (plain server-only helper), so the client can't invoke
// it with an arbitrary userId.

export interface MfaChallengeCookie {
  name: string;
  value: string;
  options: {
    httpOnly: true;
    secure: boolean;
    sameSite: "lax";
    path: string;
    expires: Date;
    domain: string | undefined;
  };
}

/** Create the challenge row and return the cookie descriptor. Route handlers set
 *  it on the NextResponse (like issueSession); server actions use the wrapper
 *  below. */
export async function createMfaChallengeCookie(userId: number): Promise<MfaChallengeCookie> {
  const token = generateSessionToken();
  const expiresAt = new Date(Date.now() + MFA_CHALLENGE_TTL_MIN * 60_000);
  await createMfaChallenge(userId, hashToken(token), expiresAt);
  return {
    name: MFA_COOKIE,
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

/** Server-action variant: issue the challenge and set the cookie via the jar. */
export async function issueMfaChallenge(userId: number): Promise<void> {
  const { name, value, options } = await createMfaChallengeCookie(userId);
  const jar = await cookies();
  jar.set(name, value, options);
}
