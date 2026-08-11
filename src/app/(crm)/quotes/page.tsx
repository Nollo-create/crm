"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search, Loader2, X, ArrowUp, ArrowDown, ChevronsUpDown, ChevronLeft, ChevronRight, Building2 } from "lucide-react";
import { quotesPageAction, createQuoteAction, type Quote } from "@/lib/actions/quotes";
import { searchCompaniesAction, type SearchHit } from "@/lib/actions/crm";
import { QUOTE_STATUSES, QUOTE_STATUS_LABEL, type QuoteSortKey } from "@/lib/crm/quotes";
import { Card } from "@/components/ui/card";
import { Badge, type Tone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

const STATUS_TONE: Record<string, Tone> = { draft: "neutral", sent: "electric", accepted: "emerald", declined: "danger" };
const money = (euros: number) => "€" + euros.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function QuotesPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [rows, setRows] = useState<Quote[]>([]);
  const [total, setTotal] = useState(0);
  const [pageCount, setPageCount] = useState(1);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [status, setStatus] = useState("");
  const [sort, setSort] = useState<{ key: QuoteSortKey; dir: 1 | -1 }>({ key: "created", dir: -1 });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [reloadKey, setReloadKey] = useState(0);

  const [showAdd, setShowAdd] = useState(false);
  const [validUntil, setValidUntil] = useState("");
  const [companyId, setCompanyId] = useState(0);
  const [companyName, setCompanyName] = useState("");
  const [companyQuery, setCompanyQuery] = useState("");
  const [companyResults, setCompanyResults] = useState<SearchHit[]>([]);
  const [busy, setBusy] = useState(false);

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
    quotesPageAction({ q: debouncedQ, status, sortKey: sort.key, sortDir: sort.dir, page, pageSize })
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

  function toggleSort(key: QuoteSortKey) {
    setSort((s) => (s.key === key ? { key, dir: (s.dir * -1) as 1 | -1 } : { key, dir: key === "company" ? 1 : -1 }));
    setPage(1);
  }

  async function create() {
    if (!companyId) return;
    setBusy(true);
    const r = await createQuoteAction(companyId, { validUntil: validUntil || null });
    setBusy(false);
    if (r.error || !r.id) {
      toast(r.error ?? "Could not create the quote.", { tone: "error" });
      return;
    }
    router.push(`/quotes/${r.id}`);
  }

  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);
  const hasFilters = !!(debouncedQ || status);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Quotes</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">{total} quote{total === 1 ? "" : "s"}</p>
        </div>
        <Button size="sm" onClick={() => setShowAdd((v) => !v)}><Plus size={15} /> New quote</Button>
      </div>

      {showAdd && (
        <Card className="space-y-3 p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold">New quote</p>
            <button onClick={() => setShowAdd(false)} className="text-muted-foreground hover:text-foreground"><X size={16} /></button>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            <div className="relative sm:col-span-2">
              {companyId ? (
                <div className="flex h-10 items-center justify-between gap-2 rounded-lg border border-border bg-secondary/40 px-3 text-sm">
                  <span className="truncate"><Building2 size={13} className="mr-1 inline text-muted-foreground" />{companyName}</span>
                  <button onClick={() => { setCompanyId(0); setCompanyName(""); setCompanyQuery(""); }} className="text-muted-foreground hover:text-foreground"><X size={14} /></button>
                </div>
              ) : (
                <>
                  <Input placeholder="Company *" value={companyQuery} onChange={(e) => setCompanyQuery(e.target.value)} />
                  {companyResults.length > 0 && (
                    <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-lg border border-border bg-popover shadow-pop">
                      {companyResults.map((c) => (
                        <button key={c.id} onClick={() => { setCompanyId(c.id); setCompanyName(c.name); setCompanyResults([]); }} className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-secondary">
                          <Building2 size={14} className="shrink-0 text-muted-foreground" />
                          <span className="flex-1 truncate">{c.name}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
            <Input type="date" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} title="Valid until" />
          </div>
          <p className="text-2xs text-muted-foreground">Creates a draft — you&apos;ll add line items next.</p>
          <div className="flex justify-end">
            <Button size="sm" onClick={create} disabled={busy || !companyId}>
              {busy ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />} Create draft
            </Button>
          </div>
        </Card>
      )}

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[180px] flex-1 sm:max-w-xs">
          <Search size={15} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search by company…" value={q} onChange={(e) => setQ(e.target.value)} className="h-9 pl-8" />
        </div>
        <div className="flex flex-wrap gap-1">
          {["", ...QUOTE_STATUSES].map((s) => (
            <button key={s || "all"} onClick={() => { setStatus(s); setPage(1); }} className={cn("rounded-lg px-2.5 py-1 text-xs font-medium transition-colors", status === s ? "bg-secondary text-foreground" : "text-muted-foreground hover:bg-secondary/60")}>
              {s ? QUOTE_STATUS_LABEL[s as keyof typeof QUOTE_STATUS_LABEL] : "All"}
            </button>
          ))}
        </div>
      </div>

      {/* Table (desktop) */}
      <Card className="hidden overflow-hidden p-0 md:block">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="border-b border-border bg-card text-2xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <Th label="Quote" k="number" sort={sort} onSort={toggleSort} />
                <Th label="Company" k="company" sort={sort} onSort={toggleSort} />
                <Th label="Status" k="status" sort={sort} onSort={toggleSort} />
                <Th label="Total" k="total" sort={sort} onSort={toggleSort} align="right" />
                <th className="px-3 py-2 text-right font-medium">Valid until</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}><td className="px-3 py-3" colSpan={5}><Skeleton className="h-4 w-full" /></td></tr>
                ))
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-3 py-12 text-center text-sm text-muted-foreground">
                    {hasFilters ? "No matches." : "No quotes yet — create your first."}
                  </td>
                </tr>
              ) : (
                rows.map((qt) => (
                  <tr key={qt.id} onClick={() => router.push(`/quotes/${qt.id}`)} className="cursor-pointer transition-colors hover:bg-secondary/50">
                    <td className="px-3 py-2.5 font-medium tabular">{qt.number}</td>
                    <td className="px-3 py-2.5 text-muted-foreground">{qt.companyName}</td>
                    <td className="px-3 py-2.5"><Badge tone={STATUS_TONE[qt.status] ?? "neutral"}>{QUOTE_STATUS_LABEL[qt.status as keyof typeof QUOTE_STATUS_LABEL] ?? qt.status}</Badge></td>
                    <td className="px-3 py-2.5 text-right font-medium tabular">{money(qt.total)}</td>
                    <td className="px-3 py-2.5 text-right text-2xs text-muted-foreground">{qt.validUntil ?? "—"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Card list (mobile) */}
      <div className="space-y-2 md:hidden">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-[70px] w-full rounded-xl" />)
        ) : rows.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border py-12 text-center text-sm text-muted-foreground">
            {hasFilters ? "No matches." : "No quotes yet."}
          </p>
        ) : (
          rows.map((qt) => (
            <button key={qt.id} onClick={() => router.push(`/quotes/${qt.id}`)} className="w-full rounded-xl border border-border bg-card p-3 text-left transition-colors active:bg-secondary/50">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate font-medium tabular">{qt.number} <span className="font-normal text-muted-foreground">· {qt.companyName}</span></p>
                  <p className="text-2xs text-muted-foreground">{qt.validUntil ? `Valid until ${qt.validUntil}` : "—"}</p>
                </div>
                <span className="shrink-0 text-sm font-semibold tabular">{money(qt.total)}</span>
              </div>
              <div className="mt-2"><Badge tone={STATUS_TONE[qt.status] ?? "neutral"}>{QUOTE_STATUS_LABEL[qt.status as keyof typeof QUOTE_STATUS_LABEL] ?? qt.status}</Badge></div>
            </button>
          ))
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

function Th({ label, k, sort, onSort, align }: { label: string; k: QuoteSortKey; sort: { key: QuoteSortKey; dir: 1 | -1 }; onSort: (k: QuoteSortKey) => void; align?: "right" }) {
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
