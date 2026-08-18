import { lookup } from "node:dns/promises";
import { insertSecurityAlert, getOrgSecurityWebhook, type SecurityAlertInput } from "@/lib/db";
import { isSafeWebhookUrl, isBlockedIp, webhookHostname } from "@/lib/crm/webhook-url";

// Active security alerts (master-prompt #5). A high-severity security event
// (MFA turned off, admin granted, API key minted, emergency switch flipped…)
// is persisted so an owner can see and acknowledge it, and — if the org has
// configured an outbound webhook — pushed there in real time (Slack/Discord/
// PagerDuty/an email gateway; the CRM has no native SMTP of its own).
//
// Every step is best-effort: recording or delivering an alert must NEVER block
// or fail the security action that triggered it.

const WEBHOOK_TIMEOUT_MS = 4000;

export async function recordSecurityAlert(orgId: number, alert: SecurityAlertInput): Promise<void> {
  try {
    await insertSecurityAlert(orgId, alert);
  } catch {
    // swallow — persistence is best-effort
  }
  try {
    await pushToWebhook(orgId, alert);
  } catch {
    // swallow — delivery is best-effort
  }
}

async function pushToWebhook(orgId: number, alert: SecurityAlertInput): Promise<void> {
  const url = await getOrgSecurityWebhook(orgId).catch(() => "");
  if (!url) return; // channel not configured → off
  if (!isSafeWebhookUrl(url).ok) return; // fast string pre-check
  // Authoritative SSRF check: resolve the host and refuse if ANY resolved
  // address is private/loopback/link-local/metadata. A string blocklist alone
  // can't stop "public-hostname → private-IP"; this can.
  const host = webhookHostname(url);
  if (!host) return;
  try {
    const addrs = await lookup(host, { all: true });
    if (addrs.length === 0 || addrs.some((a) => isBlockedIp(a.address))) return;
  } catch {
    return; // can't resolve safely → don't send
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), WEBHOOK_TIMEOUT_MS);
  try {
    await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        source: "sajtpress-crm",
        type: alert.type,
        severity: alert.severity,
        message: alert.message,
        actor: alert.actorEmail ?? "",
        meta: alert.meta ?? "",
        at: new Date().toISOString(),
      }),
      redirect: "error", // a 3xx must not bounce the request to an internal host
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timer);
  }
}
