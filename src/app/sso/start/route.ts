import { NextResponse, type NextRequest } from "next/server";
import { randomBytes } from "crypto";
import { integration, isConnected } from "@/lib/config";
import { SSO_STATE_COOKIE } from "@/lib/auth/constants";

// Begin "Continue with Sajtpress": set a per-session CSRF `state` cookie and
// hand off to the webapp's authorize endpoint.

export const dynamic = "force-dynamic";

export function GET(req: NextRequest) {
  if (!isConnected(integration)) {
    return NextResponse.redirect(new URL("/login", req.nextUrl.origin));
  }
  const state = randomBytes(16).toString("base64url");
  const authorize = new URL(`${integration.webappUrl}/sso/authorize`);
  authorize.searchParams.set("state", state);

  const res = NextResponse.redirect(authorize);
  res.cookies.set(SSO_STATE_COOKIE, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 300,
  });
  return res;
}
