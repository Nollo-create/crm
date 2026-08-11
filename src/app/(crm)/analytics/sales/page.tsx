import { getAnalytics } from "@/lib/analytics";
import { Kpi, BarList, ChartCard } from "@/components/crm/charts";
import { eur } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function SalesAnalyticsPage() {
  const a = await getAnalytics();
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Sales dashboard</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">Your CRM at a glance.</p>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        <Kpi label="Open pipeline" value={eur(a.deals.open)} />
        <Kpi label="Weighted" value={eur(a.deals.weighted)} sub="prob-adjusted" />
        <Kpi label="Won" value={eur(a.deals.won)} tone="text-emerald" />
        <Kpi label="Win rate" value={`${a.deals.winRate}%`} sub={`${a.deals.wonCount}W · ${a.deals.lostCount}L`} />
        <Kpi label="Customers" value={String(a.companies.customers)} />
        <Kpi label="Activity 30d" value={String(a.activities.last30)} />
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <ChartCard title="Pipeline value by stage">
          <BarList items={a.deals.byStage.map((s) => ({ label: s.label, value: s.value, display: eur(s.value), barClass: s.stage === "won" ? "bg-emerald" : s.stage === "lost" ? "bg-danger" : "bg-electric" }))} />
        </ChartCard>
        <ChartCard title="Deals by stage">
          <BarList items={a.deals.byStage.map((s) => ({ label: s.label, value: s.count, display: String(s.count) }))} />
        </ChartCard>
      </div>
    </div>
  );
}
