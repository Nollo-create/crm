// The sales pipeline — pure logic, no DB, so the numbers a manager trusts
// (weighted pipeline, per-stage totals, a lead score) are testable on their own.
// Client-safe: used by both the server actions and the UI.

export type StageId =
  | "new"
  | "qualified"
  | "contacted"
  | "discovery"
  | "meeting"
  | "quote"
  | "negotiation"
  | "won"
  | "lost";

export interface Stage {
  id: StageId;
  label: string;
  /** default win probability at this stage (%) */
  probability: number;
  /** open = still in play (excludes won/lost) */
  open: boolean;
}

export const STAGES: Stage[] = [
  { id: "new", label: "New lead", probability: 10, open: true },
  { id: "qualified", label: "Qualified", probability: 20, open: true },
  { id: "contacted", label: "Contacted", probability: 30, open: true },
  { id: "discovery", label: "Discovery", probability: 45, open: true },
  { id: "meeting", label: "Meeting", probability: 60, open: true },
  { id: "quote", label: "Quote sent", probability: 75, open: true },
  { id: "negotiation", label: "Negotiation", probability: 85, open: true },
  { id: "won", label: "Won", probability: 100, open: false },
  { id: "lost", label: "Lost", probability: 0, open: false },
];

export const OPEN_STAGES = STAGES.filter((s) => s.open);
export const STAGE_IDS = STAGES.map((s) => s.id);

// Loss reasons — captured when a deal is marked Lost, for win/loss analytics.
export type LossReason = "price" | "competitor" | "no_budget" | "timing" | "no_response" | "wrong_fit" | "other";
export const LOSS_REASONS: LossReason[] = ["price", "competitor", "no_budget", "timing", "no_response", "wrong_fit", "other"];
export const LOSS_REASON_LABEL: Record<LossReason, string> = {
  price: "Price",
  competitor: "Competitor",
  no_budget: "No budget",
  timing: "Timing",
  no_response: "No response",
  wrong_fit: "Wrong fit",
  other: "Other",
};
export function isLossReason(v: string): v is LossReason {
  return (LOSS_REASONS as string[]).includes(v);
}

const STAGE_BY_ID = new Map(STAGES.map((s) => [s.id, s]));

export function isStageId(v: string): v is StageId {
  return STAGE_BY_ID.has(v as StageId);
}

export function stage(id: StageId): Stage {
  return STAGE_BY_ID.get(id) ?? STAGES[0];
}

export function stageLabel(id: string): string {
  return STAGE_BY_ID.get(id as StageId)?.label ?? id;
}

export interface DealLike {
  value: number;
  stage: StageId;
  /** manual override of the stage default (%), if set */
  probability?: number | null;
}

/** The realistic value of a deal: its value × probability. Lost = 0, won = full. */
export function weightedValue(d: DealLike): number {
  const s = stage(d.stage);
  if (!s.open) return s.id === "won" ? d.value : 0;
  const p = d.probability != null ? d.probability : s.probability;
  return Math.round((d.value * Math.max(0, Math.min(100, p))) / 100);
}

export interface PipelineSummary {
  /** total value of open deals */
  open: number;
  /** probability-weighted value of open deals */
  weighted: number;
  /** total value already won */
  won: number;
  openCount: number;
  wonCount: number;
  lostCount: number;
  /** win rate over closed deals (%) */
  winRate: number;
  byStage: Record<StageId, { count: number; value: number }>;
}

export function summarizePipeline(deals: DealLike[]): PipelineSummary {
  const byStage = Object.fromEntries(STAGE_IDS.map((id) => [id, { count: 0, value: 0 }])) as PipelineSummary["byStage"];
  let open = 0;
  let weighted = 0;
  let won = 0;
  let openCount = 0;
  let wonCount = 0;
  let lostCount = 0;

  for (const d of deals) {
    const s = STAGE_BY_ID.get(d.stage) ? d.stage : "new";
    byStage[s].count += 1;
    byStage[s].value += d.value;
    if (stage(s).open) {
      open += d.value;
      weighted += weightedValue(d);
      openCount += 1;
    } else if (s === "won") {
      won += d.value;
      wonCount += 1;
    } else {
      lostCount += 1;
    }
  }

  const closed = wonCount + lostCount;
  const winRate = closed ? Math.round((wonCount / closed) * 100) : 0;
  return { open, weighted, won, openCount, wonCount, lostCount, winRate, byStage };
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** A human close-date label with urgency, from a YYYY-MM-DD string. `now` is
 *  injectable so the urgency thresholds stay deterministic in tests. Formatting
 *  avoids `toLocaleDateString` so server and client agree (no hydration drift). */
export function dealCloseInfo(ymd: string | null, now: Date = new Date()): { label: string; tone: "danger" | "warning" | "muted" } | null {
  if (!ymd) return null;
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const d = new Date(`${ymd}T00:00:00`);
  if (Number.isNaN(d.getTime())) return null;
  const days = Math.round((d.getTime() - today.getTime()) / 86_400_000);
  if (days < 0) return { label: `${Math.abs(days)}d overdue`, tone: "danger" };
  if (days === 0) return { label: "Closes today", tone: "warning" };
  if (days <= 7) return { label: `in ${days}d`, tone: "warning" };
  return { label: `${MONTHS[d.getMonth()]} ${d.getDate()}`, tone: "muted" };
}

/** A quick 0–100 lead score from cheap signals, so a rep works the best first.
 *  Deliberately simple and explainable; the AI-driven score comes in a later
 *  etapa (it will call the webapp's agents). */
export function leadScore(c: {
  hasWebsite?: boolean;
  employees?: number | null;
  industryMatch?: boolean;
  annualValue?: number | null;
}): number {
  let score = 30;
  if (c.hasWebsite) score += 15;
  if (c.industryMatch) score += 25;
  const emp = c.employees ?? 0;
  if (emp >= 200) score += 20;
  else if (emp >= 50) score += 15;
  else if (emp >= 10) score += 8;
  if ((c.annualValue ?? 0) >= 20000) score += 10;
  return Math.max(0, Math.min(100, score));
}

export interface ScoreFactor {
  label: string;
  points: number;
}

/** The same score as leadScore(), broken into its contributing factors so the
 *  Lead Scoring page can explain the "why". Kept in lockstep with leadScore. */
export function leadScoreBreakdown(c: {
  hasWebsite?: boolean;
  employees?: number | null;
  industryMatch?: boolean;
  annualValue?: number | null;
}): { total: number; factors: ScoreFactor[] } {
  const factors: ScoreFactor[] = [{ label: "Base", points: 30 }];
  if (c.hasWebsite) factors.push({ label: "Has a website", points: 15 });
  if (c.industryMatch) factors.push({ label: "Industry fit", points: 25 });
  const emp = c.employees ?? 0;
  if (emp >= 200) factors.push({ label: "200+ employees", points: 20 });
  else if (emp >= 50) factors.push({ label: "50+ employees", points: 15 });
  else if (emp >= 10) factors.push({ label: "10+ employees", points: 8 });
  if ((c.annualValue ?? 0) >= 20000) factors.push({ label: "Annual value ≥ €20k", points: 10 });
  const total = Math.max(0, Math.min(100, factors.reduce((s, f) => s + f.points, 0)));
  return { total, factors };
}
