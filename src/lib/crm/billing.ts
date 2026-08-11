// Billing — pure plan catalog + usage math. No payment provider is wired yet, so
// this deliberately models only what's honest without one: the pricing tiers, the
// per-plan resource limits, and the usage-vs-limit meter (measured from real row
// counts by the data layer). Charging cards and issuing invoices needs a provider
// (Stripe/Paddle) and is surfaced in the UI as "not connected" — never faked.

export type PlanKey = "free" | "starter" | "pro" | "business";
export type BillingResource = "users" | "companies" | "contacts" | "deals";

export interface Plan {
  key: PlanKey;
  name: string;
  /** Monthly price in EUR. 0 = free. */
  priceEur: number;
  tagline: string;
  /** Per-resource caps. -1 = unlimited. */
  limits: Record<BillingResource, number>;
  features: string[];
  highlight?: boolean;
}

export const RESOURCES: { key: BillingResource; label: string }[] = [
  { key: "users", label: "Team members" },
  { key: "companies", label: "Companies" },
  { key: "contacts", label: "Contacts" },
  { key: "deals", label: "Deals" },
];

export const PLANS: Plan[] = [
  {
    key: "free",
    name: "Free",
    priceEur: 0,
    tagline: "Get started with the core CRM.",
    limits: { users: 2, companies: 100, contacts: 200, deals: 100 },
    features: ["Companies, contacts, deals & pipeline", "Tasks & activity log", "1 sales pipeline", "Community support"],
  },
  {
    key: "starter",
    name: "Starter",
    priceEur: 29,
    tagline: "For a small team getting organised.",
    limits: { users: 5, companies: 1000, contacts: 2500, deals: 1000 },
    features: ["Everything in Free", "Lead capture & conversion", "Saved views & bulk actions", "Email & call logging", "Heuristic lead scoring"],
  },
  {
    key: "pro",
    name: "Pro",
    priceEur: 79,
    tagline: "The full sales workflow with AI.",
    limits: { users: 15, companies: 10000, contacts: 25000, deals: 10000 },
    features: ["Everything in Starter", "Quotes & products", "Automation & follow-ups", "Analytics dashboards", "AI assistant, analysis & outreach", "Priority support"],
    highlight: true,
  },
  {
    key: "business",
    name: "Business",
    priceEur: 199,
    tagline: "Scale with governance and SSO.",
    limits: { users: -1, companies: -1, contacts: -1, deals: -1 },
    features: ["Everything in Pro", "Unlimited records & seats", "Sajtpress SSO", "Audit log & roles", "Dedicated support"],
  },
];

export const DEFAULT_PLAN_KEY: PlanKey = "pro";

export function isPlanKey(v: string): v is PlanKey {
  return PLANS.some((p) => p.key === v);
}

export function getPlan(key: string): Plan | null {
  return PLANS.find((p) => p.key === key) ?? null;
}

/** "Unlimited" for -1, else a grouped number. */
export function formatLimit(limit: number): string {
  return limit < 0 ? "Unlimited" : limit.toLocaleString("en-US");
}

export type UsageState = "ok" | "warn" | "over";

export interface UsageStatus {
  used: number;
  limit: number;
  unlimited: boolean;
  /** 0–100 for the bar (0 when unlimited). */
  pct: number;
  state: UsageState;
}

/** Pure usage classification, shared by the action and tests. warn at ≥80% of the
 *  cap, over at ≥100%; unlimited (-1) is always ok. */
export function usageStatus(used: number, limit: number): UsageStatus {
  const u = Math.max(0, Math.floor(used || 0));
  if (limit < 0) return { used: u, limit, unlimited: true, pct: 0, state: "ok" };
  const ratio = limit <= 0 ? (u > 0 ? 1 : 0) : u / limit;
  const pct = Math.min(100, Math.round(ratio * 100));
  const state: UsageState = ratio >= 1 ? "over" : ratio >= 0.8 ? "warn" : "ok";
  return { used: u, limit, unlimited: false, pct, state };
}
