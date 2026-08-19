import "server-only";
import nodemailer from "nodemailer";

// The one place the CRM talks SMTP. Given a decrypted mailbox config and a
// message, it sends via nodemailer and returns a plain result — never throws, so
// the caller (a server action) can surface a clean error. Timeouts are bounded so
// a dead SMTP host can't hang a request.

export interface SmtpConfig {
  host: string;
  port: number;
  secure: boolean; // true = implicit TLS (465); false = STARTTLS (587/25)
  username: string;
  password: string;
  fromName: string;
  fromEmail: string;
}

export interface MailMessage {
  to: string;
  subject: string;
  text: string;
  html?: string;
  replyTo?: string;
}

export type SendResult = { ok: true; messageId: string } | { ok: false; error: string };

export async function sendMail(cfg: SmtpConfig, msg: MailMessage): Promise<SendResult> {
  try {
    const transport = nodemailer.createTransport({
      host: cfg.host,
      port: cfg.port,
      secure: cfg.secure,
      auth: cfg.username ? { user: cfg.username, pass: cfg.password } : undefined,
      connectionTimeout: 10_000,
      greetingTimeout: 10_000,
      socketTimeout: 20_000,
    });
    // Display name is quoted; strip quotes/newlines so it can't break the header.
    const cleanName = cfg.fromName.replace(/["\r\n]/g, "").trim();
    const from = cleanName ? `"${cleanName}" <${cfg.fromEmail}>` : cfg.fromEmail;
    const info = await transport.sendMail({
      from,
      to: msg.to,
      subject: msg.subject,
      text: msg.text,
      html: msg.html,
      replyTo: msg.replyTo || undefined,
    });
    return { ok: true, messageId: String(info.messageId ?? "") };
  } catch (e) {
    const raw = e instanceof Error ? e.message : "Could not send the email.";
    return { ok: false, error: raw.slice(0, 300) };
  }
}
