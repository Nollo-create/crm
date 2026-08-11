import { getAnalytics } from "@/lib/analytics";
import { Kpi, BarList, ChartCard } from "@/components/crm/charts";
import { eur } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function PipelineAnalyticsPage() {
  const a = await getAnalytics();
  const bar = (stage: string) => (stage === "won" ? "bg-emerald" : stage === "lost" ? "bg-danger" : "bg-electric");
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Pipeline analytics</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">Where value sits across the stages.</p>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Kpi label="Open pipeline" value={eur(a.deals.open)} />
        <Kpi label="Weighted" value={eur(a.deals.weighted)} sub="prob-adjusted" />
        <Kpi label="Open deals" value={String(a.deals.openCount)} />
        <Kpi label="Avg open deal" value={eur(a.deals.avgOpen)} />
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <ChartCard title="Value by stage">
          <BarList items={a.deals.byStage.map((s) => ({ label: s.label, value: s.value, display: eur(s.value), barClass: bar(s.stage) }))} />
        </ChartCard>
        <ChartCard title="Deal count by stage">
          <BarList items={a.deals.byStage.map((s) => ({ label: s.label, value: s.count, display: String(s.count), barClass: bar(s.stage) }))} />
        </ChartCard>
      </div>
    </div>
  );
}
