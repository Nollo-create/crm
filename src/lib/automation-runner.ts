import "server-only";
import {
  listEnabledAutomations,
  createTask,
  openTaskExists,
  logAutomationRun,
  nbaStaleAccounts,
  nbaOverdueDeals,
  nbaHotLeads,
  nbaAgingQuotes,
  type AutomationRow,
} from "@/lib/db";
import { normalizeParams, getTemplate } from "@/lib/crm/automation";
import { quoteNumber } from "@/lib/crm/quotes";

// Runs enabled automations for an org: each rule turns its signal into deduped
// Tasks (the Tasks module is the output surface). Bounded per rule so a tick
// stays a small slice of work (the cron seam pattern — no worker on this host).

const CAP = 25;

async function runOne(orgId: number, a: AutomationRow): Promise<number> {
  const tmpl = getTemplate(a.template_key);
  if (!tmpl) return 0;
  let raw: Record<string, unknown> = {};
  try {
    raw = a.params ? (JSON.parse(a.params) as Record<string, unknown>) : {};
  } catch {
    raw = {};
  }
  const p = normalizeParams(a.template_key, raw);
  const priority = String(p.priority ?? "normal");
  let created = 0;

  const makeTask = async (title: string, companyId: number | null, note: string) => {
    if (created >= CAP) return;
    if (await openTaskExists(orgId, title)) return; // dedup
    await createTask(orgId, { title, companyId, priority, notes: note });
    created++;
  };

  if (a.template_key === "followup_inactive") {
    for (const acc of await nbaStaleAccounts(orgId, Number(p.days) || 30, CAP)) {
      await makeTask(`Follow up with ${acc.name}`, acc.id, "Auto: inactive account");
    }
  } else if (a.template_key === "chase_overdue_deals") {
    for (const d of await nbaOverdueDeals(orgId, CAP)) {
      await makeTask(`Chase deal: ${d.title}`, d.companyId, "Auto: overdue deal");
    }
  } else if (a.template_key === "chase_sent_quotes") {
    for (const q of await nbaAgingQuotes(orgId, Number(p.days) || 7, CAP)) {
      await makeTask(`Chase ${quoteNumber(q.id)}`, null, "Auto: sent quote aging");
    }
  } else if (a.template_key === "work_new_leads") {
    for (const l of await nbaHotLeads(orgId, Number(p.minScore) || 60, CAP)) {
      await makeTask(`Work lead: ${l.name || l.company}`, null, "Auto: new hot lead");
    }
  }

  await logAutomationRun(orgId, a.id, created, `${created} task${created === 1 ? "" : "s"} created`).catch(() => {});
  return created;
}

export async function runAutomationsForOrg(orgId: number): Promise<{ automationId: number; created: number }[]> {
  const autos = await listEnabledAutomations(orgId).catch(() => []);
  const out: { automationId: number; created: number }[] = [];
  for (const a of autos) {
    const created = await runOne(orgId, a).catch(() => 0);
    out.push({ automationId: a.id, created });
  }
  return out;
}
