"use server";

import { revalidatePath } from "next/cache";
import { listAutomations, createAutomation, toggleAutomation, deleteAutomation, listAutomationRuns, type AutomationRow, type AutomationRunRow } from "@/lib/db";
import { requireSession } from "@/lib/auth/session";
import { isTemplateKey, normalizeParams, getTemplate, type AutomationCategory } from "@/lib/crm/automation";
import { runAutomationsForOrg, runSingleAutomation, previewAutomation } from "@/lib/automation-runner";

export interface Automation {
  id: number;
  templateKey: string;
  name: string;
  category: string;
  params: Record<string, string | number>;
  enabled: boolean;
  lastRunAt: string | null;
  createdCount: number;
  createdAt: string;
}

function toAutomation(r: AutomationRow): Automation {
  let raw: Record<string, unknown> = {};
  try {
    raw = r.params ? (JSON.parse(r.params) as Record<string, unknown>) : {};
  } catch {
    raw = {};
  }
  return {
    id: r.id,
    templateKey: r.template_key,
    name: r.name,
    category: getTemplate(r.template_key)?.category ?? "followup",
    params: normalizeParams(r.template_key, raw),
    enabled: !!r.enabled,
    lastRunAt: r.last_run_at ? new Date(r.last_run_at).toISOString() : null,
    createdCount: r.created_count,
    createdAt: new Date(r.created_at).toISOString(),
  };
}

export async function listAutomationsAction(category?: AutomationCategory): Promise<Automation[]> {
  const { organizationId } = await requireSession();
  const rows = await listAutomations(organizationId);
  const mapped = rows.map(toAutomation);
  return category ? mapped.filter((a) => a.category === category) : mapped;
}

export async function createAutomationAction(input: { templateKey: string; name?: string; params?: Record<string, unknown> }): Promise<{ id?: number; error?: string }> {
  const { organizationId } = await requireSession();
  const tmpl = getTemplate(input.templateKey);
  if (!tmpl || !isTemplateKey(input.templateKey)) return { error: "Unknown automation." };
  const params = normalizeParams(input.templateKey, input.params ?? {});
  const name = input.name?.trim() || tmpl.name;
  const id = await createAutomation(organizationId, { templateKey: input.templateKey, name, params });
  revalidatePath("/automation/workflows");
  revalidatePath("/automation/followups");
  revalidatePath("/automation/routing");
  return { id };
}

export async function toggleAutomationAction(id: number, enabled: boolean): Promise<{ error?: string }> {
  const { organizationId } = await requireSession();
  await toggleAutomation(organizationId, id, enabled);
  revalidatePath("/automation/workflows");
  return {};
}

export async function deleteAutomationAction(id: number): Promise<void> {
  const { organizationId } = await requireSession();
  await deleteAutomation(organizationId, id);
  revalidatePath("/automation/workflows");
}

/** Manually run this org's enabled automations now (a "Run now" button + a way
 *  to test without waiting for the cron). Returns the number of tasks created. */
export async function runAutomationsNowAction(): Promise<{ created: number }> {
  const { organizationId } = await requireSession();
  const results = await runAutomationsForOrg(organizationId);
  revalidatePath("/automation/notifications");
  return { created: results.reduce((s, x) => s + x.created, 0) };
}

/** Run a single automation now (the per-row "Run" button). */
export async function runOneAutomationNowAction(id: number): Promise<{ created: number }> {
  const { organizationId } = await requireSession();
  const created = await runSingleAutomation(organizationId, id);
  revalidatePath("/automation/notifications");
  return { created };
}

/** Dry-run: how many tasks a template + params would target right now. Read-only. */
export async function previewAutomationAction(templateKey: string, params?: Record<string, unknown>): Promise<{ count: number }> {
  const { organizationId } = await requireSession();
  if (!isTemplateKey(templateKey)) return { count: 0 };
  const count = await previewAutomation(organizationId, templateKey, params ?? {});
  return { count };
}

/** Whether the scheduled cron seam is configured (a boolean only — never the
 *  secret). Lets the UI show live vs manual-only status honestly. */
export async function automationStatusAction(): Promise<{ cronConfigured: boolean }> {
  await requireSession();
  return { cronConfigured: !!process.env.CRON_SECRET };
}

export interface AutomationRunItem {
  id: number;
  name: string;
  created: number;
  summary: string;
  ranAt: string;
}
export async function listAutomationRunsAction(): Promise<AutomationRunItem[]> {
  const { organizationId } = await requireSession();
  const rows = await listAutomationRuns(organizationId, 50);
  return rows.map((r: AutomationRunRow) => ({ id: r.id, name: r.name, created: r.created_count, summary: r.summary, ranAt: new Date(r.ran_at).toISOString() }));
}
