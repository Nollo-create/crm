"use client";

import { useEffect, useState } from "react";
import { Coins, ChevronLeft, ChevronRight, CheckCircle2, Undo2, Loader2 } from "lucide-react";
import { commissionsBoardAction, setCommissionRateAction, markCommissionPaidAction, revertCommissionAction, type CommissionBoard } from "@/lib/actions/commissions";
import { shiftMonth, monthLabel } from "@/lib/crm/goals";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { useCanWrite } from "@/components/crm/role-context";
import { eur } from "@/lib/format";
import { cn } from "@/lib/utils";

function currentMonth() {
  return new Date().toISOString().slice(0, 7);
}
const money2 = (cents: number) => "€" + (cents / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function RateInput({ value, onSave, disabled }: { value: number; onSave: (n: number) => void; disabled?: boolean }) {
  const [v, setV] = useState(String(value ?? ""));
  useEffect(() => setV(String(value ?? "")), [value]);
  return (
    <span className="inline-flex items-center gap-0.5 text-2xs text-muted-foreground">
      <input
        type="number"
        min={0}
        step="0.5"
        value={v}
        disabled={disabled}
        onChange={(e) => setV(e.target.value)}
        onBlur={() => { const n = Math.max(0, Number(v) || 0); if (n !== value) onSave(n); }}
        onKeyDown={(e) => { if (e.key === "Enter") e.currentTarget.blur(); }}
        className="h-6 w-14 rounded border border-input bg-background px-1.5 text-right text-2xs outline-none focus:border-electric disabled:opacity-60"
      />
      %
    </span>
  );
}

export function CommissionsView() {
  const { toast } = useToast();
  const canWrite = useCanWrite();
  const [period, setPeriod] = useState(currentMonth());
  const [board, setBoard] = useState<CommissionBoard | null>(null);
  const [busy, setBusy] = useState<number | null>(null);

  function load(p: string) {
    setBoard(null);
    commissionsBoardAction(p).then(setBoard).catch(() => setBoard(null));
  }
  useEffect(() => { load(period); }, [period]);

  async function saveRate(ownerUserId: number, percent: number) {
    const r = await setCommissionRateAction(ownerUserId, percent);
    if (r.error) return toast(r.error, { tone: "error" });
    load(period);
  }
  async function markPaid(userId: number) {
    setBusy(userId);
    const r = await markCommissionPaidAction(userId, period);
    setBusy(null);
    if (r.error) return toast(r.error, { tone: "error" });
    toast("Marked paid", { tone: "success" });
    load(period);
  }
  async function revert(userId: number) {
    setBusy(userId);
    const r = await revertCommissionAction(userId, period);
    setBusy(null);
    if (r.error) return toast(r.error, { tone: "error" });
    load(period);
  }

  const isThisMonth = period === currentMonth();

  return (
    <div className="max-w-3xl space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-semibold tracking-tight"><Coins size={18} className="text-electric" /> Commissions</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">Commission earned on won deals, and what&apos;s been paid out.</p>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => setPeriod((p) => shiftMonth(p, -1))} className="grid h-8 w-8 place-items-center rounded-lg border border-border text-muted-foreground hover:text-foreground" aria-label="Previous month"><ChevronLeft size={15} /></button>
          <span className="min-w-[130px] text-center text-sm font-medium">{monthLabel(period)}</span>
          <button onClick={() => setPeriod((p) => shiftMonth(p, 1))} disabled={isThisMonth} className="grid h-8 w-8 place-items-center rounded-lg border border-border text-muted-foreground hover:text-foreground disabled:opacity-40" aria-label="Next month"><ChevronRight size={15} /></button>
        </div>
      </div>

      {!board ? (
        <div className="space-y-3"><div className="grid gap-3 sm:grid-cols-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-20 w-full" />)}</div><Skeleton className="h-48 w-full" /></div>
      ) : (
        <>
          {/* Summary + default rate */}
          <div className="grid gap-3 sm:grid-cols-3">
            <Card className="p-4"><p className="text-2xs font-medium uppercase tracking-wide text-muted-foreground">Total commission</p><p className="mt-1 text-xl font-semibold tabular">{money2(board.totals.totalCents)}</p></Card>
            <Card className="p-4"><p className="text-2xs font-medium uppercase tracking-wide text-muted-foreground">Pending</p><p className="mt-1 text-xl font-semibold tabular text-warning">{money2(board.totals.pendingCents)}</p></Card>
            <Card className="p-4"><p className="text-2xs font-medium uppercase tracking-wide text-muted-foreground">Paid</p><p className="mt-1 text-xl font-semibold tabular text-emerald">{money2(board.totals.paidCents)}</p></Card>
          </div>

          <Card className="flex flex-wrap items-center justify-between gap-2 p-4">
            <div>
              <p className="text-sm font-medium">Default commission rate</p>
              <p className="text-2xs text-muted-foreground">Applied to any rep without an explicit rate.</p>
            </div>
            <RateInput value={board.defaultRatePercent} disabled={!canWrite} onSave={(n) => saveRate(0, n)} />
          </Card>

          {/* Rep table */}
          <Card className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[620px] text-sm">
                <thead className="border-b border-border text-2xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="px-4 py-2 text-left font-medium">Rep</th>
                    <th className="px-3 py-2 text-right font-medium">Rate</th>
                    <th className="px-3 py-2 text-right font-medium">Revenue won</th>
                    <th className="px-3 py-2 text-right font-medium">Commission</th>
                    <th className="px-3 py-2 text-right font-medium">Status</th>
                    <th className="px-3 py-2 text-right font-medium" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {board.reps.length === 0 ? (
                    <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">No active team members.</td></tr>
                  ) : (
                    board.reps.map((r) => (
                      <tr key={r.userId} className="hover:bg-secondary/40">
                        <td className="px-4 py-2.5 font-medium">{r.name}</td>
                        <td className="px-3 py-2.5 text-right"><RateInput value={r.ratePercent} disabled={!canWrite} onSave={(n) => saveRate(r.userId, n)} /></td>
                        <td className="px-3 py-2.5 text-right tabular text-muted-foreground">{eur(r.revenue)}</td>
                        <td className="px-3 py-2.5 text-right tabular font-medium">{money2(r.paid ? r.paidCents : r.earnedCents)}</td>
                        <td className="px-3 py-2.5 text-right">
                          {r.paid ? (
                            <span className="inline-flex flex-col items-end">
                              <Badge tone="emerald">Paid</Badge>
                              {r.paidAt && <span className="mt-0.5 text-[10px] text-muted-foreground">{new Date(r.paidAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</span>}
                            </span>
                          ) : (
                            <Badge tone={r.earnedCents > 0 ? "warning" : "neutral"}>{r.earnedCents > 0 ? "Pending" : "—"}</Badge>
                          )}
                        </td>
                        <td className="px-3 py-2.5 text-right">
                          {canWrite && (r.paid ? (
                            <button onClick={() => revert(r.userId)} disabled={busy === r.userId} className="inline-flex items-center gap-1 text-2xs text-muted-foreground hover:text-foreground disabled:opacity-50" title="Revert to pending">
                              {busy === r.userId ? <Loader2 size={12} className="animate-spin" /> : <Undo2 size={12} />} Revert
                            </button>
                          ) : r.earnedCents > 0 ? (
                            <Button size="sm" variant="outline" onClick={() => markPaid(r.userId)} disabled={busy === r.userId}>
                              {busy === r.userId ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle2 size={12} />} Mark paid
                            </Button>
                          ) : null)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
          <p className="text-2xs text-muted-foreground">Commission is {board.defaultRatePercent || 0}% of each rep&apos;s won-deal revenue for the month, unless a rep has a custom rate. Paid amounts are snapshotted and won&apos;t change if deals are edited later.</p>
        </>
      )}
    </div>
  );
}
