import { getAnalytics } from "@/lib/analytics";
import { Kpi, BarList, ChartCard, TrendBars } from "@/components/crm/charts";
import { STAGES } from "@/lib/crm/pipeline";
import { eur } from "@/lib/format";

export const dynamic = "force-dynamic";

const bar = (stage: string) => (stage === "won" ? "bg-emerald" : stage === "lost" ? "bg-danger" : "bg-electric");

export default async function PipelineAnalyticsPage() {
  const a = await getAnalytics();
  const coverage = a.deals.open > 0 ? Math.round((a.deals.weighted / a.deals.open) * 100) : 0;
  const newThisMonth = a.trends.dealsCreatedByMonth[a.trends.dealsCreatedByMonth.length - 1] ?? { value: 0, count: 0 };
  const openStages = STAGES.filter((s) => s.open);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Pipeline analytics</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">Where value sits, what&apos;s flowing in, and the deals that matter most.</p>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        <Kpi label="Open pipeline" value={eur(a.deals.open)} />
        <Kpi label="Weighted" value={eur(a.deals.weighted)} sub="prob-adjusted" />
        <Kpi label="Coverage" value={`${coverage}%`} sub="weighted / gross" />
        <Kpi label="Open deals" value={String(a.deals.openCount)} />
        <Kpi label="Avg open deal" value={eur(a.deals.avgOpen)} />
        <Kpi label="New this month" value={eur(newThisMonth.value)} sub={`${newThisMonth.count} deal${newThisMonth.count === 1 ? "" : "s"}`} />
      </div>

      <ChartCard title="New pipeline created" subtitle="deal value added per month · last 12 months">
        <TrendBars points={a.trends.dealsCreatedByMonth.map((m) => ({ month: m.month, value: m.value, display: eur(m.value) }))} barClass="bg-royal" empty="No deals created in the last 12 months." />
      </ChartCard>

      <div className="grid gap-3 lg:grid-cols-2">
        <ChartCard title="Value by stage">
          <BarList items={a.deals.byStage.map((s) => ({ label: s.label, value: s.value, display: eur(s.value), barClass: bar(s.stage) }))} />
        </ChartCard>
        <ChartCard title="Deal count by stage">
          <BarList items={a.deals.byStage.map((s) => ({ label: s.label, value: s.count, display: String(s.count), barClass: bar(s.stage) }))} />
        </ChartCard>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <ChartCard title="Biggest open deals" subtitle="top 8 by value">
          <BarList items={a.topOpenDeals.map((d) => ({ label: `${d.title} · ${d.companyName}`, value: d.value, display: eur(d.value) }))} empty="No open deals yet." />
        </ChartCard>
        <ChartCard title="Stage win probability" subtitle="weighting applied to each open stage">
          <BarList items={openStages.map((s) => ({ label: s.label, value: s.probability, display: `${s.probability}%`, barClass: "bg-emerald" }))} />
        </ChartCard>
      </div>
    </div>
  );
}
