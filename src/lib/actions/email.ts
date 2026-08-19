"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { randomBytes } from "node:crypto";
import { requireSession, guardWrite } from "@/lib/auth/session";
import { can } from "@/lib/auth/rbac";
import { enforceAdminMfa } from "@/lib/auth/mfa-policy";
import { recordAudit } from "@/lib/auth/audit";
import { getEmailSettings, upsertEmailSettings, addActivity, listEmailTemplates, createEmailTemplate, updateEmailTemplate, deleteEmailTemplate, createEmailSend } from "@/lib/db";
import { encryptSecret, decryptSecret, isMfaCryptoConfigured } from "@/lib/auth/crypto";
import { sendMail, type SmtpConfig } from "@/lib/email/send";
import { buildEmailHtml } from "@/lib/crm/email-html";
import { validated, vString, vEmail, vInt } from "@/lib/crm/validate";
import { checkRateLimit, retryMessage } from "@/lib/rate-limit";

/** Public origin of this CRM (for the tracking-pixel URL in outgoing email). */
async function publicBaseUrl(): Promise<string> {
  try {
    const host = (await headers()).get("host");
    if (!host) return "";
    return `${process.env.NODE_ENV === "production" ? "https" : "http"}://${host}`;
  } catch {
    return "";
  }
}

export interface EmailSettingsView {
  canManage: boolean;
  cryptoConfigured: boolean;
  configured: boolean; // a usable mailbox exists (host + enabled)
  enabled: boolean;
  host: string;
  port: number;
  secure: boolean;
  username: string;
  fromName: string;
  fromEmail: string;
  hasPassword: boolean; // whether a password is stored (never returns the value)
}

export async function getEmailSettingsAction(): Promise<EmailSettingsView | null> {
  const { organizationId, role } = await requireSession();
  if (!can(role, "org:manage")) return null; // owner-only settings page
  const row = await getEmailSettings(organizationId).catch(() => null);
  return {
    canManage: true,
    cryptoConfigured: isMfaCryptoConfigured(),
    configured: !!row?.host && !!row?.enabled,
    enabled: !!row?.enabled,
    host: row?.host ?? "",
    port: row?.port ?? 587,
    secure: !!row?.secure,
    username: row?.username ?? "",
    fromName: row?.from_name ?? "",
    fromEmail: row?.from_email ?? "",
    hasPassword: !!row?.password_enc,
  };
}

export interface EmailSettingsDTO {
  host?: string;
  port?: number;
  secure?: boolean;
  username?: string;
  password?: string; // empty = keep the stored one
  fromName?: string;
  fromEmail?: string;
  enabled?: boolean;
}

export async function saveEmailSettingsAction(input: EmailSettingsDTO): Promise<{ error?: string }> {
  const session = await requireSession();
  if (!can(session.role, "org:manage")) return { error: "Only an owner can change the mailbox." };
  const mfaErr = await enforceAdminMfa(session);
  if (mfaErr) return { error: mfaErr };

  const v = validated(() => ({
    host: vString("SMTP host", input.host, { required: true, max: 190 }),
    username: vString("Username", input.username, { max: 190 }),
    fromName: vString("From name", input.fromName, { max: 120 }),
    fromEmail: vEmail("From address", input.fromEmail),
    port: vInt("Port", input.port, { required: true, min: 1, max: 65535 }) ?? 587,
  }));
  if (!v.ok) return { error: v.error };
  if (!v.value.fromEmail) return { error: "Enter the From address emails are sent from." };

  // Password: only re-encrypt when a new one is supplied; empty keeps the stored
  // one. Storing a password requires the at-rest key.
  let passwordEnc: string | null = null;
  const newPassword = (input.password ?? "").trim();
  if (newPassword) {
    if (!isMfaCryptoConfigured()) {
      return { error: "Set MFA_ENCRYPTION_KEY in the server environment first — it encrypts the mailbox password at rest." };
    }
    passwordEnc = encryptSecret(newPassword);
    if (!passwordEnc) return { error: "Could not secure the password." };
  }

  await upsertEmailSettings(session.organizationId, {
    host: v.value.host,
    port: v.value.port,
    secure: !!input.secure,
    username: v.value.username,
    passwordEnc,
    fromName: v.value.fromName,
    fromEmail: v.value.fromEmail,
    enabled: !!input.enabled,
  });
  await recordAudit(session, "email_settings_update", "organization", session.organizationId, `${v.value.host}:${v.value.port}`);
  revalidatePath("/settings/email");
  return {};
}

/** Load + decrypt the org's mailbox into a ready-to-send config. Internal. */
async function loadSmtpConfig(orgId: number, opts: { requireEnabled?: boolean } = {}): Promise<{ config?: SmtpConfig; error?: string }> {
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

export async function sendTestEmailAction(to: string): Promise<{ ok?: true; error?: string }> {
  const session = await requireSession();
  if (!can(session.role, "org:manage")) return { error: "Only an owner can send a test." };
  const rl = checkRateLimit(`email-test:${session.userId}`, { limit: 5, windowMs: 10 * 60_000, blockMs: 10 * 60_000 });
  if (!rl.ok) return { error: retryMessage(rl.retryAfter) };

  const v = validated(() => ({ to: vEmail("Recipient", to) }));
  if (!v.ok) return { error: v.error };
  if (!v.value.to) return { error: "Enter an address to send the test to." };

  const loaded = await loadSmtpConfig(session.organizationId);
  if (loaded.error || !loaded.config) return { error: loaded.error ?? "Mailbox not configured." };

  const r = await sendMail(loaded.config, {
    to: v.value.to,
    subject: "Sajtpress CRM — test email",
    text: "This is a test email from your Sajtpress CRM mailbox. If you received it, sending is configured correctly.",
  });
  await recordAudit(session, "email_test", "organization", session.organizationId, r.ok ? `sent to ${v.value.to}` : `failed: ${r.ok === false ? r.error : ""}`);
  if (!r.ok) return { error: `Send failed: ${r.error}` };
  return { ok: true };
}

// -------------------------------------------------------------- Layer 2: sending

/** Member-safe check the composer uses to know whether a mailbox is available
 *  (no secrets returned). Any authenticated user. */
export async function emailComposeStatusAction(): Promise<{ available: boolean; from: string }> {
  const { organizationId } = await requireSession();
  const row = await getEmailSettings(organizationId).catch(() => null);
  const available = !!row?.host && !!row?.enabled;
  return { available, from: available ? row!.from_email : "" };
}

/** Send an email to a recipient and log it on the timeline. member+ (viewers
 *  blocked by guardWrite). Replies route to the sending rep, not the shared
 *  mailbox. */
export async function sendEmailAction(input: {
  to: string;
  subject: string;
  body: string;
  contactId?: number | null;
  companyId?: number | null;
  dealId?: number | null;
  track?: boolean;
}): Promise<{ ok?: true; error?: string }> {
  const g = await guardWrite();
  if ("error" in g) return { error: g.error };
  const session = g.session;
  const rl = checkRateLimit(`email-send:${session.userId}`, { limit: 40, windowMs: 60 * 60_000, blockMs: 30 * 60_000 });
  if (!rl.ok) return { error: retryMessage(rl.retryAfter) };

  const v = validated(() => ({
    to: vEmail("Recipient", input.to),
    subject: vString("Subject", input.subject, { required: true, max: 300 }),
    body: vString("Message", input.body, { required: true, max: 20000 }),
  }));
  if (!v.ok) return { error: v.error };
  if (!v.value.to) return { error: "Enter a recipient." };

  const loaded = await loadSmtpConfig(session.organizationId, { requireEnabled: true });
  if (loaded.error || !loaded.config) return { error: loaded.error ?? "Mailbox not configured." };

  // Open tracking (default on): a unique pixel URL is embedded in the HTML body.
  let token: string | undefined;
  let pixelUrl: string | undefined;
  if (input.track !== false) {
    const base = await publicBaseUrl();
    if (base) {
      token = randomBytes(24).toString("hex");
      pixelUrl = `${base}/api/e/${token}.png`;
    }
  }

  const r = await sendMail(loaded.config, {
    to: v.value.to,
    subject: v.value.subject,
    text: v.value.body,
    html: buildEmailHtml(v.value.body, pixelUrl),
    replyTo: session.email, // replies reach the actual rep, not the shared mailbox
  });
  if (!r.ok) {
    await recordAudit(session, "email_send_failed", "contact", input.contactId ?? null, `${v.value.to}: ${r.error}`);
    return { error: `Send failed: ${r.error}` };
  }
  if (token) {
    await createEmailSend(session.organizationId, {
      token,
      contactId: input.contactId ?? null,
      companyId: input.companyId ?? null,
      dealId: input.dealId ?? null,
      toEmail: v.value.to,
      subject: v.value.subject,
      sentBy: session.email,
    }).catch(() => {});
  }
  // Log it on the timeline (best-effort). Activities need a company; skip the log
  // if we weren't given one rather than failing the send.
  if (input.companyId) {
    await addActivity(session.organizationId, {
      companyId: input.companyId,
      contactId: input.contactId ?? null,
      dealId: input.dealId ?? null,
      type: "email",
      summary: `Email → ${v.value.to}: ${v.value.subject}`,
    }).catch(() => {});
  }
  await recordAudit(session, "email_sent", "contact", input.contactId ?? null, `${v.value.to} · ${v.value.subject}`);
  if (input.companyId) revalidatePath(`/companies/${input.companyId}`);
  if (input.contactId) revalidatePath(`/contacts/${input.contactId}`);
  if (input.dealId) revalidatePath(`/deals/${input.dealId}`);
  revalidatePath("/emails");
  return { ok: true };
}

// -------------------------------------------------------------- email templates

export interface EmailTemplateView {
  id: number;
  name: string;
  subject: string;
  body: string;
}

/** Any authenticated user can read templates (reps use them in the composer). */
export async function listEmailTemplatesAction(): Promise<EmailTemplateView[]> {
  const { organizationId } = await requireSession();
  const rows = await listEmailTemplates(organizationId).catch(() => []);
  return rows.map((r) => ({ id: r.id, name: r.name, subject: r.subject, body: r.body ?? "" }));
}

export async function saveEmailTemplateAction(input: { id?: number; name: string; subject: string; body: string }): Promise<{ id?: number; error?: string }> {
  const g = await guardWrite();
  if ("error" in g) return { error: g.error };
  const session = g.session;
  const v = validated(() => ({
    name: vString("Name", input.name, { required: true, max: 120 }),
    subject: vString("Subject", input.subject, { required: true, max: 300 }),
    body: vString("Body", input.body, { required: true, max: 20000 }),
  }));
  if (!v.ok) return { error: v.error };

  if (input.id) {
    await updateEmailTemplate(session.organizationId, input.id, v.value);
    await recordAudit(session, "email_template_update", "email_template", input.id, v.value.name);
    revalidatePath("/settings/email-templates");
    return { id: input.id };
  }
  const id = await createEmailTemplate(session.organizationId, { ...v.value, createdBy: session.email });
  await recordAudit(session, "email_template_create", "email_template", id, v.value.name);
  revalidatePath("/settings/email-templates");
  return { id };
}

export async function deleteEmailTemplateAction(id: number): Promise<{ error?: string }> {
  const g = await guardWrite();
  if ("error" in g) return { error: g.error };
  await deleteEmailTemplate(g.session.organizationId, id);
  await recordAudit(g.session, "email_template_delete", "email_template", id);
  revalidatePath("/settings/email-templates");
  return {};
}
