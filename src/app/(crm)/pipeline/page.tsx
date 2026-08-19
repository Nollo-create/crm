"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Search, X, Rows3, LayoutGrid, ChevronDown, ChevronRight, CalendarClock } from "lucide-react";
import { boardAction, updateDealStageAction, type BoardDeal } from "@/lib/actions/crm";
import { STAGES, OPEN_STAGES, summarizePipeline, weightedValue, dealCloseInfo, type StageId } from "@/lib/crm/pipeline";
import { DealCard, STAGE_TONE, TONE_TOP, TONE_DOT } from "@/components/crm/deal-card";
import { Input, Select } from "@/components/ui/input";
import { useCanWrite } from "@/components/crm/role-context";
import { eur } from "@/lib/format";
import { cn } from "@/lib/utils";

type View = "list" | "board";
const VIEW_KEY = "crm-pipeline-view";

export default function PipelinePage() {
  const router = useRouter();
  const canWrite = useCanWrite();
  const [deals, setDeals] = useState<BoardDeal[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<View>("list");
  const [q, setQ] = useState("");
  const [owner, setOwner] = useState("");
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set(["won", "lost"]));
  const [stageFilter, setStageFilter] = useState<StageId | null>(null);

  // board drag state
  const [draggingId, setDraggingId] = useState<number | null>(null);
  const [dragOverStage, setDragOverStage] = useState<StageId | null>(null);

  async function load() {
    setDeals(await boardAction().catch(() => []));
    setLoading(false);
  }
  useEffect(() => {
    void load();
    try {
      const v = localStorage.getItem(VIEW_KEY);
      if (v === "board" || v === "list") setView(v);
    } catch { /* ignore */ }
  }, []);

  function changeView(v: View) {
    setView(v);
    try { localStorage.setItem(VIEW_KEY, v); } catch { /* ignore */ }
  }

  const owners = useMemo(() => [...new Set(deals.map((d) => d.owner).filter(Boolean))].sort(), [deals]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return deals.filter((d) => {
      if (owner && d.owner !== owner) return false;
      if (s && !(`${d.title} ${d.companyName}`.toLowerCase().includes(s))) return false;
      return true;
    });
  }, [deals, q, owner]);

  const byStage = useMemo(() => {
    const m = new Map<StageId, BoardDeal[]>(STAGES.map((s) => [s.id, []]));
    for (const d of filtered) m.get(d.stage)?.push(d);
    return m;
  }, [filtered]);
  const summary = useMemo(() => summarizePipeline(filtered), [filtered]);
  const funnelMax = useMemo(() => Math.max(1, ...OPEN_STAGES.map((s) => (byStage.get(s.id) ?? []).length)), [byStage]);
  // The funnel always shows every stage (so you can switch focus); a stage filter
  // only narrows which lanes/columns render below.
  const stagesToShow = stageFilter ? STAGES.filter((s) => s.id === stageFilter) : STAGES;

  async function move(id: number, toStage: string) {
    setDeals((prev) => prev.map((d) => (d.id === id ? { ...d, stage: toStage as StageId } : d)));
    const r = await updateDealStageAction(id, toStage);
    if (r?.error) void load();
  }
  function toggleLane(id: string) {
    setCollapsed((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id); else n.add(id);
      return n;
    });
  }

  if (loading) return <div className="grid min-h-[50vh] place-items-center"><Loader2 className="animate-spin text-muted-foreground" /></div>;

  const hasFilters = !!(q.trim() || owner || stageFilter);

  return (
    <div className="space-y-4">
      {/* Header + view toggle */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Pipeline</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">{summary.openCount} open deal{summary.openCount === 1 ? "" : "s"} · {eur(summary.open)} in play</p>
        </div>
        <div className="inline-flex rounded-lg border border-border bg-secondary/40 p-0.5">
          <ViewTab active={view === "list"} onClick={() => changeView("list")} icon={Rows3} label="List" />
          <ViewTab active={view === "board"} onClick={() => changeView("board")} icon={LayoutGrid} label="Board" />
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Kpi label="Open pipeline" value={eur(summary.open)} />
        <Kpi label="Weighted" value={eur(summary.weighted)} sub="probability-adjusted" />
        <Kpi label="Won" value={eur(summary.won)} tone="text-emerald" />
        <Kpi label="Win rate" value={`${summary.winRate}%`} sub={`${summary.wonCount}W · ${summary.lostCount}L`} />
      </div>

      {/* Funnel overview */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
        {OPEN_STAGES.map((s) => {
          const list = byStage.get(s.id) ?? [];
          const val = list.reduce((t, d) => t + d.value, 0);
          const tone = STAGE_TONE[s.id];
          const selected = stageFilter === s.id;
          return (
            <button
              key={s.id}
              onClick={() => setStageFilter(selected ? null : s.id)}
              aria-pressed={selected}
              title={selected ? `Showing ${s.label} — click to clear` : `Show only ${s.label}`}
              className={cn(
                "rounded-lg border bg-card p-2.5 text-left transition-colors hover:border-electric/40",
                selected ? "border-electric ring-1 ring-electric/40" : "border-border"
              )}
            >
              <div className="flex items-center gap-1.5">
                <span className={cn("h-2 w-2 shrink-0 rounded-full", TONE_DOT[tone])} />
                <p className="truncate text-2xs font-medium text-muted-foreground">{s.label}</p>
              </div>
              <p className="mt-1 text-lg font-semibold tabular leading-none">{list.length}</p>
              <p className="mt-1 truncate text-2xs text-muted-foreground">{val > 0 ? eur(val) : "—"}</p>
              <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-secondary">
                <div className={cn("h-full rounded-full", TONE_DOT[tone])} style={{ width: `${(list.length / funnelMax) * 100}%` }} />
              </div>
            </button>
          );
        })}
      </div>

      {/* Filters */}
      {deals.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[180px] flex-1 sm:max-w-xs">
            <Search size={15} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search deals…" value={q} onChange={(e) => setQ(e.target.value)} className="h-9 pl-8" />
          </div>
          {owners.length > 0 && (
            <Select value={owner} onChange={(e) => setOwner(e.target.value)} className="h-9 w-auto text-xs">
              <option value="">All owners</option>
              {owners.map((o) => <option key={o} value={o}>{o}</option>)}
            </Select>
          )}
          {hasFilters && (
            <button onClick={() => { setQ(""); setOwner(""); setStageFilter(null); }} className="inline-flex items-center gap-1 text-2xs text-muted-foreground hover:text-foreground">
              <X size={12} /> Clear
            </button>
          )}
        </div>
      )}

      {deals.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border py-16 text-center text-sm text-muted-foreground">No deals yet — add one from a company.</p>
      ) : filtered.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border py-16 text-center text-sm text-muted-foreground">No deals match your filters.</p>
      ) : view === "list" ? (
        /* ---- List view: vertical lanes, no horizontal scroll ---- */
        <div className="space-y-2">
          {stagesToShow.map((s) => {
            const list = byStage.get(s.id) ?? [];
            const isCollapsed = stageFilter ? false : collapsed.has(s.id);
            const val = list.reduce((t, d) => t + d.value, 0);
            const wtd = list.reduce((t, d) => t + weightedValue(d), 0);
            const tone = STAGE_TONE[s.id];
            return (
              <div key={s.id} className="overflow-hidden rounded-xl border border-border bg-card">
                <button onClick={() => toggleLane(s.id)} className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left transition-colors hover:bg-secondary/40">
                  {isCollapsed ? <ChevronRight size={15} className="shrink-0 text-muted-foreground" /> : <ChevronDown size={15} className="shrink-0 text-muted-foreground" />}
                  <span className={cn("h-2.5 w-2.5 shrink-0 rounded-full", TONE_DOT[tone])} />
                  <span className="text-sm font-semibold">{s.label}</span>
                  <span className="rounded bg-secondary px-1.5 text-2xs font-medium text-muted-foreground">{list.length}</span>
                  <span className="ml-auto flex items-center gap-3 text-2xs text-muted-foreground">
                    {val > 0 && <span className="tabular">{eur(val)}</span>}
                    {s.open && wtd > 0 && <span className="tabular">≈ {eur(wtd)}</span>}
                  </span>
                </button>
                {!isCollapsed && (
                  list.length === 0 ? (
                    <p className="border-t border-border px-4 py-3 text-2xs text-muted-foreground">No deals in this stage.</p>
                  ) : (
                    <div className="divide-y divide-border border-t border-border">
                      {list.map((d) => {
                        const close = dealCloseInfo(d.expectedClose);
                        return (
                          <div key={d.id} className="flex items-center gap-3 px-3 py-2 transition-colors hover:bg-secondary/40">
                            <button onClick={() => router.push(`/deals/${d.id}`)} className="min-w-0 flex-1 text-left">
                              <p className="truncate text-sm font-medium hover:text-electric">{d.title}</p>
                              <p className="truncate text-2xs text-muted-foreground">{d.companyName}{d.owner ? ` · ${d.owner}` : ""}</p>
                            </button>
                            {close && (
                              <span className={cn("hidden shrink-0 items-center gap-1 text-2xs sm:inline-flex", close.tone === "danger" ? "text-danger" : close.tone === "warning" ? "text-warning" : "text-muted-foreground")}>
                                <CalendarClock size={11} /> {close.label}
                              </span>
                            )}
                            <span className="shrink-0 text-sm font-semibold tabular">{eur(d.value)}</span>
                            {canWrite && (
                              <Select value={d.stage} onChange={(e) => move(d.id, e.target.value)} className="h-7 w-auto shrink-0 border-transparent bg-secondary/50 text-2xs hover:bg-secondary" onClick={(e) => e.stopPropagation()}>
                                {STAGES.map((st) => <option key={st.id} value={st.id}>{st.label}</option>)}
                              </Select>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )
                )}
              </div>
            );
          })}
        </div>
      ) : (
        /* ---- Board view: horizontal kanban with drag & drop ---- */
        <div className="flex gap-3 overflow-x-auto pb-4">
          {stagesToShow.map((s) => {
            const list = byStage.get(s.id) ?? [];
            const sum = list.reduce((t, d) => t + d.value, 0);
            const tone = STAGE_TONE[s.id];
            return (
              <div
                key={s.id}
                onDragOver={(e) => { if (draggingId != null) { e.preventDefault(); if (dragOverStage !== s.id) setDragOverStage(s.id); } }}
                onDrop={(e) => {
                  e.preventDefault();
                  const id = draggingId ?? Number(e.dataTransfer.getData("text/plain"));
                  if (id) void move(id, s.id);
                  setDragOverStage(null);
                  setDraggingId(null);
                }}
                className={cn("flex w-[280px] shrink-0 flex-col overflow-hidden rounded-xl border bg-secondary/30 transition-colors", dragOverStage === s.id ? "border-electric ring-1 ring-electric/40" : "border-border/60")}
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
                    <DealCard key={d.id} deal={d} onMove={move} onDragStart={setDraggingId} onDragEnd={() => { setDraggingId(null); setDragOverStage(null); }} dragging={draggingId === d.id} />
                  ))}
                  {list.length === 0 && <div className="rounded-lg border border-dashed border-border/60 py-8 text-center text-2xs text-muted-foreground">No deals</div>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ViewTab({ active, onClick, icon: Icon, label }: { active: boolean; onClick: () => void; icon: typeof Rows3; label: string }) {
  return (
    <button onClick={onClick} className={cn("inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors", active ? "bg-card text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground")}>
      <Icon size={14} /> {label}
    </button>
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
