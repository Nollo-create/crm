// Guard for the optional outbound security-alert webhook (master-prompt #5).
// The URL is owner-supplied, so a naive fetch would be an SSRF vector (hit the
// cloud metadata endpoint, an internal service, localhost…). A string blocklist
// alone is NOT enough — a hostname can resolve to a private IP — so this module
// provides both a fast pure string check (isSafeWebhookUrl, for early UI
// feedback) AND a reusable per-IP range check (isBlockedIp) that the sender runs
// against every DNS-resolved address before it dials. Pure + unit-tested; the
// sender adds redirect:"error" so a 3xx can't bounce inward.

export type WebhookCheck = { ok: true } | { ok: false; reason: string };

/** True if a resolved/literal IP is in a range we must never call. Handles IPv4,
 *  IPv6 loopback/ULA/link-local, and IPv4-mapped IPv6 (::ffff:a.b.c.d / hex). */
export function isBlockedIp(ip: string): boolean {
  let h = (ip || "").trim().toLowerCase();
  // Strip brackets and IPv6 zone id.
  h = h.replace(/^\[|\]$/g, "").split("%")[0];

  // IPv4-mapped / -embedded IPv6 → extract the v4 tail and range-check it.
  // ::ffff:127.0.0.1  or  ::ffff:7f00:1  or  64:ff9b::7f00:1 (NAT64).
  if (h.includes(":")) {
    const dotted = h.match(/(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})$/);
    if (dotted) return isBlockedIp(dotted[1]);
    const hex = h.match(/:([0-9a-f]{1,4}):([0-9a-f]{1,4})$/);
    if (hex && (h.startsWith("::ffff:") || h.startsWith("::") || h.startsWith("64:ff9b:"))) {
      const a = parseInt(hex[1], 16), b = parseInt(hex[2], 16);
      const v4 = `${a >> 8}.${a & 255}.${b >> 8}.${b & 255}`;
      if (isBlockedIp(v4)) return true;
    }
    // Pure IPv6: loopback/unspecified/ULA(fc/fd)/link-local(fe80::/10)/
    // site-local(fec0::/10, deprecated)/multicast(ff).
    if (h === "::1" || h === "::") return true;
    if (h.startsWith("fc") || h.startsWith("fd") || h.startsWith("ff")) return true;
    if (h.startsWith("fe8") || h.startsWith("fe9") || h.startsWith("fea") || h.startsWith("feb")) return true; // fe80::/10
    if (h.startsWith("fec") || h.startsWith("fed") || h.startsWith("fee") || h.startsWith("fef")) return true; // fec0::/10
    return false;
  }

  const m = h.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (!m) return false; // not an IP literal
  const [a, b] = [Number(m[1]), Number(m[2])];
  if ([a, b, Number(m[3]), Number(m[4])].some((n) => n > 255)) return true; // malformed → refuse
  if (a === 0) return true; // 0.0.0.0/8
  if (a === 10) return true; // 10.0.0.0/8
  if (a === 127) return true; // loopback
  if (a === 169 && b === 254) return true; // link-local + 169.254.169.254 metadata
  if (a === 172 && b >= 16 && b <= 31) return true; // 172.16.0.0/12
  if (a === 192 && b === 168) return true; // 192.168.0.0/16
  if (a === 192 && b === 0 && Number(m[3]) === 0) return true; // 192.0.0.0/24 special-use (incl. Oracle metadata 192.0.0.192)
  if (a === 100 && b >= 64 && b <= 127) return true; // CGNAT 100.64.0.0/10
  if (a >= 224) return true; // multicast / reserved
  return false;
}

// Literal internal hostnames (a trailing dot is stripped before comparison).
function isBlockedHostname(host: string): boolean {
  const h = host.toLowerCase().replace(/\.+$/, ""); // strip FQDN-root trailing dot(s)
  if (!h) return true;
  if (h === "localhost" || h.endsWith(".localhost") || h.endsWith(".local") || h.endsWith(".internal")) return true;
  if (h === "metadata" || h.endsWith(".metadata.google.internal") || h === "metadata.google.internal") return true;
  return isBlockedIp(h); // catches bracketed/plain IP literals incl. IPv4-mapped IPv6
}

/** Fast, pure pre-check on an owner-supplied webhook URL: https + not an obvious
 *  internal host. NOTE: this does NOT resolve DNS — the sender must additionally
 *  resolve the host and run isBlockedIp on every address (see security/alerts). */
export function isSafeWebhookUrl(raw: string): WebhookCheck {
  const value = (raw || "").trim();
  if (!value) return { ok: false, reason: "Enter a URL." };
  let u: URL;
  try {
    u = new URL(value);
  } catch {
    return { ok: false, reason: "That isn't a valid URL." };
  }
  if (u.protocol !== "https:") return { ok: false, reason: "Use an https:// URL." };
  if (u.username || u.password) return { ok: false, reason: "Remove credentials from the URL." };
  const host = u.hostname.replace(/^\[|\]$/g, "");
  if (!host) return { ok: false, reason: "The URL needs a host." };
  if (isBlockedHostname(host)) return { ok: false, reason: "That host isn't allowed (internal or private address)." };
  return { ok: true };
}

/** The hostname a caller must DNS-resolve before sending (bracket/zone stripped). */
export function webhookHostname(raw: string): string | null {
  try {
    return new URL(raw).hostname.replace(/^\[|\]$/g, "").replace(/\.+$/, "") || null;
  } catch {
    return null;
  }
}
