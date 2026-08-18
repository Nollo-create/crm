import { getAnalytics } from "@/lib/analytics";
import { Kpi, BarList, ChartCard, TrendBars, monthLabel } from "@/components/crm/charts";
import { eur } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function ForecastAnalyticsPage() {
  const a = await getAnalytics();
  const wonLast12 = a.trends.wonByMonth.reduce((s, m) => s + m.value, 0);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Revenue forecast</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">Open deals by expected close month, weighted by stage probability — with what you&apos;ve actually won behind it.</p>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Kpi label="Best case" value={eur(a.deals.open)} sub="full open value" />
        <Kpi label="Likely" value={eur(a.deals.weighted)} tone="text-emerald" sub="prob-adjusted" />
        <Kpi label="Won · last 12mo" value={eur(wonLast12)} sub="closed to date" />
        <Kpi label="Open deals" value={String(a.deals.openCount)} />
      </div>

      <ChartCard title="Won revenue" subtitle="what actually closed · last 12 months">
        <TrendBars points={a.trends.wonByMonth.map((m) => ({ month: m.month, value: m.value, display: eur(m.value) }))} barClass="bg-emerald" empty="No won deals in the last 12 months." />
      </ChartCard>

      <div className="grid gap-3 lg:grid-cols-2">
        <ChartCard title="Weighted forecast by month" subtitle="probability-adjusted">
          <BarList items={a.forecast.map((f) => ({ label: monthLabel(f.month), value: f.weighted, display: eur(f.weighted), barClass: "bg-emerald" }))} empty="No dated open deals." />
        </ChartCard>
        <ChartCard title="Gross pipeline by month" subtitle="full deal value">
          <BarList items={a.forecast.map((f) => ({ label: monthLabel(f.month), value: f.expected, display: eur(f.expected) }))} empty="No dated open deals." />
        </ChartCard>
      </div>
    </div>
  );
}
