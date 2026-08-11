"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search, Loader2, Trash2, X, ArrowUp, ArrowDown, ChevronsUpDown, ChevronLeft, ChevronRight, Sparkles, ArrowRight } from "lucide-react";
import {
  leadsPageAction,
  createLeadAction,
  setLeadStatusAction,
  deleteLeadAction,
  convertLeadAction,
  type Lead,
} from "@/lib/actions/leads";
import {
  LEAD_STATUSES,
  LEAD_STATUS_LABEL,
  LEAD_SOURCES,
  LEAD_SOURCE_LABEL,
  type LeadSortKey,
} from "@/lib/crm/leads";
import { Card } from "@/components/ui/card";
import { Badge, type Tone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { eur } from "@/lib/format";
import { cn } from "@/lib/utils";

const STATUS_TONE: Record<string, Tone> = { new: "electric", working: "warning", qualified: "emerald", unqualified: "neutral", converted: "royal" };
const OPEN_STATUSES = LEAD_STATUSES.filter((s) => s !== "converted");
const emptyForm = { name: "", company: "", title: "", email: "", phone: "", source: "web", website: "", employees: "", annualValue: "", industryMatch: false, notes: "" };

function scoreClass(sc: number) {
  return sc >= 75 ? "bg-emerald/10 text-emerald" : sc >= 50 ? "bg-warning/10 text-warning" : "bg-secondary text-muted-foreground";
}

export default function LeadsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [rows, setRows] = useState<Lead[]>([]);
  const [total, setTotal] = useState(0);
  const [pageCount, setPageCount] = useState(1);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [status, setStatus] = useState("");
  const [source, setSource] = useState("");
  const [sort, setSort] = useState<{ key: LeadSortKey; dir: 1 | -1 }>({ key: "score", dir: -1 });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [reloadKey, setReloadKey] = useState(0);

  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState(emptyForm);
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
    leadsPageAction({ q: debouncedQ, status, source, sortKey: sort.key, sortDir: sort.dir, page, pageSize })
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
  }, [debouncedQ, status, source, sort, page, pageSize, reloadKey]);

  const refetch = () => setReloadKey((k) => k + 1);

  function toggleSort(key: LeadSortKey) {
    setSort((s) => (s.key === key ? { key, dir: (s.dir * -1) as 1 | -1 } : { key, dir: key === "score" ? -1 : 1 }));
    setPage(1);
  }

  async function add() {
    if (!form.name.trim() && !form.company.trim()) return;
    setBusy(true);
    const res = await createLeadAction({
      name: form.name, company: form.company, title: form.title, email: form.email, phone: form.phone,
      source: form.source, website: form.website, employees: form.employees ? Number(form.employees) : null,
      annualValue: form.annualValue ? Number(form.annualValue) : 0, industryMatch: form.industryMatch, notes: form.notes,
    });
    setBusy(false);
    if (res.error) {
      toast(res.error, { tone: "error" });
      return;
    }
    toast(`${(form.name || form.company).trim()} added`, { tone: "success" });
    setForm(emptyForm);
    setShowAdd(false);
    setPage(1);
    refetch();
  }

  async function changeStatus(l: Lead, next: string) {
    setRows((prev) => prev.map((r) => (r.id === l.id ? { ...r, status: next } : r))); // optimistic
    const res = await setLeadStatusAction(l.id, next);
    if (res.error) {
      toast(res.error, { tone: "error" });
      refetch();
    }
  }

  async function convert(l: Lead) {
    const res = await convertLeadAction(l.id);
    if (res.error) {
      toast(res.error, { tone: "error" });
      return;
    }
    toast(`${(l.company || l.name).trim()} converted to a company`, { tone: "success" });
    refetch();
  }

  async function remove(l: Lead) {
    if (typeof window !== "undefined" && !window.confirm(`Delete lead ${l.name || l.company}?`)) return;
    await deleteLeadAction(l.id);
    toast("Lead deleted", { tone: "success" });
    refetch();
  }

  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);
  const hasFilters = !!(debouncedQ || status || source);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Leads</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">{total} lead{total === 1 ? "" : "s"} to qualify</p>
        </div>
        <Button size="sm" onClick={() => setShowAdd((v) => !v)}>
          <Plus size={15} /> Add lead
        </Button>
      </div>

      {showAdd && (
        <Card className="space-y-3 p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold">New lead</p>
            <button onClick={() => setShowAdd(false)} className="text-muted-foreground hover:text-foreground"><X size={16} /></button>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            <Input placeholder="Contact name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <Input placeholder="Company" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} />
            <Input placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            <Input placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            <Input placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            <Select value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })}>
              {LEAD_SOURCES.map((s) => <option key={s} value={s}>{LEAD_SOURCE_LABEL[s]}</option>)}
            </Select>
            <Input placeholder="Website" value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} />
            <Input type="number" placeholder="Employees" value={form.employees} onChange={(e) => setForm({ ...form, employees: e.target.value })} />
            <Input type="number" placeholder="Est. annual value (€)" value={form.annualValue} onChange={(e) => setForm({ ...form, annualValue: e.target.value })} />
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <input type="checkbox" checked={form.industryMatch} onChange={(e) => setForm({ ...form, industryMatch: e.target.checked })} className="h-4 w-4 accent-electric" /> Industry fit
            </label>
            <Input placeholder="Notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="sm:col-span-2" />
          </div>
          <p className="text-2xs text-muted-foreground">A name or a company is required. The lead score is computed from website, size, fit and value.</p>
          <div className="flex justify-end">
            <Button size="sm" onClick={add} disabled={busy || (!form.name.trim() && !form.company.trim())}>
              {busy ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />} Create
            </Button>
          </div>
        </Card>
      )}

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[180px] flex-1 sm:max-w-xs">
          <Search size={15} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search leads…" value={q} onChange={(e) => setQ(e.target.value)} className="h-9 pl-8" />
        </div>
        <div className="flex flex-wrap gap-1">
          {["", ...LEAD_STATUSES].map((s) => (
            <button
              key={s || "all"}
              onClick={() => { setStatus(s); setPage(1); }}
              className={cn("rounded-lg px-2.5 py-1 text-xs font-medium transition-colors", status === s ? "bg-secondary text-foreground" : "text-muted-foreground hover:bg-secondary/60")}
            >
              {s ? LEAD_STATUS_LABEL[s as keyof typeof LEAD_STATUS_LABEL] : "All"}
            </button>
          ))}
        </div>
        <Select value={source} onChange={(e) => { setSource(e.target.value); setPage(1); }} className="ml-auto h-9 w-auto text-xs">
          <option value="">All sources</option>
          {LEAD_SOURCES.map((s) => <option key={s} value={s}>{LEAD_SOURCE_LABEL[s]}</option>)}
        </Select>
      </div>

      {/* Table (desktop) */}
      <Card className="hidden overflow-hidden p-0 md:block">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-sm">
            <thead className="border-b border-border bg-card text-2xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <Th label="Lead" k="name" sort={sort} onSort={toggleSort} />
                <Th label="Source" k="source" sort={sort} onSort={toggleSort} />
                <Th label="Score" k="score" sort={sort} onSort={toggleSort} align="right" />
                <Th label="Status" k="status" sort={sort} onSort={toggleSort} />
                <th className="px-3 py-2 text-right font-medium">Actions</th>
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
                    {hasFilters ? "No matches." : "No leads yet — add your first lead."}
                  </td>
                </tr>
              ) : (
                rows.map((l) => {
                  const converted = l.status === "converted";
                  return (
                    <tr key={l.id} className="transition-colors hover:bg-secondary/40">
                      <td className="px-3 py-2.5">
                        <button onClick={() => router.push(`/leads/${l.id}`)} className="text-left">
                          <p className="font-medium hover:text-electric hover:underline">{l.name || l.company || "—"}</p>
                          <p className="text-2xs text-muted-foreground">{[l.title, l.company && l.name ? l.company : null].filter(Boolean).join(" · ") || l.email}</p>
                        </button>
                      </td>
                      <td className="px-3 py-2.5 text-muted-foreground">{LEAD_SOURCE_LABEL[l.source as keyof typeof LEAD_SOURCE_LABEL] ?? l.source}</td>
                      <td className="px-3 py-2.5 text-right">
                        <span className={cn("inline-block min-w-[26px] rounded px-1.5 py-0.5 text-2xs font-semibold tabular", scoreClass(l.score))}>{l.score}</span>
                      </td>
                      <td className="px-3 py-2.5">
                        {converted ? (
                          l.convertedCompanyId ? (
                            <button onClick={() => router.push(`/companies/${l.convertedCompanyId}`)} className="inline-flex items-center gap-1 text-xs text-royal hover:underline">
                              <Badge tone="royal">Converted</Badge>
                            </button>
                          ) : (
                            <Badge tone="royal">Converted</Badge>
                          )
                        ) : (
                          <Select value={l.status} onChange={(e) => changeStatus(l, e.target.value)} className="h-7 w-auto text-2xs">
                            {OPEN_STATUSES.map((s) => <option key={s} value={s}>{LEAD_STATUS_LABEL[s]}</option>)}
                          </Select>
                        )}
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="flex items-center justify-end gap-1">
                          {!converted && (
                            <Button size="sm" variant="outline" onClick={() => convert(l)} title="Convert to a company">
                              <Sparkles size={13} /> Convert <ArrowRight size={12} />
                            </Button>
                          )}
                          <button onClick={() => remove(l)} className="grid h-7 w-7 place-items-center rounded text-muted-foreground hover:text-danger" title="Delete lead"><Trash2 size={14} /></button>
                        </div>
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
            {hasFilters ? "No matches." : "No leads yet."}
          </p>
        ) : (
          rows.map((l) => {
            const converted = l.status === "converted";
            return (
              <div key={l.id} className="rounded-xl border border-border bg-card p-3">
                <div className="flex items-start justify-between gap-2">
                  <button onClick={() => router.push(`/leads/${l.id}`)} className="min-w-0 text-left">
                    <p className="truncate font-medium hover:text-electric">{l.name || l.company || "—"}</p>
                    <p className="truncate text-2xs text-muted-foreground">{[l.title, l.company].filter(Boolean).join(" · ") || l.email || "—"}</p>
                  </button>
                  <span className={cn("shrink-0 rounded px-1.5 py-0.5 text-2xs font-semibold tabular", scoreClass(l.score))}>{l.score}</span>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <Badge tone={STATUS_TONE[l.status] ?? "neutral"}>{LEAD_STATUS_LABEL[l.status as keyof typeof LEAD_STATUS_LABEL] ?? l.status}</Badge>
                  <span className="text-2xs text-muted-foreground">{LEAD_SOURCE_LABEL[l.source as keyof typeof LEAD_SOURCE_LABEL] ?? l.source}</span>
                  <div className="ml-auto flex items-center gap-1">
                    {!converted && <Button size="sm" variant="outline" onClick={() => convert(l)}><Sparkles size={13} /> Convert</Button>}
                    <button onClick={() => remove(l)} className="grid h-7 w-7 place-items-center rounded text-muted-foreground hover:text-danger"><Trash2 size={13} /></button>
                  </div>
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

function Th({ label, k, sort, onSort, align }: { label: string; k: LeadSortKey; sort: { key: LeadSortKey; dir: 1 | -1 }; onSort: (k: LeadSortKey) => void; align?: "right" }) {
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
