"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search, Loader2, X, ArrowUp, ArrowDown, ChevronsUpDown, ChevronLeft, ChevronRight, Building2 } from "lucide-react";
import { invoicesPageAction, createInvoiceAction, type Invoice } from "@/lib/actions/invoices";
import { searchCompaniesAction, type SearchHit } from "@/lib/actions/crm";
import { INVOICE_STATUSES, INVOICE_STATUS_LABEL, type InvoiceSortKey } from "@/lib/crm/invoices";
import { Card } from "@/components/ui/card";
import { Badge, type Tone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { useCanWrite } from "@/components/crm/role-context";
import { ExportButton } from "@/components/crm/export-button";
import { cn } from "@/lib/utils";

const STATUS_TONE: Record<string, Tone> = { draft: "neutral", sent: "electric", paid: "emerald", void: "neutral" };
const money = (euros: number) => "€" + euros.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function statusBadge(inv: Invoice): { label: string; tone: Tone } {
  if (inv.overdue) return { label: "Overdue", tone: "danger" };
  return { label: INVOICE_STATUS_LABEL[inv.status as keyof typeof INVOICE_STATUS_LABEL] ?? inv.status, tone: STATUS_TONE[inv.status] ?? "neutral" };
}

export default function InvoicesPage() {
  const router = useRouter();
  const { toast } = useToast();
  const canWrite = useCanWrite();
  const [rows, setRows] = useState<Invoice[]>([]);
  const [summary, setSummary] = useState({ outstanding: 0, overdue: 0, paid: 0, draftCount: 0 });
  const [total, setTotal] = useState(0);
  const [pageCount, setPageCount] = useState(1);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [status, setStatus] = useState("");
  const [sort, setSort] = useState<{ key: InvoiceSortKey; dir: 1 | -1 }>({ key: "created", dir: -1 });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [reloadKey, setReloadKey] = useState(0);

  const [showAdd, setShowAdd] = useState(false);
  const [dueDate, setDueDate] = useState("");
  const [companyId, setCompanyId] = useState(0);
  const [companyName, setCompanyName] = useState("");
  const [companyQuery, setCompanyQuery] = useState("");
  const [companyResults, setCompanyResults] = useState<SearchHit[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => { setDebouncedQ(q); setPage(1); }, 250);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    invoicesPageAction({ q: debouncedQ, status, sortKey: sort.key, sortDir: sort.dir, page, pageSize })
      .then((res) => {
        if (cancelled) return;
        setRows(res.rows);
        setSummary(res.summary);
        setTotal(res.total);
        setPageCount(res.pageCount);
        if (res.page !== page) setPage(res.page);
      })
      .catch(() => { if (!cancelled) { setRows([]); setTotal(0); setPageCount(1); } })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQ, status, sort, page, pageSize, reloadKey]);

  useEffect(() => {
    if (!showAdd) return;
    const s = companyQuery.trim();
    if (!s) { setCompanyResults([]); return; }
    const t = setTimeout(async () => setCompanyResults(await searchCompaniesAction(s).catch(() => [])), 200);
    return () => clearTimeout(t);
  }, [companyQuery, showAdd]);

  function toggleSort(key: InvoiceSortKey) {
    setSort((s) => (s.key === key ? { key, dir: (s.dir * -1) as 1 | -1 } : { key, dir: key === "company" ? 1 : -1 }));
    setPage(1);
  }

  async function collectInvoices(): Promise<unknown[][]> {
    const out: unknown[][] = [["Invoice", "Company", "Status", "Total (EUR)", "Issue date", "Due date", "Overdue"]];
    for (let p = 1; p <= 20; p++) {
      const res = await invoicesPageAction({ q: debouncedQ, status, sortKey: sort.key, sortDir: sort.dir, page: p, pageSize: 100 }).catch(() => null);
      if (!res || res.rows.length === 0) break;
      for (const inv of res.rows) out.push([inv.number, inv.companyName, inv.status, inv.total.toFixed(2), inv.issueDate ?? "", inv.dueDate ?? "", inv.overdue ? "yes" : ""]);
      if (p >= res.pageCount) break;
    }
    return out;
  }

  async function create() {
    if (!companyId) return;
    setBusy(true);
    const r = await createInvoiceAction(companyId, { dueDate: dueDate || null });
    setBusy(false);
    if (r.error || !r.id) return toast(r.error ?? "Could not create the invoice.", { tone: "error" });
    router.push(`/invoices/${r.id}`);
  }

  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);
  const hasFilters = !!(debouncedQ || status);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Invoices</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">{total} invoice{total === 1 ? "" : "s"}</p>
        </div>
        {canWrite && <Button size="sm" onClick={() => setShowAdd((v) => !v)}><Plus size={15} /> New invoice</Button>}
      </div>

      {/* Summary */}
      <div className="grid gap-3 sm:grid-cols-3">
        <Card className="p-4"><p className="text-2xs font-medium uppercase tracking-wide text-muted-foreground">Outstanding</p><p className="mt-1 text-xl font-semibold tabular">{money(summary.outstanding)}</p></Card>
        <Card className="p-4"><p className="text-2xs font-medium uppercase tracking-wide text-muted-foreground">Overdue</p><p className={cn("mt-1 text-xl font-semibold tabular", summary.overdue > 0 && "text-danger")}>{money(summary.overdue)}</p></Card>
        <Card className="p-4"><p className="text-2xs font-medium uppercase tracking-wide text-muted-foreground">Paid</p><p className="mt-1 text-xl font-semibold tabular text-emerald">{money(summary.paid)}</p></Card>
      </div>

      {canWrite && showAdd && (
        <Card className="space-y-3 p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold">New invoice</p>
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
            <label className="text-2xs text-muted-foreground">Due date<Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="mt-1" /></label>
          </div>
          <p className="text-2xs text-muted-foreground">Creates a draft — add line items next. Or start an invoice from an accepted quote on the quote page.</p>
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
          {["", ...INVOICE_STATUSES].map((s) => (
            <button key={s || "all"} onClick={() => { setStatus(s); setPage(1); }} className={cn("rounded-lg px-2.5 py-1 text-xs font-medium transition-colors", status === s ? "bg-secondary text-foreground" : "text-muted-foreground hover:bg-secondary/60")}>
              {s ? INVOICE_STATUS_LABEL[s as keyof typeof INVOICE_STATUS_LABEL] : "All"}
            </button>
          ))}
        </div>
        <div className="ml-auto"><ExportButton filename="invoices.csv" collect={collectInvoices} disabled={total === 0} /></div>
      </div>

      {/* Table (desktop) */}
      <Card className="hidden overflow-hidden p-0 md:block">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="border-b border-border bg-card text-2xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <Th label="Invoice" k="number" sort={sort} onSort={toggleSort} />
                <Th label="Company" k="company" sort={sort} onSort={toggleSort} />
                <Th label="Status" k="status" sort={sort} onSort={toggleSort} />
                <Th label="Total" k="total" sort={sort} onSort={toggleSort} align="right" />
                <Th label="Due" k="due" sort={sort} onSort={toggleSort} align="right" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => <tr key={i}><td className="px-3 py-3" colSpan={5}><Skeleton className="h-4 w-full" /></td></tr>)
              ) : rows.length === 0 ? (
                <tr><td colSpan={5} className="px-3 py-12 text-center text-sm text-muted-foreground">{hasFilters ? "No matches." : "No invoices yet — create your first."}</td></tr>
              ) : (
                rows.map((inv) => {
                  const b = statusBadge(inv);
                  return (
                    <tr key={inv.id} onClick={() => router.push(`/invoices/${inv.id}`)} className="cursor-pointer transition-colors hover:bg-secondary/50">
                      <td className="px-3 py-2.5 font-medium tabular">{inv.number}</td>
                      <td className="px-3 py-2.5 text-muted-foreground">{inv.companyName}</td>
                      <td className="px-3 py-2.5"><Badge tone={b.tone}>{b.label}</Badge></td>
                      <td className="px-3 py-2.5 text-right font-medium tabular">{money(inv.total)}</td>
                      <td className={cn("px-3 py-2.5 text-right text-2xs", inv.overdue ? "font-medium text-danger" : "text-muted-foreground")}>{inv.dueDate ?? "—"}</td>
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
          Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-[70px] w-full rounded-xl" />)
        ) : rows.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border py-12 text-center text-sm text-muted-foreground">{hasFilters ? "No matches." : "No invoices yet."}</p>
        ) : (
          rows.map((inv) => {
            const b = statusBadge(inv);
            return (
              <button key={inv.id} onClick={() => router.push(`/invoices/${inv.id}`)} className="w-full rounded-xl border border-border bg-card p-3 text-left transition-colors active:bg-secondary/50">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-medium tabular">{inv.number} <span className="font-normal text-muted-foreground">· {inv.companyName}</span></p>
                    <p className={cn("text-2xs", inv.overdue ? "font-medium text-danger" : "text-muted-foreground")}>{inv.dueDate ? `Due ${inv.dueDate}` : "—"}</p>
                  </div>
                  <span className="shrink-0 text-sm font-semibold tabular">{money(inv.total)}</span>
                </div>
                <div className="mt-2"><Badge tone={b.tone}>{b.label}</Badge></div>
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
    </div>
  );
}

function Th({ label, k, sort, onSort, align }: { label: string; k: InvoiceSortKey; sort: { key: InvoiceSortKey; dir: 1 | -1 }; onSort: (k: InvoiceSortKey) => void; align?: "right" }) {
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
