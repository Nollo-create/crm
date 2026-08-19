import "server-only";
import { headers } from "next/headers";
import { randomBytes } from "node:crypto";
import { getEmailSettings, createEmailSend, addActivity } from "@/lib/db";
import { decryptSecret } from "@/lib/auth/crypto";
import { sendMail, type SmtpConfig } from "@/lib/email/send";
import { buildEmailHtml } from "@/lib/crm/email-html";

// Shared mailbox internals used by both the request-time email actions and the
// session-less scheduled-email runner (cron). Server-only.

/** Public origin of this CRM (for the tracking-pixel URL in outgoing email).
 *  Derived from the request Host — works in both server actions and the cron
 *  route (which the scheduler hits on the CRM's own domain). */
export async function publicBaseUrl(): Promise<string> {
  try {
    const host = (await headers()).get("host");
    if (!host) return "";
    return `${process.env.NODE_ENV === "production" ? "https" : "http"}://${host}`;
  } catch {
    return "";
  }
}

/** Load + decrypt the org's mailbox into a ready-to-send config. */
export async function loadSmtpConfig(orgId: number, opts: { requireEnabled?: boolean } = {}): Promise<{ config?: SmtpConfig; error?: string }> {
  const row = await getEmailSettings(orgId).catch(() => null);
  if (!row?.host) return { error: "No mailbox is configured. Ask an owner to set one up in Settings → Email." };
  if (opts.requireEnabled && !row.enabled) return { error: "The mailbox isn't active yet. Ask an owner to enable it in Settings → Email." };
  const password = row.password_enc ? decryptSecret(row.password_enc) : "";
  if (row.password_enc && password === null) {
    return { error: "Could not read the saved password — was MFA_ENCRYPTION_KEY changed? Re-enter it below." };
  }
  return {
    config: {
      host: row.host,
      port: row.port,
      secure: !!row.secure,
      username: row.username,
      password: password ?? "",
      fromName: row.from_name,
      fromEmail: row.from_email,
    },
  };
}

/** Send one email + record the open-tracking row + log the timeline activity,
 *  with no request session (the scheduler runs outside one). Best-effort on the
 *  record/log steps; returns the send result. */
export async function deliverTracked(
  orgId: number,
  sentBy: string,
  config: SmtpConfig,
  base: string,
  msg: { to: string; subject: string; body: string; contactId?: number | null; companyId?: number | null; dealId?: number | null; track: boolean; replyTo?: string }
): Promise<{ ok: boolean; error?: string }> {
  let token: string | undefined;
  let pixelUrl: string | undefined;
  if (msg.track && base) {
    token = randomBytes(24).toString("hex");
    pixelUrl = `${base}/api/e/${token}.png`;
  }
  const r = await sendMail(config, { to: msg.to, subject: msg.subject, text: msg.body, html: buildEmailHtml(msg.body, pixelUrl), replyTo: msg.replyTo });
  if (!r.ok) return { ok: false, error: r.error };
  if (token) {
    await createEmailSend(orgId, { token, contactId: msg.contactId ?? null, companyId: msg.companyId ?? null, dealId: msg.dealId ?? null, toEmail: msg.to, subject: msg.subject, sentBy }).catch(() => {});
  }
  if (msg.companyId) {
    await addActivity(orgId, { companyId: msg.companyId, contactId: msg.contactId ?? null, dealId: msg.dealId ?? null, type: "email", summary: `Email → ${msg.to}: ${msg.subject}` }).catch(() => {});
  }
  return { ok: true };
}
