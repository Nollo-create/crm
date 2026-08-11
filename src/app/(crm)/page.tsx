import Link from "next/link";
import { Sparkles, TrendingUp, Trophy, Percent, Building2, Target, ArrowRight, Database, Wallet, Users } from "lucide-react";
import { dashboardAction, type DashboardData } from "@/lib/actions/crm";
import { OPEN_STAGES, stageLabel, weightedValue } from "@/lib/crm/pipeline";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { eur } from "@/lib/format";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

function Tile({ label, value, Icon, tone }: { label: string; value: string; Icon: typeof Wallet; tone?: string }) {
  return (
    <Card className="p-3.5">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">{label}</p>
        <Icon size={14} className={tone ?? "text-muted-foreground/70"} />
      </div>
      <p className="mt-1.5 text-lg font-semibold tabular">{value}</p>
    </Card>
  );
}

export default async function Dashboard() {
  let data: DashboardData | null = null;
  try {
    data = await dashboardAction();
  } catch {
    data = null;
  }

  if (!data) {
    return (
      <div className="grid min-h-[60vh] place-items-center text-center">
        <div className="max-w-sm">
          <div className="mx-auto mb-3 grid h-11 w-11 place-items-center rounded-xl bg-secondary text-muted-foreground">
            <Database size={18} />
          </div>
          <p className="text-sm font-medium">Database not connected</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Set the <code className="rounded bg-secondary px-1">DB_*</code> environment variables and restart — the
            dashboard then fills in.
          </p>
        </div>
      </div>
    );
  }

  const s = data.summary;
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const nearClose = s.byStage.negotiation.count + s.byStage.quote.count;
  const maxStage = Math.max(1, ...OPEN_STAGES.map((st) => s.byStage[st.id].value));

  // Honest, data-driven priorities (the smart AI prioritisation arrives later).
  const priorities: { text: string; href: string; cta: string; dot: string }[] = [];
  if (s.openCount) priorities.push({ text: `${s.openCount} open deals worth ${eur(s.open)} in play`, href: "/pipeline", cta: "Open pipeline", dot: "bg-electric" });
  if (nearClose) priorities.push({ text: `${nearClose} deals near close (quote / negotiation)`, href: "/pipeline", cta: "Review", dot: "bg-emerald" });
  if (data.leads) priorities.push({ text: `${data.leads} leads waiting to be qualified`, href: "/companies", cta: "Qualify", dot: "bg-warning" });
  if (!data.companies) priorities.push({ text: "No companies yet — add your first account to get started", href: "/companies", cta: "Add company", dot: "bg-muted-foreground" });

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">{greeting}</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">Here&apos;s what needs your attention today.</p>
        </div>
        <p className="text-xs text-muted-foreground">
          {new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}
        </p>
      </div>

      {/* KPI tiles */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-6">
        <Tile label="Open pipeline" value={eur(s.open)} Icon={TrendingUp} tone="text-electric" />
        <Tile label="Weighted" value={eur(s.weighted)} Icon={Percent} tone="text-royal" />
        <Tile label="Won" value={eur(s.won)} Icon={Trophy} tone="text-emerald" />
        <Tile label="Win rate" value={`${s.winRate}%`} Icon={Percent} />
        <Tile label="Companies" value={String(data.companies)} Icon={Building2} />
        <Tile label="Open leads" value={String(data.leads)} Icon={Target} tone="text-warning" />
      </div>

      {/* AI priorities */}
      <div className="ai-surface p-4 sm:p-5">
        <div className="flex items-center justify-between">
          <p className="flex items-center gap-2 text-sm font-semibold">
            <Sparkles size={15} className="text-royal" /> Priorities
          </p>
          <span className="soon-badge">AI · soon</span>
        </div>
        <div className="mt-3 space-y-1.5">
          {priorities.length === 0 ? (
            <p className="text-sm text-muted-foreground">You&apos;re all caught up.</p>
          ) : (
            priorities.map((p, i) => (
              <div key={i} className="flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-2.5">
                <span className={cn("h-2 w-2 shrink-0 rounded-full", p.dot)} />
                <span className="flex-1 text-sm">{p.text}</span>
                <Link href={p.href} className="shrink-0 text-xs font-medium text-electric hover:underline">
                  {p.cta}
                </Link>
              </div>
            ))
          )}
        </div>
        <p className="mt-2.5 text-2xs text-muted-foreground">
          Smart prioritisation — opened proposals, buying intent, next best action — arrives with the AI phase.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
        {/* Pipeline snapshot */}
        <Card className="p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold">Pipeline</p>
            <Link href="/pipeline" className="flex items-center gap-1 text-xs text-electric hover:underline">
              Board <ArrowRight size={12} />
            </Link>
          </div>
          <div className="mt-3 space-y-2">
            {OPEN_STAGES.map((st) => {
              const b = s.byStage[st.id];
              return (
                <Link key={st.id} href="/pipeline" className="flex items-center gap-3 text-xs hover:opacity-80">
                  <span className="w-24 shrink-0 text-muted-foreground">{st.label}</span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-secondary">
                    <div className="h-2 rounded-full bg-electric/80" style={{ width: `${(b.value / maxStage) * 100}%` }} />
                  </div>
                  <span className="w-24 shrink-0 text-right tabular text-muted-foreground">
                    {b.count} · {eur(b.value)}
                  </span>
                </Link>
              );
            })}
            {s.openCount === 0 && <p className="text-xs text-muted-foreground">No open deals yet.</p>}
          </div>
        </Card>

        {/* Deals to watch */}
        <Card className="p-4 sm:p-5">
          <p className="text-sm font-semibold">Deals to watch</p>
          <div className="mt-3 space-y-1">
            {data.focusDeals.length === 0 ? (
              <p className="text-xs text-muted-foreground">No open deals to show.</p>
            ) : (
              data.focusDeals.map((d) => (
                <Link key={d.id} href={`/companies/${d.companyId}`} className="block rounded-lg px-2 py-1.5 hover:bg-secondary">
                  <div className="flex items-center justify-between gap-2">
                    <p className="min-w-0 truncate text-sm font-medium">{d.companyName}</p>
                    <span className="shrink-0 text-sm font-semibold tabular">{eur(d.value)}</span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <p className="min-w-0 truncate text-2xs text-muted-foreground">{d.title}</p>
                    <Badge tone="neutral">{stageLabel(d.stage)}</Badge>
                  </div>
                </Link>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
