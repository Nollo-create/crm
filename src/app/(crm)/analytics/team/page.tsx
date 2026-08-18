import { getAnalytics } from "@/lib/analytics";
import { Kpi, BarList, ChartCard } from "@/components/crm/charts";
import { eur } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function TeamAnalyticsPage() {
  const a = await getAnalytics();
  const owners = a.owners;
  const teamWon = owners.reduce((s, o) => s + o.won, 0);
  const teamOpen = owners.reduce((s, o) => s + o.open, 0);
  const top = owners[0];

  const winRates = owners.map((o) => {
    const closed = o.wonCount + o.lostCount;
    return { owner: o.owner, rate: closed ? Math.round((o.wonCount / closed) * 100) : 0, closed };
  });
  const avgWon = owners.map((o) => ({ owner: o.owner, avg: o.wonCount ? Math.round(o.won / o.wonCount) : 0 }));

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Team performance</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">Won and open value, win rate and average deal size by owner.</p>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Kpi label="Owners" value={String(owners.length)} />
        <Kpi label="Top performer" value={top ? top.owner : "—"} sub={top ? eur(top.won) + " won" : undefined} />
        <Kpi label="Team won" value={eur(teamWon)} tone="text-emerald" />
        <Kpi label="Team open" value={eur(teamOpen)} />
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <ChartCard title="Won by owner">
          <BarList items={owners.map((o) => ({ label: o.owner, value: o.won, display: eur(o.won), barClass: "bg-emerald" }))} empty="No owned deals yet." />
        </ChartCard>
        <ChartCard title="Open pipeline by owner">
          <BarList items={owners.map((o) => ({ label: o.owner, value: o.open, display: eur(o.open) }))} empty="No owned deals yet." />
        </ChartCard>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <ChartCard title="Win rate by owner" subtitle="won ÷ closed deals">
          <BarList items={winRates.map((o) => ({ label: o.owner, value: o.rate, display: o.closed ? `${o.rate}%` : "—", barClass: "bg-royal" }))} empty="No closed deals yet." />
        </ChartCard>
        <ChartCard title="Average won deal by owner">
          <BarList items={avgWon.map((o) => ({ label: o.owner, value: o.avg, display: eur(o.avg) }))} empty="No won deals yet." />
        </ChartCard>
      </div>

      <ChartCard title="Deals by owner">
        <BarList items={owners.map((o) => ({ label: o.owner, value: o.n, display: String(o.n), barClass: "bg-royal" }))} empty="No owned deals yet." />
      </ChartCard>
    </div>
  );
}
