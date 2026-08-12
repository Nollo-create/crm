"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus, Search, Loader2, Trash2, X, ArrowUp, ArrowDown, ChevronsUpDown, ChevronLeft, ChevronRight, Building2, LayoutGrid, CalendarClock } from "lucide-react";
import {
  dealsPageAction,
  createDealAction,
  updateDealStageAction,
  deleteDealAction,
  searchCompaniesAction,
  type BoardDeal,
  type SearchHit,
} from "@/lib/actions/crm";
import { STAGES, stageLabel, weightedValue, dealCloseInfo, isStageId, type StageId } from "@/lib/crm/pipeline";
import { STAGE_TONE } from "@/components/crm/deal-card";
import type { DealSortKey } from "@/lib/crm/deal-query";
import { Card } from "@/components/ui/card";
import { Badge, type Tone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { eur } from "@/lib/format";
import { cn } from "@/lib/utils";

const emptyForm = { title: "", value: "", stage: "new", expectedClose: "", companyId: 0, companyName: "" };

// STAGE_TONE can be "muted", which isn't a Badge tone — map it.
const stageBadgeTone = (s: StageId): Tone => (STAGE_TONE[s] === "muted" ? "neutral" : STAGE_TONE[s]);

export default function DealsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [rows, setRows] = useState<BoardDeal[]>([]);
  const [total, setTotal] = useState(0);
  const [pageCount, setPageCount] = useState(1);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [stage, setStage] = useState("");
  const [sort, setSort] = useState<{ key: DealSortKey; dir: 1 | -1 }>({ key: "value", dir: -1 });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [reloadKey, setReloadKey] = useState(0);

  const [showAdd, setShowAdd] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("new") === "1") setShowAdd(true);
    const st = params.get("stage");
    if (st && isStageId(st)) setStage(st); // deep-link from the dashboard pipeline
  }, []);
  const [form, setForm] = useState(emptyForm);
  const [busy, setBusy] = useState(false);
  const [companyQuery, setCompanyQuery] = useState("");
  const [companyResults, setCompanyResults] = useState<SearchHit[]>([]);

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedQ(q);
      setPage(1);
    }, 250);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    dealsPageAction({ q: debouncedQ, stage, sortKey: sort.key, sortDir: sort.dir, page, pageSize })
      .then((res) => {
        if (cancelled) return;
        setRows(res.rows);
        setTotal(res.total);
        setPageCount(res.pageCount);
        if (res.page !== page) setPage(res.page);
      })
      .catch(() => {
        if (cancelled) return;
        setRows([]);
        setTotal(0);
        setPageCount(1);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQ, stage, sort, page, pageSize, reloadKey]);

  const refetch = () => setReloadKey((k) => k + 1);

  useEffect(() => {
    if (!showAdd) return;
    const s = companyQuery.trim();
    if (!s) {
      setCompanyResults([]);
      return;
    }
    const t = setTimeout(async () => {
      setCompanyResults(await searchCompaniesAction(s).catch(() => []));
    }, 200);
    return () => clearTimeout(t);
  }, [companyQuery, showAdd]);

  function toggleSort(key: DealSortKey) {
    setSort((s) => (s.key === key ? { key, dir: (s.dir * -1) as 1 | -1 } : { key, dir: key === "value" ? -1 : 1 }));
    setPage(1);
  }

  async function add() {
    if (!form.title.trim() || !form.companyId) return;
    setBusy(true);
    const r = await createDealAction(form.companyId, {
      title: form.title, value: form.value ? Number(form.value) : 0, stage: form.stage, expectedClose: form.expectedClose || null,
    });
    setBusy(false);
    if (r.error) {
      toast(r.error, { tone: "error" });
      return;
    }
    toast(`${form.title.trim()} added to ${form.companyName}`, { tone: "success" });
    setForm(emptyForm);
    setCompanyQuery("");
    setShowAdd(false);
    setPage(1);
    refetch();
  }

  async function changeStage(d: BoardDeal, next: string) {
    setRows((prev) => prev.map((r) => (r.id === d.id ? { ...r, stage: next as StageId } : r))); // optimistic
    const res = await updateDealStageAction(d.id, next);
    if (res.error) {
      toast(res.error, { tone: "error" });
      refetch();
    }
  }

  async function remove(d: BoardDeal) {
    if (typeof window !== "undefined" && !window.confirm(`Delete deal "${d.title}"?`)) return;
    await deleteDealAction(d.id, d.companyId);
    toast("Deal deleted", { tone: "success" });
    refetch();
  }

  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);
  const hasFilters = !!(debouncedQ || stage);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Deals</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">{total} deal{total === 1 ? "" : "s"}</p>
        </div>
        <div className="flex items-center gap-1.5">
          <Link href="/pipeline">
            <Button size="sm" variant="outline"><LayoutGrid size={14} /> Board</Button>
          </Link>
          <Button size="sm" onClick={() => setShowAdd((v) => !v)}>
            <Plus size={15} /> New deal
          </Button>
        </div>
      </div>

      {showAdd && (
        <Card className="space-y-3 p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold">New deal</p>
            <button onClick={() => setShowAdd(false)} className="text-muted-foreground hover:text-foreground"><X size={16} /></button>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            <Input placeholder="Deal title *" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="lg:col-span-2" />
            <div className="relative">
              {form.companyId ? (
                <div className="flex h-10 items-center justify-between gap-2 rounded-lg border border-border bg-secondary/40 px-3 text-sm">
                  <span className="truncate"><Building2 size={13} className="mr-1 inline text-muted-foreground" />{form.companyName}</span>
                  <button onClick={() => { setForm({ ...form, companyId: 0, companyName: "" }); setCompanyQuery(""); }} className="text-muted-foreground hover:text-foreground"><X size={14} /></button>
                </div>
              ) : (
                <>
                  <Input placeholder="Company *" value={companyQuery} onChange={(e) => setCompanyQuery(e.target.value)} />
                  {companyResults.length > 0 && (
                    <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-lg border border-border bg-popover shadow-pop">
                      {companyResults.map((c) => (
                        <button key={c.id} onClick={() => { setForm({ ...form, companyId: c.id, companyName: c.name }); setCompanyResults([]); }} className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-secondary">
                          <Building2 size={14} className="shrink-0 text-muted-foreground" />
                          <span className="flex-1 truncate">{c.name}</span>
                          {c.city && <span className="text-2xs text-muted-foreground">{c.city}</span>}
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
            <Input type="number" placeholder="Value (€)" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} />
            <Select value={form.stage} onChange={(e) => setForm({ ...form, stage: e.target.value })}>
              {STAGES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
            </Select>
            <Input type="date" value={form.expectedClose} onChange={(e) => setForm({ ...form, expectedClose: e.target.value })} />
          </div>
          <div className="flex justify-end">
            <Button size="sm" onClick={add} disabled={busy || !form.title.trim() || !form.companyId}>
              {busy ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />} Create
            </Button>
          </div>
        </Card>
      )}

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[180px] flex-1 sm:max-w-xs">
          <Search size={15} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search deals…" value={q} onChange={(e) => setQ(e.target.value)} className="h-9 pl-8" />
        </div>
        <Select value={stage} onChange={(e) => { setStage(e.target.value); setPage(1); }} className="h-9 w-auto text-xs">
          <option value="">All stages</option>
          {STAGES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
        </Select>
      </div>

      {/* Table (desktop) */}
      <Card className="hidden overflow-hidden p-0 md:block">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-sm">
            <thead className="border-b border-border bg-card text-2xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <Th label="Deal" k="title" sort={sort} onSort={toggleSort} />
                <Th label="Company" k="company" sort={sort} onSort={toggleSort} />
                <Th label="Value" k="value" sort={sort} onSort={toggleSort} align="right" />
                <Th label="Stage" k="stage" sort={sort} onSort={toggleSort} />
                <Th label="Close" k="expectedClose" sort={sort} onSort={toggleSort} />
                <th className="w-10 px-3 py-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}><td className="px-3 py-3" colSpan={6}><Skeleton className="h-4 w-full" /></td></tr>
                ))
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-3 py-12 text-center text-sm text-muted-foreground">
                    {hasFilters ? "No matches." : "No deals yet — add your first deal."}
                  </td>
                </tr>
              ) : (
                rows.map((d) => {
                  const close = dealCloseInfo(d.expectedClose);
                  return (
                    <tr key={d.id} className="transition-colors hover:bg-secondary/40">
                      <td className="px-3 py-2.5 cursor-pointer" onClick={() => router.push(`/deals/${d.id}`)}>
                        <p className="font-medium">{d.title}</p>
                        {d.owner && <p className="text-2xs text-muted-foreground">{d.owner}</p>}
                      </td>
                      <td className="px-3 py-2.5 text-muted-foreground">{d.companyName}</td>
                      <td className="px-3 py-2.5 text-right">
                        <span className="font-semibold tabular">{eur(d.value)}</span>
                        <span className="ml-1 text-2xs text-muted-foreground">≈ {eur(weightedValue(d))}</span>
                      </td>
                      <td className="px-3 py-2.5" onClick={(e) => e.stopPropagation()}>
                        <Select value={d.stage} onChange={(e) => changeStage(d, e.target.value)} className="h-7 w-auto text-2xs">
                          {STAGES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
                        </Select>
                      </td>
                      <td className="px-3 py-2.5">
                        {close ? (
                          <span className={cn("inline-flex items-center gap-1 text-2xs", close.tone === "danger" ? "text-danger" : close.tone === "warning" ? "text-warning" : "text-muted-foreground")}>
                            <CalendarClock size={11} /> {close.label}
                          </span>
                        ) : (
                          <span className="text-2xs text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-3 py-2.5" onClick={(e) => e.stopPropagation()}>
                        <button onClick={() => remove(d)} className="text-muted-foreground hover:text-danger" title="Delete deal"><Trash2 size={14} /></button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Card list (mobile) */}
      <div className="space-y-2 md:hidden">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-[86px] w-full rounded-xl" />)
        ) : rows.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border py-12 text-center text-sm text-muted-foreground">
            {hasFilters ? "No matches." : "No deals yet."}
          </p>
        ) : (
          rows.map((d) => {
            const close = dealCloseInfo(d.expectedClose);
            return (
              <div key={d.id} className="rounded-xl border border-border bg-card p-3">
                <div className="flex items-start justify-between gap-2">
                  <button onClick={() => router.push(`/deals/${d.id}`)} className="min-w-0 text-left">
                    <p className="truncate font-medium">{d.title}</p>
                    <p className="truncate text-2xs text-muted-foreground">{d.companyName}</p>
                  </button>
                  <span className="shrink-0 text-sm font-semibold tabular">{eur(d.value)}</span>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <Badge tone={stageBadgeTone(d.stage)}>{stageLabel(d.stage)}</Badge>
                  {close && <span className={cn("text-2xs", close.tone === "danger" ? "text-danger" : close.tone === "warning" ? "text-warning" : "text-muted-foreground")}>{close.label}</span>}
                  <button onClick={() => remove(d)} className="ml-auto grid h-7 w-7 place-items-center rounded text-muted-foreground hover:text-danger"><Trash2 size={13} /></button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Pagination */}
      {!loading && total > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1 text-xs text-muted-foreground">
          <span>{from}–{to} of {total}</span>
          <div className="flex items-center gap-3">
            <Select value={String(pageSize)} onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }} className="h-8 w-auto text-xs">
              {[25, 50, 100].map((n) => <option key={n} value={n}>{n} / page</option>)}
            </Select>
            <div className="flex items-center gap-1">
              <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} aria-label="Previous page"><ChevronLeft size={14} /></Button>
              <span className="px-1 tabular">{page} / {pageCount}</span>
              <Button size="sm" variant="outline" disabled={page >= pageCount} onClick={() => setPage((p) => p + 1)} aria-label="Next page"><ChevronRight size={14} /></Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Th({ label, k, sort, onSort, align }: { label: string; k: DealSortKey; sort: { key: DealSortKey; dir: 1 | -1 }; onSort: (k: DealSortKey) => void; align?: "right" }) {
  const active = sort.key === k;
  return (
    <th className={cn("px-3 py-2 font-medium", align === "right" ? "text-right" : "text-left")}>
      <button onClick={() => onSort(k)} className={cn("inline-flex items-center gap-1 hover:text-foreground", active && "text-foreground", align === "right" && "flex-row-reverse")}>
        {label}
        {active ? sort.dir === 1 ? <ArrowUp size={11} /> : <ArrowDown size={11} /> : <ChevronsUpDown size={11} className="opacity-40" />}
      </button>
    </th>
  );
}
