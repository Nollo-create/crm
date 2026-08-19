import "server-only";
import { listDueEnrollments, getSequence, getSequenceSteps, enrollmentHasOpen, advanceEnrollment, type SequenceEnrollmentRow, type SequenceStepRow } from "@/lib/db";
import { loadSmtpConfig, deliverTracked, publicBaseUrl } from "@/lib/email/mailbox";
import { applyTemplate, templateVars } from "@/lib/crm/email-template";
import type { SmtpConfig } from "@/lib/email/send";

// Delivered by the cron tick: advance each active sequence enrollment whose next
// step is due. Stop-on-open ends a sequence once the recipient has opened any
// step. Bounded per tick; org mailbox + sequence steps cached within the run.

const DAY_MS = 24 * 60 * 60_000;

export async function processDueSequenceSteps(): Promise<{ sent: number; stopped: number; completed: number }> {
  const due = await listDueEnrollments(30).catch(() => [] as SequenceEnrollmentRow[]);
  if (due.length === 0) return { sent: 0, stopped: 0, completed: 0 };

  const base = await publicBaseUrl();
  const cfgCache = new Map<number, { config?: SmtpConfig; error?: string }>();
  const stepCache = new Map<number, SequenceStepRow[]>();
  const stopCache = new Map<number, boolean>();
  let sent = 0;
  let stopped = 0;
  let completed = 0;

  for (const e of due) {
    // Steps + stop-on-open for this sequence (cached).
    let steps = stepCache.get(e.sequence_id);
    if (!steps) {
      steps = await getSequenceSteps(e.organization_id, e.sequence_id).catch(() => []);
      stepCache.set(e.sequence_id, steps);
      const seq = await getSequence(e.organization_id, e.sequence_id).catch(() => null);
      stopCache.set(e.sequence_id, !!seq?.stop_on_open);
    }
    const stopOnOpen = stopCache.get(e.sequence_id) ?? false;

    // Engaged? End the sequence.
    if (stopOnOpen && (await enrollmentHasOpen(e.id).catch(() => false))) {
      await advanceEnrollment(e.id, { currentStep: e.current_step, nextSendAt: null, status: "stopped" }).catch(() => {});
      stopped++;
      continue;
    }
    // No more steps → done.
    if (e.current_step >= steps.length) {
      await advanceEnrollment(e.id, { currentStep: e.current_step, nextSendAt: null, status: "completed" }).catch(() => {});
      completed++;
      continue;
    }

    // Need a working mailbox; if none, leave it active to resume once fixed.
    let cfg = cfgCache.get(e.organization_id);
    if (!cfg) {
      cfg = await loadSmtpConfig(e.organization_id, { requireEnabled: true });
      cfgCache.set(e.organization_id, cfg);
    }
    if (!cfg.config) continue;

    const step = steps[e.current_step];
    const vars = templateVars({ name: e.recipient_name, company: e.company_name });
    await deliverTracked(e.organization_id, e.enrolled_by, cfg.config, base, {
      to: e.to_email,
      subject: applyTemplate(step.subject, vars),
      body: applyTemplate(step.body ?? "", vars),
      contactId: e.contact_id,
      companyId: e.company_id,
      track: true,
      replyTo: e.enrolled_by,
      enrollmentId: e.id,
    }).catch(() => ({ ok: false }));
    sent++;

    // Advance regardless of send result so one bad step can't loop or stall.
    const next = e.current_step + 1;
    if (next < steps.length) {
      await advanceEnrollment(e.id, { currentStep: next, nextSendAt: new Date(Date.now() + Math.max(0, steps[next].delay_days) * DAY_MS), status: "active" }).catch(() => {});
    } else {
      await advanceEnrollment(e.id, { currentStep: next, nextSendAt: null, status: "completed" }).catch(() => {});
      completed++;
    }
  }
  return { sent, stopped, completed };
}
