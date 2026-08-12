"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { boardAction, updateDealStageAction, type BoardDeal } from "@/lib/actions/crm";
import { STAGES, summarizePipeline, type StageId } from "@/lib/crm/pipeline";
import { DealCard, STAGE_TONE, TONE_TOP, TONE_DOT } from "@/components/crm/deal-card";
import { eur } from "@/lib/format";
import { cn } from "@/lib/utils";

export default function PipelinePage() {
  const [deals, setDeals] = useState<BoardDeal[]>([]);
  const [loading, setLoading] = useState(true);
  const [draggingId, setDraggingId] = useState<number | null>(null);
  const [dragOverStage, setDragOverStage] = useState<StageId | null>(null);

  async function load() {
    setDeals(await boardAction().catch(() => []));
    setLoading(false);
  }
  useEffect(() => {
    void load();
  }, []);

  const byStage = useMemo(() => {
    const m = new Map<StageId, BoardDeal[]>(STAGES.map((s) => [s.id, []]));
    for (const d of deals) m.get(d.stage)?.push(d);
    return m;
  }, [deals]);
  const summary = useMemo(() => summarizePipeline(deals), [deals]);

  async function move(id: number, toStage: string) {
    setDeals((prev) => prev.map((d) => (d.id === id ? { ...d, stage: toStage as StageId } : d))); // optimistic
    const r = await updateDealStageAction(id, toStage);
    if (r?.error) void load(); // revert by refetch
  }

  if (loading)
    return (
      <div className="grid min-h-[50vh] place-items-center">
        <Loader2 className="animate-spin text-muted-foreground" />
      </div>
    );

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Pipeline</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">{summary.openCount} open deals · drag cards between stages to move them</p>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Kpi label="Open pipeline" value={eur(summary.open)} />
          <Kpi label="Weighted" value={eur(summary.weighted)} sub="probability-adjusted" />
          <Kpi label="Won" value={eur(summary.won)} tone="text-emerald" />
          <Kpi label="Win rate" value={`${summary.winRate}%`} sub={`${summary.wonCount}W · ${summary.lostCount}L`} />
        </div>
      </div>

      {deals.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border py-16 text-center text-sm text-muted-foreground">
          No deals yet — add one from a company.
        </p>
      ) : (
        <div className="flex gap-3 overflow-x-auto pb-4">
          {STAGES.map((s) => {
            const list = byStage.get(s.id) ?? [];
            const sum = list.reduce((t, d) => t + d.value, 0);
            const tone = STAGE_TONE[s.id];
            return (
              <div
                key={s.id}
                onDragOver={(e) => {
                  if (draggingId != null) {
                    e.preventDefault();
                    if (dragOverStage !== s.id) setDragOverStage(s.id);
                  }
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  const id = draggingId ?? Number(e.dataTransfer.getData("text/plain"));
                  if (id) void move(id, s.id);
                  setDragOverStage(null);
                  setDraggingId(null);
                }}
                className={cn(
                  "flex w-[280px] shrink-0 flex-col overflow-hidden rounded-xl border bg-secondary/30 transition-colors",
                  dragOverStage === s.id ? "border-electric ring-1 ring-electric/40" : "border-border/60"
                )}
              >
                <div className={cn("h-[3px]", TONE_TOP[tone])} />
                <div className="flex items-center justify-between gap-2 px-3 py-2.5">
                  <div className="flex min-w-0 items-center gap-2">
                    <span className={cn("h-2 w-2 shrink-0 rounded-full", TONE_DOT[tone])} />
                    <p className="truncate text-sm font-semibold">{s.label}</p>
                    <span className="rounded bg-secondary px-1.5 text-2xs font-medium text-muted-foreground">{list.length}</span>
                  </div>
                  {sum > 0 && <span className="shrink-0 text-2xs font-medium tabular text-muted-foreground">{eur(sum)}</span>}
                </div>

                <div className="flex-1 space-y-2 px-2 pb-2">
                  {list.map((d) => (
                    <DealCard
                      key={d.id}
                      deal={d}
                      onMove={move}
                      onDragStart={setDraggingId}
                      onDragEnd={() => { setDraggingId(null); setDragOverStage(null); }}
                      dragging={draggingId === d.id}
                    />
                  ))}
                  {list.length === 0 && (
                    <div className="rounded-lg border border-dashed border-border/60 py-8 text-center text-2xs text-muted-foreground">
                      No deals
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Kpi({ label, value, sub, tone }: { label: string; value: string; sub?: string; tone?: string }) {
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2">
      <p className="text-2xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className={cn("mt-0.5 text-base font-semibold tabular", tone)}>{value}</p>
      {sub && <p className="text-[10px] text-muted-foreground">{sub}</p>}
    </div>
  );
}
