import { getAnalytics } from "@/lib/analytics";
import { BarList, ChartCard } from "@/components/crm/charts";
import { eur } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function TeamAnalyticsPage() {
  const a = await getAnalytics();
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Team performance</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">Won and open value by deal owner.</p>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <ChartCard title="Won by owner">
          <BarList items={a.owners.map((o) => ({ label: o.owner, value: o.won, display: eur(o.won), barClass: "bg-emerald" }))} empty="No owned deals yet." />
        </ChartCard>
        <ChartCard title="Open pipeline by owner">
          <BarList items={a.owners.map((o) => ({ label: o.owner, value: o.open, display: eur(o.open) }))} empty="No owned deals yet." />
        </ChartCard>
      </div>

      <ChartCard title="Deals by owner">
        <BarList items={a.owners.map((o) => ({ label: o.owner, value: o.n, display: String(o.n), barClass: "bg-royal" }))} empty="No owned deals yet." />
      </ChartCard>
    </div>
  );
}
