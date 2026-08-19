import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/lib/auth/constants";

// Two jobs, both per-request:
//  1. A coarse auth gate — is a session cookie present? The real, DB-backed check
//     happens in the (crm) layout via requireSession().
//  2. A per-request Content-Security-Policy with a fresh nonce. The nonce is
//     forwarded on the request headers so Next tags its own bootstrap scripts,
//     and passed to next-themes in the root layout for its inline theme script.
// Runs on the Edge runtime, so no Node-only imports (crypto.randomUUID + btoa are
// Web-standard globals; the session constant is dependency-free).

const PUBLIC = ["/login", "/setup", "/sso", "/f", "/q"];

function isPublicPath(pathname: string): boolean {
  return (
    PUBLIC.some((p) => pathname === p || pathname.startsWith(`${p}/`)) ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname === "/favicon.ico" ||
    // App Router metadata assets must load on the public /login page too.
    /^\/(icon|apple-icon|opengraph-image|twitter-image)\.\w+$/.test(pathname) ||
    pathname === "/manifest.webmanifest"
  );
}

function buildCsp(nonce: string, frameable = false): string {
  const prod = process.env.NODE_ENV === "production";
  // Prod: strict — scripts must carry the nonce; strict-dynamic lets those load
  // the chunked bundles. Dev: relaxed so Next's HMR (eval + inline) keeps working.
  const scriptSrc = prod ? `'self' 'nonce-${nonce}' 'strict-dynamic'` : `'self' 'unsafe-inline' 'unsafe-eval'`;
  return [
    `default-src 'self'`,
    `script-src ${scriptSrc}`,
    // Inline styles: next/font @font-face + component style attributes.
    `style-src 'self' 'unsafe-inline'`,
    `img-src 'self' data: blob:`,
    `font-src 'self' data:`,
    `connect-src 'self'`,
    `object-src 'none'`,
    `base-uri 'self'`,
    `form-action 'self'`,
    // Public lead-capture pages (/f/*) are embeddable on client sites; everything
    // else stays un-framable. These pages carry no session and no sensitive data.
    `frame-ancestors ${frameable ? "*" : "'none'"}`,
    `frame-src 'none'`,
    `upgrade-insecure-requests`,
  ].join("; ");
}

export function middleware(req: NextRequest): NextResponse {
  const { pathname } = req.nextUrl;

  const nonce = btoa(crypto.randomUUID());
  const frameable = pathname === "/f" || pathname.startsWith("/f/");
  const csp = buildCsp(nonce, frameable);

  // Auth gate for protected routes.
  if (!isPublicPath(pathname) && !req.cookies.has(SESSION_COOKIE)) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    const redirectRes = NextResponse.redirect(url);
    redirectRes.headers.set("Content-Security-Policy", csp);
    return redirectRes;
  }

  // Forward the nonce + CSP on the request so Next can nonce its scripts, and set
  // the CSP on the response so the browser enforces it.
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);

  const res = NextResponse.next({ request: { headers: requestHeaders } });
  res.headers.set("Content-Security-Policy", csp);
  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
