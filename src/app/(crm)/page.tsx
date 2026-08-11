import Link from "next/link";
import { Building2, Sparkles, TrendingUp, Trophy, Target, Percent, ArrowRight, Database } from "lucide-react";
import { dashboardAction, type DashboardData } from "@/lib/actions/crm";
import { OPEN_STAGES } from "@/lib/crm/pipeline";
import { eur } from "@/lib/format";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

function Stat({ label, value, Icon, accent }: { label: string; value: string; Icon: typeof Building2; accent?: string }) {
  return (
    <div className="glass rounded-xl p-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">{label}</p>
        <Icon size={15} className={accent ?? "text-muted-foreground"} />
      </div>
      <p className="mt-1.5 text-xl font-semibold">{value}</p>
    </div>
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
          <Database className="mx-auto mb-3 text-muted-foreground" />
          <p className="text-sm font-medium">Database not connected</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Set the <code>DB_*</code> environment variables and restart, then this dashboard fills in.
          </p>
        </div>
      </div>
    );
  }

  const s = data.summary;
  const maxStage = Math.max(1, ...OPEN_STAGES.map((st) => s.byStage[st.id].value));

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Sales overview</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">Your B2B pipeline at a glance.</p>
        </div>
        <Link
          href="/companies"
          className="inline-flex items-center gap-1.5 rounded-lg bg-electric px-3 py-2 text-sm font-medium text-white hover:bg-electric/90"
        >
          <Building2 size={15} /> Companies
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <Stat label="Open pipeline" value={eur(s.open)} Icon={TrendingUp} accent="text-electric" />
        <Stat label="Weighted pipeline" value={eur(s.weighted)} Icon={Percent} accent="text-royal" />
        <Stat label="Won" value={eur(s.won)} Icon={Trophy} accent="text-emerald" />
        <Stat label="Win rate" value={`${s.winRate}%`} Icon={Percent} />
        <Stat label="Companies" value={String(data.companies)} Icon={Building2} />
        <Stat label="Open leads" value={String(data.leads)} Icon={Target} accent="text-warning" />
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="glass rounded-2xl p-5">
          <p className="text-sm font-semibold">Pipeline by stage</p>
          <div className="mt-3 space-y-2">
            {OPEN_STAGES.map((st) => {
              const b = s.byStage[st.id];
              return (
                <div key={st.id} className="flex items-center gap-3 text-xs">
                  <span className="w-24 shrink-0 text-muted-foreground">{st.label}</span>
                  <div className="h-2.5 flex-1 rounded-full bg-secondary">
                    <div className="h-2.5 rounded-full bg-electric" style={{ width: `${(b.value / maxStage) * 100}%` }} />
                  </div>
                  <span className="w-24 shrink-0 text-right tabular-nums">
                    {b.count} · {eur(b.value)}
                  </span>
                </div>
              );
            })}
            {s.openCount === 0 && <p className="text-xs text-muted-foreground">No open deals yet.</p>}
          </div>
        </div>

        <div className="glass-strong rounded-2xl border border-royal/30 bg-royal/5 p-5">
          <p className="flex items-center gap-2 text-sm font-semibold text-royal">
            <Sparkles size={15} /> AI priorities
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            Daily briefing, lead scoring and next-best-action land in a later stage — they&apos;ll call the Sajtpress
            agents (Crawl, Sales, Email) once the integration is on.
          </p>
          <span className="mt-3 inline-block rounded bg-secondary px-2 py-0.5 text-[10px] font-semibold uppercase text-muted-foreground">
            soon
          </span>
        </div>
      </div>

      {data.recent.length > 0 && (
        <div className="glass rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold">Recent companies</p>
            <Link href="/companies" className="flex items-center gap-1 text-xs text-electric hover:underline">
              All <ArrowRight size={12} />
            </Link>
          </div>
          <div className="mt-3 divide-y divide-border">
            {data.recent.map((c) => (
              <Link key={c.id} href={`/companies/${c.id}`} className="flex items-center justify-between gap-3 py-2.5 text-sm hover:text-electric">
                <span className="truncate font-medium">{c.name}</span>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {[c.industry, c.city].filter(Boolean).join(" · ") || "—"}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
