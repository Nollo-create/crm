"use client";

import { useEffect, useState } from "react";
import { Goal, ChevronLeft, ChevronRight, Trophy, TrendingUp, Users } from "lucide-react";
import { goalsBoardAction, setGoalAction, type GoalsBoard, type MetricGoal } from "@/lib/actions/goals";
import { shiftMonth, monthLabel, goalPct } from "@/lib/crm/goals";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { useCanWrite } from "@/components/crm/role-context";
import { eur } from "@/lib/format";
import { cn } from "@/lib/utils";

function currentMonth() {
  return new Date().toISOString().slice(0, 7);
}
const fmt = (v: number, money: boolean) => (money ? eur(v) : v.toLocaleString("en-US"));

function Bar({ pct }: { pct: number }) {
  const done = pct >= 100;
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
      <div className={cn("h-full rounded-full transition-all", done ? "bg-emerald" : "bg-electric")} style={{ width: `${Math.min(100, pct)}%` }} />
    </div>
  );
}

function TargetInput({ value, onSave, disabled, money }: { value: number; onSave: (n: number) => void; disabled?: boolean; money?: boolean }) {
  const [v, setV] = useState(value ? String(value) : "");
  useEffect(() => setV(value ? String(value) : ""), [value]);
  return (
    <span className="inline-flex items-center gap-1 text-2xs text-muted-foreground">
      {money && "€"}
      <input
        type="number"
        min={0}
        value={v}
        disabled={disabled}
        onChange={(e) => setV(e.target.value)}
        onBlur={() => { const n = Math.max(0, Math.round(Number(v) || 0)); if (n !== value) onSave(n); }}
        onKeyDown={(e) => { if (e.key === "Enter") e.currentTarget.blur(); }}
        placeholder="—"
        className="h-6 w-20 rounded border border-input bg-background px-1.5 text-right text-2xs outline-none focus:border-electric disabled:opacity-60"
      />
    </span>
  );
}

const METRICS: { key: "revenue" | "dealsWon" | "newLeads"; metric: string; label: string; money: boolean; icon: typeof Trophy }[] = [
  { key: "revenue", metric: "revenue", label: "Revenue won", money: true, icon: TrendingUp },
  { key: "dealsWon", metric: "deals_won", label: "Deals won", money: false, icon: Trophy },
  { key: "newLeads", metric: "new_leads", label: "New leads", money: false, icon: Users },
];

export function GoalsView() {
  const { toast } = useToast();
  const canWrite = useCanWrite();
  const [period, setPeriod] = useState(currentMonth());
  const [board, setBoard] = useState<GoalsBoard | null>(null);

  function load(p: string) {
    setBoard(null);
    goalsBoardAction(p).then(setBoard).catch(() => setBoard(null));
  }
  useEffect(() => { load(period); }, [period]);

  async function save(ownerUserId: number, metric: string, target: number) {
    const r = await setGoalAction({ ownerUserId, metric, periodMonth: period, target });
    if (r.error) return toast(r.error, { tone: "error" });
    load(period);
  }

  const isThisMonth = period === currentMonth();
  const repsByRevenue = board ? [...board.reps].sort((a, b) => b.revenue.actual - a.revenue.actual) : [];
  const hasUnassigned = board && (board.unassigned.revenue > 0 || board.unassigned.dealsWon > 0 || board.unassigned.newLeads > 0);

  return (
    <div className="max-w-3xl space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-semibold tracking-tight"><Goal size={18} className="text-electric" /> Goals & Quotas</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">Monthly targets and how the team is tracking against them.</p>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => setPeriod((p) => shiftMonth(p, -1))} className="grid h-8 w-8 place-items-center rounded-lg border border-border text-muted-foreground hover:text-foreground" aria-label="Previous month"><ChevronLeft size={15} /></button>
          <span className="min-w-[130px] text-center text-sm font-medium">{monthLabel(period)}</span>
          <button onClick={() => setPeriod((p) => shiftMonth(p, 1))} disabled={isThisMonth} className="grid h-8 w-8 place-items-center rounded-lg border border-border text-muted-foreground hover:text-foreground disabled:opacity-40" aria-label="Next month"><ChevronRight size={15} /></button>
        </div>
      </div>

      {!board ? (
        <div className="space-y-3"><div className="grid gap-3 sm:grid-cols-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-28 w-full" />)}</div><Skeleton className="h-48 w-full" /></div>
      ) : (
        <>
          {/* Team targets */}
          <div className="grid gap-3 sm:grid-cols-3">
            {METRICS.map(({ key, metric, label, money, icon: Icon }) => {
              const g: MetricGoal = board.team[key];
              const pct = goalPct(g.actual, g.target);
              return (
                <Card key={key} className="space-y-2 p-4">
                  <p className="flex items-center gap-1.5 text-2xs font-medium uppercase tracking-wide text-muted-foreground"><Icon size={12} /> {label}</p>
                  <p className="text-xl font-semibold tabular">{fmt(g.actual, money)}</p>
                  <Bar pct={pct} />
                  <div className="flex items-center justify-between">
                    <span className="text-2xs text-muted-foreground">{g.target > 0 ? `${pct}% of goal` : "No goal set"}</span>
                    <span className="flex items-center gap-1 text-2xs text-muted-foreground">Goal <TargetInput value={g.target} money={money} disabled={!canWrite} onSave={(n) => save(0, metric, n)} /></span>
                  </div>
                </Card>
              );
            })}
          </div>

          {/* Rep leaderboard */}
          <Card className="p-0">
            <div className="border-b border-border px-4 py-3">
              <p className="flex items-center gap-2 text-sm font-semibold"><Trophy size={15} className="text-warning" /> Team leaderboard</p>
              <p className="text-2xs text-muted-foreground">Ranked by revenue won this month. Revenue quota is editable.</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-sm">
                <thead className="border-b border-border text-2xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="px-4 py-2 text-left font-medium">Rep</th>
                    <th className="px-3 py-2 text-left font-medium">Revenue won</th>
                    <th className="px-3 py-2 text-right font-medium">Quota</th>
                    <th className="px-3 py-2 text-right font-medium">Deals</th>
                    <th className="px-3 py-2 text-right font-medium">Leads</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {repsByRevenue.length === 0 ? (
                    <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">No active team members.</td></tr>
                  ) : (
                    repsByRevenue.map((r, i) => {
                      const pct = goalPct(r.revenue.actual, r.revenue.target);
                      return (
                        <tr key={r.userId} className="hover:bg-secondary/40">
                          <td className="px-4 py-2.5">
                            <span className="flex items-center gap-2">
                              <span className={cn("grid h-5 w-5 shrink-0 place-items-center rounded-full text-2xs font-semibold", i === 0 ? "bg-warning/15 text-warning" : "bg-secondary text-muted-foreground")}>{i + 1}</span>
                              <span className="truncate font-medium">{r.name}</span>
                            </span>
                          </td>
                          <td className="px-3 py-2.5">
                            <p className="tabular font-medium">{eur(r.revenue.actual)}</p>
                            {r.revenue.target > 0 && <div className="mt-1 w-28"><Bar pct={pct} /></div>}
                          </td>
                          <td className="px-3 py-2.5 text-right"><TargetInput value={r.revenue.target} money disabled={!canWrite} onSave={(n) => save(r.userId, "revenue", n)} /></td>
                          <td className="px-3 py-2.5 text-right tabular text-muted-foreground">{r.dealsWon.actual}</td>
                          <td className="px-3 py-2.5 text-right tabular text-muted-foreground">{r.newLeads.actual}</td>
                        </tr>
                      );
                    })
                  )}
                  {hasUnassigned && (
                    <tr className="bg-secondary/20 text-muted-foreground">
                      <td className="px-4 py-2.5 italic">Unassigned</td>
                      <td className="px-3 py-2.5 tabular">{eur(board.unassigned.revenue)}</td>
                      <td className="px-3 py-2.5" />
                      <td className="px-3 py-2.5 text-right tabular">{board.unassigned.dealsWon}</td>
                      <td className="px-3 py-2.5 text-right tabular">{board.unassigned.newLeads}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
