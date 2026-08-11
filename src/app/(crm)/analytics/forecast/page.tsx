import { getAnalytics } from "@/lib/analytics";
import { Kpi, BarList, ChartCard, monthLabel } from "@/components/crm/charts";
import { eur } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function ForecastAnalyticsPage() {
  const a = await getAnalytics();
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Revenue forecast</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">Open deals by expected close month, weighted by stage probability.</p>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        <Kpi label="Open pipeline" value={eur(a.deals.open)} />
        <Kpi label="Weighted total" value={eur(a.deals.weighted)} tone="text-emerald" sub="prob-adjusted" />
        <Kpi label="Open deals" value={String(a.deals.openCount)} />
      </div>

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
