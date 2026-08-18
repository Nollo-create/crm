// SSRF guard for the one server-to-server seam (the CRM -> webapp internal API).
// Pure so it unit-tests: given the configured webapp base and a code-defined
// path, it returns a URL only if it resolves onto the SAME origin and an
// /api/internal/* path — otherwise null (caller then skips the fetch).
//
// The CRM never fetches a user- or AI-supplied URL today; this keeps that true
// even if a future caller passes something dynamic (absolute URL, `//host`, a
// non-slash path that pivots the host off a trailing-slash-less base, a redirect
// off-origin — the fetch itself also uses redirect:"error").

export function buildInternalUrl(webappBase: string, path: string): string | null {
  try {
    const base = new URL(webappBase);
    if (base.protocol !== "https:" && base.protocol !== "http:") return null;
    if (typeof path !== "string" || !path.startsWith("/") || path.startsWith("//")) return null;
    const url = new URL(path, base);
    if (url.origin !== base.origin) return null;
    if (!url.pathname.startsWith("/api/internal/")) return null;
    return url.toString();
  } catch {
    return null;
  }
}
