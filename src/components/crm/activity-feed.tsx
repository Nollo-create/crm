"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search, Loader2, X, ChevronLeft, ChevronRight, Building2, StickyNote, Phone, Mail, CalendarDays, FileText, Trash2 } from "lucide-react";
import {
  activitiesPageAction,
  addActivityAction,
  deleteActivityAction,
  searchCompaniesAction,
  type ActivityFeedItem,
  type SearchHit,
} from "@/lib/actions/crm";
import { ACTIVITY_TYPES, ACTIVITY_TYPE_LABEL, type ActivityType } from "@/lib/crm/activities";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { useCanWrite } from "@/components/crm/role-context";
import { timeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";

const TYPE_ICON: Record<string, typeof StickyNote> = { note: StickyNote, call: Phone, email: Mail, meeting: CalendarDays, quote: FileText };
const TYPE_STYLE: Record<string, string> = {
  note: "bg-secondary text-muted-foreground",
  call: "bg-electric/10 text-electric",
  email: "bg-royal/15 text-royal",
  meeting: "bg-warning/10 text-warning",
  quote: "bg-emerald/10 text-emerald",
};

const SORTS = [
  { id: "newest", label: "Newest", dir: -1 as const },
  { id: "oldest", label: "Oldest", dir: 1 as const },
];

const RANGES = [
  { id: 0, label: "All time" },
  { id: 7, label: "Last 7 days" },
  { id: 30, label: "Last 30 days" },
  { id: 90, label: "Last 90 days" },
];

// Singular/plural noun per feed, for the header count + the log button.
const NOUN: Record<string, [string, string]> = {
  meeting: ["meeting", "meetings"],
  call: ["call", "calls"],
  email: ["email", "emails"],
};

/** The cross-company activity feed. Reused for /activities (all types) and the
 *  single-type views /meetings, /calls, /emails via `fixedType`. */
export function ActivityFeed({ title, fixedType }: { title: string; fixedType?: ActivityType }) {
  const router = useRouter();
  const { toast } = useToast();
  const canWrite = useCanWrite();
  const [singular, plural] = fixedType ? NOUN[fixedType] : ["activity", "activities"];

  const [rows, setRows] = useState<ActivityFeedItem[]>([]);
  const [total, setTotal] = useState(0);
  const [pageCount, setPageCount] = useState(1);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [type, setType] = useState("");
  const [since, setSince] = useState(0); // days back; 0 = all time
  const [sortId, setSortId] = useState("newest");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [reloadKey, setReloadKey] = useState(0);

  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ type: (fixedType ?? "note") as string, summary: "", companyId: 0, companyName: "" });
  const [busy, setBusy] = useState(false);
  const [companyQuery, setCompanyQuery] = useState("");
  const [companyResults, setCompanyResults] = useState<SearchHit[]>([]);

  const activeType = fixedType ?? type; // fixed views ignore the (hidden) type filter

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
    const dir = SORTS.find((s) => s.id === sortId)?.dir ?? -1;
    activitiesPageAction({ q: debouncedQ, type: activeType, sinceDays: since || undefined, sortKey: "created", sortDir: dir, page, pageSize })
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
  }, [debouncedQ, activeType, since, sortId, page, pageSize, reloadKey]);

  const refetch = () => setReloadKey((k) => k + 1);

  async function remove(id: number) {
    if (typeof window !== "undefined" && !window.confirm(`Delete this ${singular}?`)) return;
    await deleteActivityAction(id);
    toast(`${singular[0].toUpperCase()}${singular.slice(1)} deleted`, { tone: "success" });
    refetch();
  }

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

  async function log() {
    if (!form.summary.trim() || !form.companyId) return;
    setBusy(true);
    const r = await addActivityAction({ companyId: form.companyId, type: form.type, summary: form.summary });
    setBusy(false);
    if (r.error) {
      toast(r.error, { tone: "error" });
      return;
    }
    toast("Activity logged", { tone: "success" });
    setForm({ type: (fixedType ?? "note") as string, summary: "", companyId: 0, companyName: "" });
    setCompanyQuery("");
    setShowAdd(false);
    setPage(1);
    refetch();
  }

  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);
  const hasFilters = !!(debouncedQ || (!fixedType && type));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {total} {total === 1 ? singular : plural}
            {!fixedType && " across your accounts"}
          </p>
        </div>
        {canWrite && (
          <Button size="sm" onClick={() => setShowAdd((v) => !v)}>
            <Plus size={15} /> Log {singular}
          </Button>
        )}
      </div>

      {canWrite && showAdd && (
        <Card className="space-y-3 p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold">Log {singular}</p>
            <button onClick={() => setShowAdd(false)} className="text-muted-foreground hover:text-foreground"><X size={16} /></button>
          </div>
          <div className={cn("grid gap-2 sm:grid-cols-2", fixedType ? "lg:grid-cols-3" : "lg:grid-cols-4")}>
            {!fixedType && (
              <Select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                {ACTIVITY_TYPES.map((t) => <option key={t} value={t}>{ACTIVITY_TYPE_LABEL[t]}</option>)}
              </Select>
            )}
            <Input placeholder="What happened? *" value={form.summary} onChange={(e) => setForm({ ...form, summary: e.target.value })} className="sm:col-span-2" onKeyDown={(e) => { if (e.key === "Enter") log(); }} />
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
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
          <div className="flex justify-end">
            <Button size="sm" onClick={log} disabled={busy || !form.summary.trim() || !form.companyId}>
              {busy ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />} Log
            </Button>
          </div>
        </Card>
      )}

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[180px] flex-1 sm:max-w-xs">
          <Search size={15} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder={`Search ${plural}…`} value={q} onChange={(e) => setQ(e.target.value)} className="h-9 pl-8" />
        </div>
        {!fixedType && (
          <div className="flex flex-wrap gap-1">
            {["", ...ACTIVITY_TYPES].map((t) => (
              <button key={t || "all"} onClick={() => { setType(t); setPage(1); }} className={cn("rounded-lg px-2.5 py-1 text-xs font-medium transition-colors", type === t ? "bg-secondary text-foreground" : "text-muted-foreground hover:bg-secondary/60")}>
                {t ? ACTIVITY_TYPE_LABEL[t as keyof typeof ACTIVITY_TYPE_LABEL] : "All"}
              </button>
            ))}
          </div>
        )}
        <Select value={String(since)} onChange={(e) => { setSince(Number(e.target.value)); setPage(1); }} className="ml-auto h-9 w-auto text-xs">
          {RANGES.map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}
        </Select>
        <Select value={sortId} onChange={(e) => { setSortId(e.target.value); setPage(1); }} className="h-9 w-auto text-xs">
          {SORTS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
        </Select>
      </div>

      {/* Feed */}
      <Card className="p-0">
        {loading ? (
          <div className="space-y-3 p-4">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}
          </div>
        ) : rows.length === 0 ? (
          <p className="px-4 py-12 text-center text-sm text-muted-foreground">
            {hasFilters ? `No matching ${plural}.` : `No ${plural} yet — log your first.`}
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {rows.map((a) => {
              const Icon = TYPE_ICON[a.type] ?? StickyNote;
              return (
                <li key={a.id} className="group flex items-start gap-3 px-4 py-3">
                  <span className={cn("mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full", TYPE_STYLE[a.type] ?? "bg-secondary text-muted-foreground")}>
                    <Icon size={14} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm">{a.summary}</p>
                    <div className="mt-0.5 flex flex-wrap items-center gap-x-2 text-2xs text-muted-foreground">
                      <button onClick={() => router.push(`/companies/${a.companyId}`)} className="inline-flex items-center gap-1 hover:text-electric">
                        <Building2 size={11} /> {a.companyName}
                      </button>
                      {!fixedType && (
                        <>
                          <span>·</span>
                          <span className="capitalize">{a.type}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className="text-2xs text-muted-foreground">{timeAgo(a.createdAt)}</span>
                    {canWrite && <button onClick={() => remove(a.id)} className="text-muted-foreground opacity-0 transition-opacity hover:text-danger group-hover:opacity-100" title={`Delete ${singular}`} aria-label="Delete"><Trash2 size={13} /></button>}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>

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
