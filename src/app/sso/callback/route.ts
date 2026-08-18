import { NextResponse, type NextRequest } from "next/server";
import { verifySsoCode } from "@/lib/auth/sso";
import { issueSession } from "@/lib/auth/session";
import { createMfaChallengeCookie } from "@/lib/auth/mfa-challenge";
import { getUserByEmail, setUserLastLogin, writeAudit } from "@/lib/db";
import { SSO_STATE_COOKIE } from "@/lib/auth/constants";

// Finish SSO: verify the CSRF state + the handoff code, match an EXISTING active
// CRM user by email (never auto-create), then start a normal CRM session.

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const origin = req.nextUrl.origin;
  const clearState = (res: NextResponse) => {
    res.cookies.set(SSO_STATE_COOKIE, "", { path: "/", maxAge: 0 });
    return res;
  };
  const fail = (reason: string) => clearState(NextResponse.redirect(new URL(`/login?error=${reason}`, origin)));

  const code = req.nextUrl.searchParams.get("code") ?? "";
  const state = req.nextUrl.searchParams.get("state") ?? "";
  const cookieState = req.cookies.get(SSO_STATE_COOKIE)?.value ?? "";

  // CSRF: the code is only accepted alongside the state we set in /sso/start.
  if (!state || !cookieState || state !== cookieState) return fail("sso");

  const identity = verifySsoCode(code);
  if (!identity) return fail("sso");

  const user = await getUserByEmail(identity.email).catch(() => null);
  if (!user || user.status !== "active") return fail("no_account");

  // If this account has 2FA on, DON'T issue a session here — the upstream IdP
  // can't be trusted to have performed the CRM's second factor, and the handoff
  // carries no MFA claim. Issue the same challenge the password path does and
  // send the user to the TOTP step, so CRM 2FA holds regardless of the IdP.
  if (user.totp_enabled) {
    const c = await createMfaChallengeCookie(user.id);
    const res = clearState(NextResponse.redirect(new URL("/login?mfa=1", origin)));
    res.cookies.set(c.name, c.value, c.options);
    return res;
  }

  const session = await issueSession(user.id, user.organization_id);
  await setUserLastLogin(user.id).catch(() => {});
  await writeAudit({
    organizationId: user.organization_id,
    userId: user.id,
    actorEmail: user.email,
    action: "login_sso",
    entity: "user",
    entityId: user.id,
    summary: "via Sajtpress SSO",
  }).catch(() => {});

  const res = NextResponse.redirect(new URL("/", origin));
  res.cookies.set(session.name, session.value, session.options);
  return clearState(res);
}
