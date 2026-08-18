import { getAnalytics } from "@/lib/analytics";
import { Kpi, BarList, ChartCard, TrendBars } from "@/components/crm/charts";
import { LEAD_STATUS_LABEL, LEAD_SOURCE_LABEL } from "@/lib/crm/leads";

export const dynamic = "force-dynamic";

export default async function ConversionAnalyticsPage() {
  const a = await getAnalytics();
  const acceptCount = a.quotes.byStatus.find((q) => q.key === "accepted")?.n ?? 0;
  const acceptRate = a.quotes.total ? Math.round((acceptCount / a.quotes.total) * 100) : 0;

  const funnel = [
    { label: "Leads", value: a.leads.total, barClass: "bg-electric" },
    { label: "Converted", value: a.leads.converted, barClass: "bg-royal" },
    { label: "Customers", value: a.companies.customers, barClass: "bg-emerald" },
    { label: "Won deals", value: a.deals.wonCount, barClass: "bg-emerald" },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Conversion</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">How leads move to won business.</p>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
        <Kpi label="Lead conversion" value={`${a.leads.conversionRate}%`} sub={`${a.leads.converted} of ${a.leads.total}`} tone="text-emerald" />
        <Kpi label="Win rate" value={`${a.deals.winRate}%`} sub={`${a.deals.wonCount}W · ${a.deals.lostCount}L`} />
        <Kpi label="Quote acceptance" value={`${acceptRate}%`} sub={`${acceptCount} of ${a.quotes.total}`} />
        <Kpi label="Total leads" value={String(a.leads.total)} />
        <Kpi label="Customers" value={String(a.companies.customers)} />
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <ChartCard title="Conversion funnel" subtitle="from lead to won">
          <BarList items={funnel.map((f) => ({ label: f.label, value: f.value, display: String(f.value), barClass: f.barClass }))} empty="No leads yet." />
        </ChartCard>
        <ChartCard title="New leads" subtitle="captured per month · last 12 months">
          <TrendBars points={a.trends.leadsByMonth.map((m) => ({ month: m.month, value: m.value, display: String(m.value) }))} barClass="bg-electric" empty="No leads captured in the last 12 months." />
        </ChartCard>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <ChartCard title="Leads by status">
          <BarList items={a.leads.byStatus.map((s) => ({ label: LEAD_STATUS_LABEL[s.key as keyof typeof LEAD_STATUS_LABEL] ?? s.key, value: s.n, display: String(s.n), barClass: s.key === "converted" ? "bg-emerald" : s.key === "unqualified" ? "bg-muted-foreground" : "bg-electric" }))} empty="No leads yet." />
        </ChartCard>
        <ChartCard title="Leads by source">
          <BarList items={a.leads.bySource.map((s) => ({ label: LEAD_SOURCE_LABEL[s.key as keyof typeof LEAD_SOURCE_LABEL] ?? s.key, value: s.n, display: String(s.n), barClass: "bg-royal" }))} empty="No leads yet." />
        </ChartCard>
      </div>

      <ChartCard title="Company base">
        <BarList
          items={[
            { label: "Leads", value: a.companies.leads, display: String(a.companies.leads) },
            { label: "Customers", value: a.companies.customers, display: String(a.companies.customers), barClass: "bg-emerald" },
            { label: "At risk", value: a.companies.atRisk, display: String(a.companies.atRisk), barClass: "bg-danger" },
          ]}
        />
      </ChartCard>
    </div>
  );
}
