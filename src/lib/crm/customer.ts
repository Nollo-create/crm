// Customer domain — pure metrics + health derived from a company's deals and
// activity. A customer isn't a separate record: it's a company with won deals
// (status flips to 'customer' when a deal is won — see db.closeDealWon). These
// helpers are rule-based today and unit-tested; an AI service can refine health
// later without changing the shape.

export interface DealLike {
  stage: string;
  value: number;
  closedAt: string | null;
}

export interface CustomerMetrics {
  wonCount: number;
  totalRevenue: number;
  avgDeal: number;
  openCount: number;
  /** ISO (YYYY-MM-DD) of the earliest / latest won deal close, or null. */
  customerSince: string | null;
  lastPurchase: string | null;
}

export function customerMetrics(deals: DealLike[]): CustomerMetrics {
  const won = deals.filter((d) => d.stage === "won");
  const totalRevenue = won.reduce((s, d) => s + (d.value || 0), 0);
  const openCount = deals.filter((d) => d.stage !== "won" && d.stage !== "lost").length;
  // ISO date strings sort chronologically as plain strings.
  const closes = won.map((d) => d.closedAt).filter((x): x is string => !!x).sort();
  return {
    wonCount: won.length,
    totalRevenue,
    avgDeal: won.length ? Math.round(totalRevenue / won.length) : 0,
    openCount,
    customerSince: closes[0] ?? null,
    lastPurchase: closes.length ? closes[closes.length - 1] : null,
  };
}

export type CustomerHealthState = "healthy" | "attention" | "at_risk";
export interface CustomerHealth {
  state: CustomerHealthState;
  label: string;
  reason: string;
}

/** Rule-based customer health (spec §29). Inputs are already-computed signals so
 *  this stays pure and testable. */
export function customerHealth(input: { lastActivityDays: number | null; openCount: number; daysSincePurchase: number | null }): CustomerHealth {
  const { lastActivityDays, openCount, daysSincePurchase } = input;
  if (lastActivityDays == null) return { state: "attention", label: "Attention needed", reason: "No activity logged yet." };
  if (lastActivityDays > 60) return { state: "at_risk", label: "At risk", reason: `No contact in ${lastActivityDays} days.` };
  if (lastActivityDays > 30 && openCount === 0) return { state: "at_risk", label: "At risk", reason: "Quiet and no open pipeline." };
  if (lastActivityDays <= 30 && (openCount > 0 || (daysSincePurchase != null && daysSincePurchase <= 90))) {
    return { state: "healthy", label: "Healthy", reason: openCount > 0 ? "Recent activity with open pipeline." : "Active and recently purchased." };
  }
  return { state: "attention", label: "Attention needed", reason: lastActivityDays > 14 ? `Last contact ${lastActivityDays} days ago.` : "Engaged — line up the next opportunity." };
}
