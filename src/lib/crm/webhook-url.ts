// Guard for the optional outbound security-alert webhook (master-prompt #5).
// The URL is owner-supplied, so a naive fetch would be an SSRF vector (hit the
// cloud metadata endpoint, an internal service, localhost…). We only allow
// https to a public host. Pure + unit-tested; the sender calls this before every
// POST and also passes redirect:"error" so a 3xx can't bounce inward.

export type WebhookCheck = { ok: true } | { ok: false; reason: string };

// Private / loopback / link-local / metadata ranges we must never call.
function isBlockedHost(host: string): boolean {
  const h = host.toLowerCase();
  if (h === "localhost" || h.endsWith(".localhost") || h.endsWith(".local") || h.endsWith(".internal")) return true;
  if (h === "metadata" || h === "metadata.google.internal") return true;

  // IPv6 loopback / unspecified / unique-local / link-local
  if (h === "[::1]" || h === "::1" || h === "[::]" || h === "::") return true;
  if (h.startsWith("[fc") || h.startsWith("[fd") || h.startsWith("[fe80")) return true;

  // IPv4 literal → range-check
  const m = h.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (m) {
    const [a, b] = [Number(m[1]), Number(m[2])];
    if (a === 10) return true; // 10.0.0.0/8
    if (a === 127) return true; // loopback
    if (a === 0) return true; // 0.0.0.0/8
    if (a === 169 && b === 254) return true; // link-local + 169.254.169.254 metadata
    if (a === 172 && b >= 16 && b <= 31) return true; // 172.16.0.0/12
    if (a === 192 && b === 168) return true; // 192.168.0.0/16
    if (a === 100 && b >= 64 && b <= 127) return true; // CGNAT 100.64.0.0/10
    if (a >= 224) return true; // multicast / reserved
  }
  return false;
}

/** Validate an owner-supplied webhook URL. https + public host only. */
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
  if (!u.hostname) return { ok: false, reason: "The URL needs a host." };
  if (isBlockedHost(u.hostname)) return { ok: false, reason: "That host isn't allowed (internal or private address)." };
  return { ok: true };
}
