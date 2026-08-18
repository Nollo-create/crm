import { lookup } from "node:dns/promises";
import { request as httpsRequest } from "node:https";
import { insertSecurityAlert, getOrgSecurityWebhook, type SecurityAlertInput } from "@/lib/db";
import { isSafeWebhookUrl, isBlockedIp } from "@/lib/crm/webhook-url";

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
  const raw = await getOrgSecurityWebhook(orgId).catch(() => "");
  if (!raw) return; // channel not configured → off
  if (!isSafeWebhookUrl(raw).ok) return; // fast string pre-check (https + not a literal internal host)

  let u: URL;
  try {
    u = new URL(raw);
  } catch {
    return;
  }
  const host = u.hostname.replace(/^\[|\]$/g, "").replace(/\.+$/, "");
  if (!host) return;

  // Resolve ONCE, validate every address, then PIN the connection to the
  // validated IP. Passing the hostname to fetch() would let undici re-resolve at
  // connect time, so a rebinding DNS (public at check, private at connect) could
  // still reach an internal host. Dialing the checked IP directly — with SNI +
  // cert validation against the real hostname — closes that window.
  let addrs: { address: string; family: number }[];
  try {
    addrs = await lookup(host, { all: true });
  } catch {
    return; // can't resolve safely → don't send
  }
  if (addrs.length === 0 || addrs.some((a) => isBlockedIp(a.address))) return;
  const target = addrs[0];

  const body = JSON.stringify({
    source: "sajtpress-crm",
    type: alert.type,
    severity: alert.severity,
    message: alert.message,
    actor: alert.actorEmail ?? "",
    meta: alert.meta ?? "",
    at: new Date().toISOString(),
  });

  await new Promise<void>((resolve) => {
    let settled = false;
    const done = () => {
      if (settled) return;
      settled = true;
      resolve();
    };
    const req = httpsRequest(
      {
        host: target.address, // dial the validated IP — no second DNS resolution
        family: target.family,
        servername: host, // TLS SNI + certificate identity checked against the real host
        port: u.port ? Number(u.port) : 443,
        method: "POST",
        path: (u.pathname || "/") + (u.search || ""),
        headers: {
          host: u.host,
          "content-type": "application/json",
          "content-length": Buffer.byteLength(body),
        },
        timeout: WEBHOOK_TIMEOUT_MS,
      },
      (res) => {
        res.resume(); // drain and discard the body (blind, best-effort)
        res.on("end", done);
        res.on("error", done);
      }
    );
    req.on("error", done);
    req.on("timeout", () => {
      req.destroy();
      done();
    });
    req.write(body);
    req.end();
  });
}
