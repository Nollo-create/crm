// Trusted-proxy-aware client IP (audit SEC-10).
//
// The LEFT-most X-Forwarded-For entry is whatever the client sent — fully
// spoofable. The address the closest trusted proxy actually observed sits
// `TRUSTED_PROXY_HOPS` positions from the RIGHT (the proxy appends the real peer
// IP). On cPanel/Passenger there is one proxy (Apache/nginx) in front, so the
// default (1) picks the last XFF entry. Set TRUSTED_PROXY_HOPS higher if a CDN
// or extra proxy sits in front.
//
// This IP is used ONLY for rate-limit keys and audit logging — never for an
// authorization decision — so a wrong value degrades throttling/logging, it
// never grants access.

const DEFAULT_HOPS = Math.max(1, Number(process.env.TRUSTED_PROXY_HOPS) || 1);

/** Pure: resolve the client IP from the forwarding headers. `hops` = number of
 *  trusted proxies in front (indexes the XFF chain from the right). */
export function pickClientIp(
  forwardedFor: string | null | undefined,
  realIp: string | null | undefined,
  hops: number = DEFAULT_HOPS
): string {
  const chain = (forwardedFor ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  if (chain.length) {
    const idx = Math.max(0, chain.length - Math.max(1, hops));
    if (chain[idx]) return chain[idx];
  }
  const real = (realIp ?? "").trim();
  return real || "unknown";
}

/** Convenience for a WHATWG Headers-like object. */
export function clientIpFromHeaders(h: { get(name: string): string | null }): string {
  return pickClientIp(h.get("x-forwarded-for"), h.get("x-real-ip"));
}
