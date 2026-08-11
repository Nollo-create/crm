import "server-only";
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
  owners: { owner: string; won: number; open: number; n: number }[];
  leads: { total: number; converted: number; conversionRate: number; byStatus: KV[]; bySource: KV[] };
  activities: { total: number; last30: number; byType: KV[] };
  quotes: { total: number; accepted: number; byStatus: (KV & { value: number })[] };
}

/** All CRM analytics in one pass — computed server-side, degrades to zeros if the
 *  DB is unreachable. Weighting + win rate use the canonical pipeline stages. */
export async function getAnalytics(): Promise<AnalyticsData> {
  const { organizationId: org } = await requireSession();
  const [companies, dealStage, owners, forecastRows, leadStatus, leadSource, actType, act30, quoteStatus] = await Promise.all([
    analyticsCompanies(org).catch(() => []),
    analyticsDealsByStage(org).catch(() => []),
    analyticsDealsByOwner(org).catch(() => []),
    analyticsDealForecast(org).catch(() => []),
    analyticsLeadsByStatus(org).catch(() => []),
    analyticsLeadsBySource(org).catch(() => []),
    analyticsActivitiesByType(org).catch(() => []),
    analyticsActivitiesLast30(org).catch(() => 0),
    analyticsQuotesByStatus(org).catch(() => []),
  ]);

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
  };
}
