// Sales goals — pure metric metadata + month arithmetic, so the period logic is
// unit tested and shared by the action and the UI.

export type GoalMetric = "revenue" | "deals_won" | "new_leads";
export const GOAL_METRICS: GoalMetric[] = ["revenue", "deals_won", "new_leads"];
export const GOAL_METRIC_LABEL: Record<GoalMetric, string> = {
  revenue: "Revenue won",
  deals_won: "Deals won",
  new_leads: "New leads",
};
/** Revenue is a euro amount; the others are plain counts. */
export const GOAL_METRIC_IS_MONEY: Record<GoalMetric, boolean> = {
  revenue: true,
  deals_won: false,
  new_leads: false,
};
export function isGoalMetric(v: string): v is GoalMetric {
  return (GOAL_METRICS as string[]).includes(v);
}

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const pad2 = (n: number) => String(n).padStart(2, "0");

export function isValidMonth(v: string): boolean {
  return /^\d{4}-(0[1-9]|1[0-2])$/.test(v);
}

/** Half-open [start, end) date bounds for a YYYY-MM period, as YYYY-MM-01. */
export function monthBounds(periodMonth: string): { start: string; end: string } {
  const [y, m] = periodMonth.split("-").map(Number);
  const ny = m === 12 ? y + 1 : y;
  const nm = m === 12 ? 1 : m + 1;
  return { start: `${y}-${pad2(m)}-01`, end: `${ny}-${pad2(nm)}-01` };
}

/** Shift a YYYY-MM period by whole months (negative = past). */
export function shiftMonth(periodMonth: string, delta: number): string {
  const [y, m] = periodMonth.split("-").map(Number);
  const total = y * 12 + (m - 1) + delta;
  const ny = Math.floor(total / 12);
  const nm = (total % 12) + 1;
  return `${ny}-${pad2(nm)}`;
}

export function monthLabel(periodMonth: string): string {
  const [y, m] = periodMonth.split("-").map(Number);
  return `${MONTHS[m - 1] ?? "?"} ${y}`;
}

/** Progress percentage, rounded, never negative (can exceed 100 for over-goal). */
export function goalPct(actual: number, target: number): number {
  if (target <= 0) return 0;
  return Math.max(0, Math.round((actual / target) * 100));
}
