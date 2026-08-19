import "server-only";
import { unstable_cache } from "next/cache";
import { requireSession } from "@/lib/auth/session";
import { STAGES, stage as stageOf, type StageId } from "@/lib/crm/pipeline";
import {
  analyticsCompanies,
  analyticsDealsByStage,
  analyticsDealsByOwner,
  analyticsDealForecast,
  analyticsLeadsByStatus,
  analyticsLeadsBySource,
  analyticsActivitiesByType,
  analyticsActivitiesLast30,
  analyticsQuotesByStatus,
  analyticsWonByMonth,
  analyticsActivitiesByMonth,
  analyticsLeadsByMonth,
  analyticsDealsCreatedByMonth,
  analyticsTopOpenDeals,
} from "@/lib/db";

export interface KV {
  key: string;
  n: number;
}

export interface AnalyticsData {
  companies: { total: number; leads: number; customers: number; atRisk: number; arr: number };
  deals: {
    byStage: { stage: StageId; label: string; count: number; value: number }[];
    open: number;
    openCount: number;
    weighted: number;
    won: number;
    wonCount: number;
    lostCount: number;
    winRate: number;
    avgOpen: number;
  };
  forecast: { month: string; expected: number; weighted: number }[];
  owners: { owner: string; won: number; open: number; n: number; wonCount: number; lostCount: number }[];
  leads: { total: number; converted: number; conversionRate: number; byStatus: KV[]; bySource: KV[] };
  activities: { total: number; last30: number; byType: KV[] };
  quotes: { total: number; accepted: number; byStatus: (KV & { value: number })[] };
  trends: {
    wonByMonth: { month: string; value: number; count: number }[];
    activitiesByMonth: { month: string; value: number }[];
    leadsByMonth: { month: string; value: number }[];
    dealsCreatedByMonth: { month: string; value: number; count: number }[];
  };
  topOpenDeals: { id: number; title: string; companyName: string; value: number; stage: string }[];
}

/** Last 12 calendar months as "YYYY-MM", oldest→newest (server runtime; new Date
 *  is fine here — the workflow-script ban doesn't apply to app code). */
function last12Months(): string[] {
  const now = new Date();
  const out: string[] = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    out.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }
  return out;
}

/** All CRM analytics in one pass — computed server-side, degrades to zeros if the
 *  DB is unreachable. Weighting + win rate use the canonical pipeline stages. */
const computeAnalytics = unstable_cache(
  async (org: number): Promise<AnalyticsData> => {
  const [companies, dealStage, owners, forecastRows, leadStatus, leadSource, actType, act30, quoteStatus, wonMonth, actMonth, leadMonth, dealMonth] = await Promise.all([
    analyticsCompanies(org).catch(() => []),
    analyticsDealsByStage(org).catch(() => []),
    analyticsDealsByOwner(org).catch(() => []),
    analyticsDealForecast(org).catch(() => []),
    analyticsLeadsByStatus(org).catch(() => []),
    analyticsLeadsBySource(org).catch(() => []),
    analyticsActivitiesByType(org).catch(() => []),
    analyticsActivitiesLast30(org).catch(() => 0),
    analyticsQuotesByStatus(org).catch(() => []),
    analyticsWonByMonth(org).catch(() => []),
    analyticsActivitiesByMonth(org).catch(() => []),
    analyticsLeadsByMonth(org).catch(() => []),
    analyticsDealsCreatedByMonth(org).catch(() => []),
  ]);
  const topOpenDeals = await analyticsTopOpenDeals(org, 8).catch(() => []);

  const axis = last12Months();
  const wonM = new Map(wonMonth.map((r) => [r.month, r]));
  const actM = new Map(actMonth.map((r) => [r.month, r]));
  const leadM = new Map(leadMonth.map((r) => [r.month, r]));
  const dealM = new Map(dealMonth.map((r) => [r.month, r]));
  const trends = {
    wonByMonth: axis.map((m) => ({ month: m, value: wonM.get(m)?.v ?? 0, count: wonM.get(m)?.n ?? 0 })),
    activitiesByMonth: axis.map((m) => ({ month: m, value: actM.get(m)?.n ?? 0 })),
    leadsByMonth: axis.map((m) => ({ month: m, value: leadM.get(m)?.n ?? 0 })),
    dealsCreatedByMonth: axis.map((m) => ({ month: m, value: dealM.get(m)?.v ?? 0, count: dealM.get(m)?.n ?? 0 })),
  };

  const cmap = new Map(companies.map((c) => [c.status, c]));
  const companiesData = {
    total: companies.reduce((s, c) => s + c.n, 0),
    leads: cmap.get("lead")?.n ?? 0,
    customers: cmap.get("customer")?.n ?? 0,
    atRisk: cmap.get("at_risk")?.n ?? 0,
    arr: (cmap.get("customer")?.value ?? 0) + (cmap.get("at_risk")?.value ?? 0),
  };

  const smap = new Map(dealStage.map((d) => [d.status, d]));
  const byStage = STAGES.map((s) => ({ stage: s.id, label: s.label, count: smap.get(s.id)?.n ?? 0, value: smap.get(s.id)?.value ?? 0 }));
  let open = 0;
  let openCount = 0;
  let weighted = 0;
  for (const s of STAGES) {
    if (!s.open) continue;
    const row = smap.get(s.id);
    open += row?.value ?? 0;
    openCount += row?.n ?? 0;
    weighted += (row?.value ?? 0) * (s.probability / 100);
  }
  const won = smap.get("won")?.value ?? 0;
  const wonCount = smap.get("won")?.n ?? 0;
  const lostCount = smap.get("lost")?.n ?? 0;
  const closed = wonCount + lostCount;

  const fmap = new Map<string, { expected: number; weighted: number }>();
  for (const r of forecastRows) {
    const prob = stageOf(r.stage as StageId).probability;
    const cur = fmap.get(r.month) ?? { expected: 0, weighted: 0 };
    cur.expected += r.value;
    cur.weighted += r.value * (prob / 100);
    fmap.set(r.month, cur);
  }
  const forecast = [...fmap.entries()]
    .sort((a, b) => (a[0] < b[0] ? -1 : 1))
    .slice(0, 12)
    .map(([month, v]) => ({ month, expected: v.expected, weighted: Math.round(v.weighted) }));

  const leadTotal = leadStatus.reduce((s, l) => s + l.n, 0);
  const converted = leadStatus.find((l) => l.status === "converted")?.n ?? 0;

  return {
    companies: companiesData,
    deals: {
      byStage,
      open,
      openCount,
      weighted: Math.round(weighted),
      won,
      wonCount,
      lostCount,
      winRate: closed ? Math.round((wonCount / closed) * 100) : 0,
      avgOpen: openCount ? Math.round(open / openCount) : 0,
    },
    forecast,
    owners,
    leads: {
      total: leadTotal,
      converted,
      conversionRate: leadTotal ? Math.round((converted / leadTotal) * 100) : 0,
      byStatus: leadStatus.map((l) => ({ key: l.status, n: l.n })),
      bySource: leadSource.map((l) => ({ key: l.status, n: l.n })),
    },
    activities: { total: actType.reduce((s, a) => s + a.n, 0), last30: act30, byType: actType.map((a) => ({ key: a.status, n: a.n })) },
    quotes: {
      total: quoteStatus.reduce((s, q) => s + q.n, 0),
      accepted: (quoteStatus.find((q) => q.status === "accepted")?.value ?? 0) / 100,
      byStatus: quoteStatus.map((q) => ({ key: q.status, n: q.n, value: q.value / 100 })),
    },
    trends,
    topOpenDeals,
  };
  },
  ["crm-analytics"],
  { revalidate: 60 }
);

/** Analytics for the caller's org. The heavy aggregate pass is cached for 60s
 *  (keyed by org) — these dashboards don't need to be real-time, and a user
 *  clicking across the five analytics tabs now shares one computation. */
export async function getAnalytics(): Promise<AnalyticsData> {
  const { organizationId: org } = await requireSession();
  return computeAnalytics(org);
}
