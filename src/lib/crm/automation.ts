// Automation domain — pure templates + validation. An automation is a rule that,
// on each cron tick, creates Tasks for the right work (the Tasks module is the
// output surface). Each template's execution lives server-side in the runner;
// this module just describes them + their parameters for the UI and validation.

export type AutomationCategory = "followup" | "routing";
export const AUTOMATION_CATEGORY_LABEL: Record<AutomationCategory, string> = {
  followup: "Follow-up",
  routing: "Lead routing",
};

export interface ParamSpec {
  key: string;
  label: string;
  kind: "days" | "score" | "priority";
  default: number | string;
}

export interface AutomationTemplate {
  key: string;
  category: AutomationCategory;
  name: string;
  description: string;
  params: ParamSpec[];
}

export const AUTOMATION_TEMPLATES: AutomationTemplate[] = [
  {
    key: "followup_inactive",
    category: "followup",
    name: "Re-engage inactive accounts",
    description: "Create a follow-up task for customers with no activity in N days.",
    params: [
      { key: "days", label: "Inactive days", kind: "days", default: 30 },
      { key: "priority", label: "Task priority", kind: "priority", default: "normal" },
    ],
  },
  {
    key: "chase_overdue_deals",
    category: "followup",
    name: "Chase overdue deals",
    description: "Create a task for open deals past their expected close date.",
    params: [{ key: "priority", label: "Task priority", kind: "priority", default: "high" }],
  },
  {
    key: "chase_sent_quotes",
    category: "followup",
    name: "Chase sent quotes",
    description: "Create a task for quotes still 'Sent' after N days.",
    params: [
      { key: "days", label: "Days since sent", kind: "days", default: 7 },
      { key: "priority", label: "Task priority", kind: "priority", default: "normal" },
    ],
  },
  {
    key: "work_new_leads",
    category: "routing",
    name: "Work new hot leads",
    description: "Create a task to work new leads scoring at least N.",
    params: [
      { key: "minScore", label: "Min score", kind: "score", default: 60 },
      { key: "priority", label: "Task priority", kind: "priority", default: "normal" },
    ],
  },
];

export function getTemplate(key: string): AutomationTemplate | null {
  return AUTOMATION_TEMPLATES.find((t) => t.key === key) ?? null;
}
export function isTemplateKey(v: string): boolean {
  return AUTOMATION_TEMPLATES.some((t) => t.key === v);
}

/** Coerce arbitrary stored/submitted params to the template's spec (safe
 *  defaults; days/score clamped to sane ranges). */
export function normalizeParams(key: string, raw: Record<string, unknown> | null | undefined): Record<string, string | number> {
  const tmpl = getTemplate(key);
  const out: Record<string, string | number> = {};
  if (!tmpl) return out;
  for (const p of tmpl.params) {
    const v = raw?.[p.key];
    if (p.kind === "priority") {
      out[p.key] = v === "low" || v === "normal" || v === "high" ? v : (p.default as string);
    } else {
      const n = Math.round(Number(v));
      const fallback = p.default as number;
      out[p.key] = Number.isFinite(n) && n > 0 ? Math.min(n, p.kind === "score" ? 100 : 3650) : fallback;
    }
  }
  return out;
}
