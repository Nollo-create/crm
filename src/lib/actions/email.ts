"use server";

import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth/session";
import { can } from "@/lib/auth/rbac";
import { enforceAdminMfa } from "@/lib/auth/mfa-policy";
import { recordAudit } from "@/lib/auth/audit";
import { getEmailSettings, upsertEmailSettings } from "@/lib/db";
import { encryptSecret, decryptSecret, isMfaCryptoConfigured } from "@/lib/auth/crypto";
import { sendMail, type SmtpConfig } from "@/lib/email/send";
import { validated, vString, vEmail, vInt } from "@/lib/crm/validate";
import { checkRateLimit, retryMessage } from "@/lib/rate-limit";

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
async function loadSmtpConfig(orgId: number): Promise<{ config?: SmtpConfig; error?: string }> {
  const row = await getEmailSettings(orgId).catch(() => null);
  if (!row?.host) return { error: "Configure the mailbox first." };
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
