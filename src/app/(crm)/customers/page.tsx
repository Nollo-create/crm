"use client";

import { useEffect, useState } from "react";
import { Search, ArrowUp, ArrowDown, ChevronsUpDown, ChevronLeft, ChevronRight, HeartPulse, TrendingUp } from "lucide-react";
import {
  customersPageAction,
  customerStatsAction,
  type CompanyRowView,
} from "@/lib/actions/crm";
import type { CompanySortKey } from "@/lib/crm/views";
import { Card } from "@/components/ui/card";
import { Badge, type Tone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { CompanyDrawer } from "@/components/crm/company-drawer";
import { eur, timeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";

const STATUS_LABEL: Record<string, string> = { customer: "Customer", at_risk: "At risk" };
const STATUS_TONE: Record<string, Tone> = { customer: "emerald", at_risk: "danger" };

// NOTE: mirrors health_rank in db.ts (listCompaniesPage) — keep in sync.
function health(c: CompanyRowView): { tone: Tone; label: string } {
  if (!c.lastActivity) return { tone: "neutral", label: "New" };
  const days = (Date.now() - new Date(c.lastActivity).getTime()) / 86_400_000;
  if (days > 30) return { tone: "danger", label: "At risk" };
  if (c.openValue > 0 && days <= 14) return { tone: "emerald", label: "Healthy" };
  return { tone: "warning", label: "Attention" };
}
const dot = (t: Tone) => (t === "emerald" ? "bg-emerald" : t === "danger" ? "bg-danger" : t === "warning" ? "bg-warning" : "bg-muted-foreground");

type SortKey = Extract<CompanySortKey, "name" | "health" | "annualValue" | "openValue" | "lastActivity">;

const FILTERS = [
  { id: "", label: "All" },
  { id: "customer", label: "Customers" },
  { id: "at_risk", label: "At risk" },
];

export default function CustomersPage() {
  const [rows, setRows] = useState<CompanyRowView[]>([]);
  const [total, setTotal] = useState(0);
  const [pageCount, setPageCount] = useState(1);
  const [stats, setStats] = useState<{ customers: number; atRisk: number; arr: number; won: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [status, setStatus] = useState("");
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({ key: "annualValue", dir: -1 });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [reloadKey, setReloadKey] = useState(0);
  const [peek, setPeek] = useState<number | null>(null);

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
    customersPageAction({ q: debouncedQ, status, sortKey: sort.key, sortDir: sort.dir, page, pageSize })
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
  }, [debouncedQ, status, sort, page, pageSize, reloadKey]);

  useEffect(() => {
    let cancelled = false;
    customerStatsAction()
      .then((s) => !cancelled && setStats(s))
      .catch(() => !cancelled && setStats(null));
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  const refetch = () => setReloadKey((k) => k + 1);

  function toggleSort(key: SortKey) {
    setSort((s) => (s.key === key ? { key, dir: (s.dir * -1) as 1 | -1 } : { key, dir: key === "name" ? 1 : -1 }));
    setPage(1);
  }

  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);
  const hasFilters = !!(debouncedQ || status);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Customers</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">Your won accounts and their health.</p>
      </div>

      {/* KPI header */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Kpi label="Customers" value={stats ? String(stats.customers) : "—"} />
        <Kpi label="At risk" value={stats ? String(stats.atRisk) : "—"} tone={stats && stats.atRisk > 0 ? "text-danger" : undefined} icon={<HeartPulse size={13} />} />
        <Kpi label="Annual value" value={stats ? eur(stats.arr) : "—"} sub="recurring" />
        <Kpi label="Won revenue" value={stats ? eur(stats.won) : "—"} tone="text-emerald" icon={<TrendingUp size={13} />} />
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[180px] flex-1 sm:max-w-xs">
          <Search size={15} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search customers…" value={q} onChange={(e) => setQ(e.target.value)} className="h-9 pl-8" />
        </div>
        <div className="flex gap-1">
          {FILTERS.map((f) => (
            <button key={f.id || "all"} onClick={() => { setStatus(f.id); setPage(1); }} className={cn("rounded-lg px-2.5 py-1 text-xs font-medium transition-colors", status === f.id ? "bg-secondary text-foreground" : "text-muted-foreground hover:bg-secondary/60")}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table (desktop) */}
      <Card className="hidden overflow-hidden p-0 md:block">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-sm">
            <thead className="border-b border-border bg-card text-2xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <Th label="Account" k="name" sort={sort} onSort={toggleSort} />
                <th className="px-3 py-2 text-left font-medium">Status</th>
                <Th label="Health" k="health" sort={sort} onSort={toggleSort} />
                <Th label="Annual value" k="annualValue" sort={sort} onSort={toggleSort} align="right" />
                <Th label="Pipeline" k="openValue" sort={sort} onSort={toggleSort} align="right" />
                <Th label="Last activity" k="lastActivity" sort={sort} onSort={toggleSort} align="right" />
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
                    {hasFilters ? "No matches." : "No customers yet — win a deal or set an account to Customer."}
                  </td>
                </tr>
              ) : (
                rows.map((c) => {
                  const h = health(c);
                  return (
                    <tr key={c.id} onClick={() => setPeek(c.id)} className={cn("cursor-pointer transition-colors hover:bg-secondary/50", peek === c.id && "bg-electric/[0.05]")}>
                      <td className="px-3 py-2.5">
                        <p className="font-medium">{c.name}</p>
                        {c.city && <p className="text-2xs text-muted-foreground">{c.city}</p>}
                      </td>
                      <td className="px-3 py-2.5"><Badge tone={STATUS_TONE[c.status] ?? "neutral"}>{STATUS_LABEL[c.status] ?? c.status}</Badge></td>
                      <td className="px-3 py-2.5">
                        <span className="inline-flex items-center gap-1.5 text-xs">
                          <span className={cn("h-2 w-2 rounded-full", dot(h.tone))} />
                          {h.label}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-right">{c.annualValue ? <span className="font-medium tabular">{eur(c.annualValue)}</span> : <span className="text-muted-foreground">—</span>}</td>
                      <td className="px-3 py-2.5 text-right tabular text-muted-foreground">{c.openValue ? eur(c.openValue) : "—"}</td>
                      <td className="px-3 py-2.5 text-right text-2xs text-muted-foreground">{c.lastActivity ? timeAgo(c.lastActivity) : "—"}</td>
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
          Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-[74px] w-full rounded-xl" />)
        ) : rows.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border py-12 text-center text-sm text-muted-foreground">
            {hasFilters ? "No matches." : "No customers yet."}
          </p>
        ) : (
          rows.map((c) => {
            const h = health(c);
            return (
              <button key={c.id} onClick={() => setPeek(c.id)} className={cn("w-full rounded-xl border border-border bg-card p-3 text-left transition-colors active:bg-secondary/50", peek === c.id && "border-electric/50")}>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{c.name}</p>
                    <p className="truncate text-2xs text-muted-foreground">{c.city || "—"}</p>
                  </div>
                  <Badge tone={STATUS_TONE[c.status] ?? "neutral"}>{STATUS_LABEL[c.status] ?? c.status}</Badge>
                </div>
                <div className="mt-2.5 flex items-center gap-3 text-xs text-muted-foreground">
                  {c.annualValue ? <span className="font-medium tabular text-foreground">{eur(c.annualValue)}<span className="ml-1 text-2xs font-normal text-muted-foreground">/yr</span></span> : <span>—</span>}
                  <span className="ml-auto inline-flex items-center gap-1.5">
                    <span className={cn("h-2 w-2 rounded-full", dot(h.tone))} />
                    {h.label}
                  </span>
                </div>
              </button>
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

      <CompanyDrawer id={peek} onClose={() => setPeek(null)} onChanged={refetch} />
    </div>
  );
}

function Kpi({ label, value, sub, tone, icon }: { label: string; value: string; sub?: string; tone?: string; icon?: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2">
      <p className="flex items-center gap-1 text-2xs uppercase tracking-wide text-muted-foreground">{icon}{label}</p>
      <p className={cn("mt-0.5 text-base font-semibold tabular", tone)}>{value}</p>
      {sub && <p className="text-[10px] text-muted-foreground">{sub}</p>}
    </div>
  );
}

function Th({ label, k, sort, onSort, align }: { label: string; k: SortKey; sort: { key: SortKey; dir: 1 | -1 }; onSort: (k: SortKey) => void; align?: "right" }) {
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
