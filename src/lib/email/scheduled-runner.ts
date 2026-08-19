import "server-only";
import { listDueScheduledEmails, markScheduledEmail, type ScheduledEmailRow } from "@/lib/db";
import { loadSmtpConfig, deliverTracked, publicBaseUrl } from "@/lib/email/mailbox";
import type { SmtpConfig } from "@/lib/email/send";

// Delivered by the cron tick: send any "send later" emails whose time has come.
// Bounded per tick; each org's mailbox is loaded once and reused. Best-effort —
// a bad mailbox marks that email failed and moves on.

export async function processDueScheduledEmails(): Promise<{ sent: number; failed: number }> {
  const due = await listDueScheduledEmails(40).catch(() => [] as ScheduledEmailRow[]);
  if (due.length === 0) return { sent: 0, failed: 0 };

  const base = await publicBaseUrl();
  const cache = new Map<number, { config?: SmtpConfig; error?: string }>();
  let sent = 0;
  let failed = 0;

  for (const e of due) {
    let cfg = cache.get(e.organization_id);
    if (!cfg) {
      cfg = await loadSmtpConfig(e.organization_id, { requireEnabled: true });
      cache.set(e.organization_id, cfg);
    }
    if (!cfg.config) {
      await markScheduledEmail(e.id, "failed", cfg.error ?? "No active mailbox").catch(() => {});
      failed++;
      continue;
    }
    const r = await deliverTracked(e.organization_id, e.scheduled_by, cfg.config, base, {
      to: e.to_email,
      subject: e.subject,
      body: e.body ?? "",
      contactId: e.contact_id,
      companyId: e.company_id,
      dealId: e.deal_id,
      track: !!e.track,
      replyTo: e.scheduled_by,
    });
    if (r.ok) {
      await markScheduledEmail(e.id, "sent").catch(() => {});
      sent++;
    } else {
      await markScheduledEmail(e.id, "failed", r.error).catch(() => {});
      failed++;
    }
  }
  return { sent, failed };
}
