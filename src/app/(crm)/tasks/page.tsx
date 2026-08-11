"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search, Loader2, Trash2, X, ChevronLeft, ChevronRight, Building2, CalendarClock } from "lucide-react";
import {
  tasksPageAction,
  createTaskAction,
  toggleTaskDoneAction,
  deleteTaskAction,
  type Task,
} from "@/lib/actions/tasks";
import { searchCompaniesAction, type SearchHit } from "@/lib/actions/crm";
import { TASK_PRIORITIES, TASK_PRIORITY_LABEL } from "@/lib/crm/tasks";
import { Card } from "@/components/ui/card";
import { Badge, type Tone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

const PRIORITY_TONE: Record<string, Tone> = { high: "danger", normal: "neutral", low: "neutral" };
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const SORTS = [
  { id: "due", label: "Due date", key: "due", dir: 1 as const },
  { id: "priority", label: "Priority", key: "priority", dir: 1 as const },
  { id: "title", label: "Title", key: "title", dir: 1 as const },
  { id: "created", label: "Newest", key: "created", dir: -1 as const },
];

const DONE_FILTERS = [
  { id: "open", label: "Open", done: false as boolean | undefined },
  { id: "done", label: "Done", done: true as boolean | undefined },
  { id: "all", label: "All", done: undefined as boolean | undefined },
];

function dueLabel(ymd: string | null): { label: string; tone: "danger" | "warning" | "muted" } | null {
  if (!ymd) return null;
  const d = new Date(`${ymd}T00:00:00`);
  if (Number.isNaN(d.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const days = Math.round((d.getTime() - today.getTime()) / 86_400_000);
  if (days < 0) return { label: `${Math.abs(days)}d overdue`, tone: "danger" };
  if (days === 0) return { label: "Due today", tone: "warning" };
  if (days <= 7) return { label: `in ${days}d`, tone: "warning" };
  return { label: `${MONTHS[d.getMonth()]} ${d.getDate()}`, tone: "muted" };
}

const emptyForm = { title: "", dueDate: "", priority: "normal", notes: "", companyId: 0, companyName: "" };

export default function TasksPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [rows, setRows] = useState<Task[]>([]);
  const [total, setTotal] = useState(0);
  const [pageCount, setPageCount] = useState(1);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [doneFilter, setDoneFilter] = useState("open");
  const [priority, setPriority] = useState("");
  const [sortId, setSortId] = useState("due");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [reloadKey, setReloadKey] = useState(0);

  const [showAdd, setShowAdd] = useState(false);
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
    const sort = SORTS.find((s) => s.id === sortId) ?? SORTS[0];
    const done = DONE_FILTERS.find((f) => f.id === doneFilter)?.done;
    tasksPageAction({ q: debouncedQ, done, priority, sortKey: sort.key, sortDir: sort.dir, page, pageSize })
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
  }, [debouncedQ, doneFilter, priority, sortId, page, pageSize, reloadKey]);

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

  async function add() {
    if (!form.title.trim()) return;
    setBusy(true);
    const r = await createTaskAction({
      title: form.title, dueDate: form.dueDate || null, priority: form.priority, notes: form.notes,
      companyId: form.companyId || null,
    });
    setBusy(false);
    if (r.error) {
      toast(r.error, { tone: "error" });
      return;
    }
    toast("Task added", { tone: "success" });
    setForm(emptyForm);
    setCompanyQuery("");
    setShowAdd(false);
    setPage(1);
    refetch();
  }

  async function toggle(t: Task) {
    const next = !t.done;
    setRows((prev) => prev.map((r) => (r.id === t.id ? { ...r, done: next } : r))); // optimistic
    const res = await toggleTaskDoneAction(t.id, next);
    if (res.error) {
      toast(res.error, { tone: "error" });
      refetch();
    } else if (doneFilter !== "all") {
      // it no longer matches the Open/Done filter — drop it after a beat
      setTimeout(refetch, 400);
    }
  }

  async function remove(t: Task) {
    await deleteTaskAction(t.id);
    toast("Task deleted", { tone: "success" });
    refetch();
  }

  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);
  const hasFilters = !!(debouncedQ || priority || doneFilter !== "open");

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Tasks</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">{total} task{total === 1 ? "" : "s"}</p>
        </div>
        <Button size="sm" onClick={() => setShowAdd((v) => !v)}>
          <Plus size={15} /> Add task
        </Button>
      </div>

      {showAdd && (
        <Card className="space-y-3 p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold">New task</p>
            <button onClick={() => setShowAdd(false)} className="text-muted-foreground hover:text-foreground"><X size={16} /></button>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            <Input placeholder="Task title *" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="lg:col-span-2" />
            <Input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
            <Select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
              {TASK_PRIORITIES.map((p) => <option key={p} value={p}>{TASK_PRIORITY_LABEL[p]} priority</option>)}
            </Select>
            <div className="relative">
              {form.companyId ? (
                <div className="flex h-10 items-center justify-between gap-2 rounded-lg border border-border bg-secondary/40 px-3 text-sm">
                  <span className="truncate"><Building2 size={13} className="mr-1 inline text-muted-foreground" />{form.companyName}</span>
                  <button onClick={() => { setForm({ ...form, companyId: 0, companyName: "" }); setCompanyQuery(""); }} className="text-muted-foreground hover:text-foreground"><X size={14} /></button>
                </div>
              ) : (
                <>
                  <Input placeholder="Link to company (optional)" value={companyQuery} onChange={(e) => setCompanyQuery(e.target.value)} />
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
            <Input placeholder="Notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="sm:col-span-2 lg:col-span-3" />
          </div>
          <div className="flex justify-end">
            <Button size="sm" onClick={add} disabled={busy || !form.title.trim()}>
              {busy ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />} Create
            </Button>
          </div>
        </Card>
      )}

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[180px] flex-1 sm:max-w-xs">
          <Search size={15} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search tasks…" value={q} onChange={(e) => setQ(e.target.value)} className="h-9 pl-8" />
        </div>
        <div className="flex gap-1">
          {DONE_FILTERS.map((f) => (
            <button key={f.id} onClick={() => { setDoneFilter(f.id); setPage(1); }} className={cn("rounded-lg px-2.5 py-1 text-xs font-medium transition-colors", doneFilter === f.id ? "bg-secondary text-foreground" : "text-muted-foreground hover:bg-secondary/60")}>
              {f.label}
            </button>
          ))}
        </div>
        <Select value={priority} onChange={(e) => { setPriority(e.target.value); setPage(1); }} className="h-9 w-auto text-xs">
          <option value="">Any priority</option>
          {TASK_PRIORITIES.map((p) => <option key={p} value={p}>{TASK_PRIORITY_LABEL[p]}</option>)}
        </Select>
        <Select value={sortId} onChange={(e) => { setSortId(e.target.value); setPage(1); }} className="ml-auto h-9 w-auto text-xs">
          {SORTS.map((s) => <option key={s.id} value={s.id}>Sort: {s.label}</option>)}
        </Select>
      </div>

      {/* List */}
      <div className="space-y-2">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-[58px] w-full rounded-xl" />)
        ) : rows.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border py-12 text-center text-sm text-muted-foreground">
            {hasFilters ? "No matching tasks." : "No open tasks — add one to stay on top of your follow-ups."}
          </p>
        ) : (
          rows.map((t) => {
            const due = dueLabel(t.dueDate);
            return (
              <div key={t.id} className={cn("flex items-start gap-3 rounded-xl border border-border bg-card p-3", t.done && "opacity-60")}>
                <button
                  onClick={() => toggle(t)}
                  className={cn("mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-md border transition-colors", t.done ? "border-emerald bg-emerald text-white" : "border-border hover:border-electric")}
                  aria-label={t.done ? "Mark not done" : "Mark done"}
                >
                  {t.done && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M20 6 9 17l-5-5" /></svg>}
                </button>
                <div className="min-w-0 flex-1">
                  <p className={cn("text-sm font-medium", t.done && "line-through")}>{t.title}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-2xs">
                    {t.priority === "high" && <Badge tone={PRIORITY_TONE.high}>High</Badge>}
                    {due && !t.done && (
                      <span className={cn("inline-flex items-center gap-1", due.tone === "danger" ? "text-danger" : due.tone === "warning" ? "text-warning" : "text-muted-foreground")}>
                        <CalendarClock size={11} /> {due.label}
                      </span>
                    )}
                    {t.companyId && t.companyName && (
                      <button onClick={() => router.push(`/companies/${t.companyId}`)} className="inline-flex items-center gap-1 text-muted-foreground hover:text-electric">
                        <Building2 size={11} /> {t.companyName}
                      </button>
                    )}
                    {t.notes && <span className="truncate text-muted-foreground">{t.notes}</span>}
                  </div>
                </div>
                <button onClick={() => remove(t)} className="grid h-7 w-7 shrink-0 place-items-center rounded text-muted-foreground hover:text-danger" title="Delete task"><Trash2 size={14} /></button>
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
