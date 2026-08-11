"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, Search, Trash2, Download, X, ArrowUp, ArrowDown, ChevronsUpDown, Loader2, Rows3, Rows2, Bookmark, Check } from "lucide-react";
import {
  listCompaniesTableAction,
  createCompanyAction,
  bulkDeleteCompaniesAction,
  bulkSetStatusAction,
  type CompanyRowView,
} from "@/lib/actions/crm";
import { leadScore } from "@/lib/crm/pipeline";
import { Card } from "@/components/ui/card";
import { Badge, type Tone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { CompanyDrawer } from "@/components/crm/company-drawer";
import { BUILTIN_VIEWS, activeViewId, makeView, normalizeViews, type CompanyView, type CompanySortKey, type ViewState } from "@/lib/crm/views";
import { eur, timeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";

const VIEWS_KEY = "crm-company-views";

const STATUS_LABEL: Record<string, string> = { lead: "Lead", active: "Active", customer: "Customer", at_risk: "At risk", lost: "Lost" };
const STATUS_TONE: Record<string, Tone> = { lead: "warning", active: "electric", customer: "emerald", at_risk: "danger", lost: "neutral" };
const empty = { name: "", industry: "", city: "", website: "", employees: "", annualValue: "", status: "lead", accountManager: "", industryMatch: false };

function score(c: CompanyRowView) {
  return leadScore({ hasWebsite: !!c.website, employees: c.employees, industryMatch: c.industryMatch, annualValue: c.annualValue });
}
function health(c: CompanyRowView): { tone: Tone; label: string; rank: number } {
  if (!c.lastActivity) return { tone: "neutral", label: "New", rank: 2 };
  const days = (Date.now() - new Date(c.lastActivity).getTime()) / 86_400_000;
  if (days > 30) return { tone: "danger", label: "At risk", rank: 0 };
  if (c.openValue > 0 && days <= 14) return { tone: "emerald", label: "Healthy", rank: 3 };
  return { tone: "warning", label: "Attention", rank: 1 };
}

type SortKey = CompanySortKey;

export default function CompaniesPage() {
  const { toast } = useToast();
  const [all, setAll] = useState<CompanyRowView[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [density, setDensity] = useState<"comfortable" | "compact">("comfortable");
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({ key: "score", dir: -1 });
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [showCreate, setShowCreate] = useState(false);
  const [peek, setPeek] = useState<number | null>(null);
  const [userViews, setUserViews] = useState<CompanyView[]>([]);
  const [savingView, setSavingView] = useState(false);
  const [viewName, setViewName] = useState("");
  const [form, setForm] = useState(empty);
  const [busy, setBusy] = useState(false);
  const [bulkBusy, setBulkBusy] = useState(false);

  async function load() {
    setLoading(true);
    try {
      setAll(await listCompaniesTableAction());
    } catch {
      /* no db */
    }
    setLoading(false);
    setSelected(new Set());
  }
  useEffect(() => {
    setDensity((localStorage.getItem("crm-density") as "comfortable" | "compact") || "comfortable");
    try {
      setUserViews(normalizeViews(JSON.parse(localStorage.getItem(VIEWS_KEY) || "[]")));
    } catch {
      /* ignore malformed storage */
    }
    void load();
  }, []);

  const allViews = useMemo(() => [...BUILTIN_VIEWS, ...userViews], [userViews]);
  const viewState: ViewState = { status, sortKey: sort.key, sortDir: sort.dir };
  const activeId = activeViewId(allViews, viewState);

  function persistViews(next: CompanyView[]) {
    setUserViews(next);
    try {
      localStorage.setItem(VIEWS_KEY, JSON.stringify(next));
    } catch {
      /* ignore quota errors */
    }
  }
  function applyView(v: CompanyView) {
    setStatus(v.status);
    setSort({ key: v.sortKey, dir: v.sortDir });
    setSelected(new Set());
  }
  function saveCurrentView() {
    const name = viewName.trim();
    if (!name) return;
    const id = typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `v${Date.now().toString(36)}`;
    persistViews([...userViews, makeView(id, name, viewState)]);
    setViewName("");
    setSavingView(false);
  }
  function deleteView(id: string) {
    persistViews(userViews.filter((v) => v.id !== id));
  }

  const shown = useMemo(() => {
    const s = q.trim().toLowerCase();
    const filtered = all.filter(
      (c) => (!status || c.status === status) && (!s || `${c.name} ${c.industry} ${c.city}`.toLowerCase().includes(s))
    );
    const val = (c: CompanyRowView): number | string =>
      sort.key === "name" ? c.name.toLowerCase()
      : sort.key === "industry" ? c.industry.toLowerCase()
      : sort.key === "contacts" ? c.contacts
      : sort.key === "openValue" ? c.openValue
      : sort.key === "score" ? score(c)
      : sort.key === "health" ? health(c).rank
      : c.lastActivity ? new Date(c.lastActivity).getTime() : 0;
    return filtered.sort((a, b) => {
      const av = val(a), bv = val(b);
      return (av < bv ? -1 : av > bv ? 1 : 0) * sort.dir;
    });
  }, [all, q, status, sort]);

  function toggleSort(key: SortKey) {
    setSort((s) => (s.key === key ? { key, dir: (s.dir * -1) as 1 | -1 } : { key, dir: key === "name" || key === "industry" ? 1 : -1 }));
  }
  function setDens(d: "comfortable" | "compact") {
    setDensity(d);
    localStorage.setItem("crm-density", d);
  }
  function toggleRow(id: number) {
    setSelected((s) => {
      const n = new Set(s);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  }
  const allShownSelected = shown.length > 0 && shown.every((c) => selected.has(c.id));

  async function create() {
    if (!form.name.trim()) return;
    setBusy(true);
    const res = await createCompanyAction({
      name: form.name, industry: form.industry, city: form.city, website: form.website,
      employees: form.employees ? Number(form.employees) : null, annualValue: form.annualValue ? Number(form.annualValue) : 0,
      status: form.status, accountManager: form.accountManager, industryMatch: form.industryMatch,
    });
    setBusy(false);
    if (res.error) {
      toast(res.error, { tone: "error" });
      return;
    }
    toast(`${form.name.trim()} added`, { tone: "success" });
    setForm(empty);
    setShowCreate(false);
    void load();
  }

  async function bulkDelete() {
    const n = selected.size;
    if (typeof window !== "undefined" && !window.confirm(`Delete ${n} ${n === 1 ? "company" : "companies"} and all their records?`)) return;
    setBulkBusy(true);
    await bulkDeleteCompaniesAction([...selected]);
    setBulkBusy(false);
    toast(`${n} ${n === 1 ? "company" : "companies"} deleted`, { tone: "success" });
    void load();
  }
  async function bulkStatus(s: string) {
    if (!s) return;
    const n = selected.size;
    setBulkBusy(true);
    const r = await bulkSetStatusAction([...selected], s);
    setBulkBusy(false);
    if (r.error) toast(r.error, { tone: "error" });
    else toast(`${n} ${n === 1 ? "company" : "companies"} set to ${STATUS_LABEL[s] ?? s}`, { tone: "success" });
    void load();
  }
  function exportCsv() {
    const rows = selected.size ? shown.filter((c) => selected.has(c.id)) : shown;
    const cell = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const head = ["Name", "Industry", "City", "Status", "Contacts", "Open deals", "Open pipeline", "Lead score", "Last activity"];
    const csv = [head.map(cell).join(","), ...rows.map((c) => [c.name, c.industry, c.city, c.status, c.contacts, c.openDeals, c.openValue, score(c), c.lastActivity ?? ""].map(cell).join(","))].join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "companies.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  const pad = density === "compact" ? "py-1.5" : "py-2.5";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Companies</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">{shown.length} of {all.length} accounts</p>
        </div>
        <Button size="sm" onClick={() => setShowCreate((v) => !v)}>
          <Plus size={15} /> New company
        </Button>
      </div>

      {/* Saved views */}
      <div className="flex flex-wrap items-center gap-1 border-b border-border pb-2">
        {allViews.map((v) => {
          const isBuiltin = BUILTIN_VIEWS.some((b) => b.id === v.id);
          const active = activeId === v.id;
          const base = cn(
            "flex items-center rounded-lg text-xs font-medium transition-colors",
            active ? "bg-secondary text-foreground" : "text-muted-foreground hover:bg-secondary/60"
          );
          return isBuiltin ? (
            <button key={v.id} onClick={() => applyView(v)} className={cn(base, "px-2.5 py-1")}>
              {v.name}
            </button>
          ) : (
            <div key={v.id} className={cn(base, "group pl-2.5 pr-1")}>
              <button onClick={() => applyView(v)} className="py-1">{v.name}</button>
              <button
                onClick={() => deleteView(v.id)}
                title="Delete view"
                className="ml-1 rounded p-0.5 opacity-0 transition-opacity hover:text-danger group-hover:opacity-100"
              >
                <X size={11} />
              </button>
            </div>
          );
        })}

        <span className="mx-0.5 h-4 w-px bg-border" />

        {savingView ? (
          <div className="flex items-center gap-1">
            <Input
              autoFocus
              value={viewName}
              onChange={(e) => setViewName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") saveCurrentView();
                if (e.key === "Escape") { setSavingView(false); setViewName(""); }
              }}
              placeholder="View name…"
              className="h-7 w-36 text-xs"
            />
            <Button size="sm" onClick={saveCurrentView} disabled={!viewName.trim()}><Check size={13} /></Button>
            <Button size="sm" variant="ghost" onClick={() => { setSavingView(false); setViewName(""); }}><X size={13} /></Button>
          </div>
        ) : (
          <button
            onClick={() => setSavingView(true)}
            title="Save the current filter + sort as a view"
            className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-secondary/60 hover:text-foreground"
          >
            <Bookmark size={12} />
            Save view
            {activeId === null && <span className="ml-0.5 h-1.5 w-1.5 rounded-full bg-electric" title="Unsaved changes" />}
          </button>
        )}
      </div>

      {showCreate && (
        <Card className="space-y-3 p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold">New company</p>
            <button onClick={() => setShowCreate(false)} className="text-muted-foreground hover:text-foreground"><X size={16} /></button>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            <Input placeholder="Company name *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <Input placeholder="Industry" value={form.industry} onChange={(e) => setForm({ ...form, industry: e.target.value })} />
            <Input placeholder="City" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
            <Input placeholder="Website" value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} />
            <Input type="number" placeholder="Employees" value={form.employees} onChange={(e) => setForm({ ...form, employees: e.target.value })} />
            <Input type="number" placeholder="Annual value (€)" value={form.annualValue} onChange={(e) => setForm({ ...form, annualValue: e.target.value })} />
            <Input placeholder="Account manager" value={form.accountManager} onChange={(e) => setForm({ ...form, accountManager: e.target.value })} />
            <Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              {Object.entries(STATUS_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </Select>
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <input type="checkbox" checked={form.industryMatch} onChange={(e) => setForm({ ...form, industryMatch: e.target.checked })} className="h-4 w-4 accent-electric" /> Industry fit
            </label>
          </div>
          <div className="flex justify-end">
            <Button size="sm" onClick={create} disabled={busy || !form.name.trim()}>
              {busy ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />} Create
            </Button>
          </div>
        </Card>
      )}

      {/* Toolbar / bulk bar */}
      {selected.size > 0 ? (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-electric/40 bg-electric/[0.06] px-3 py-2">
          <span className="text-sm font-medium">{selected.size} selected</span>
          <div className="ml-auto flex flex-wrap items-center gap-2">
            <Select onChange={(e) => { bulkStatus(e.target.value); e.currentTarget.value = ""; }} defaultValue="" className="h-8 w-auto text-xs" disabled={bulkBusy}>
              <option value="" disabled>Set status…</option>
              {Object.entries(STATUS_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </Select>
            <Button size="sm" variant="outline" onClick={exportCsv}><Download size={13} /> Export</Button>
            <Button size="sm" variant="danger" onClick={bulkDelete} disabled={bulkBusy}>
              {bulkBusy ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />} Delete
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setSelected(new Set())}><X size={13} /> Clear</Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[180px] flex-1 sm:max-w-xs">
            <Search size={15} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search companies…" value={q} onChange={(e) => setQ(e.target.value)} className="h-9 pl-8" />
          </div>
          <div className="flex flex-wrap gap-1">
            {["", ...Object.keys(STATUS_LABEL)].map((s) => (
              <button key={s || "all"} onClick={() => setStatus(s)} className={cn("rounded-lg px-2.5 py-1 text-xs font-medium transition-colors", status === s ? "bg-secondary text-foreground" : "text-muted-foreground hover:bg-secondary/60")}>
                {s ? STATUS_LABEL[s] : "All"}
              </button>
            ))}
          </div>
          <div className="ml-auto flex items-center gap-0.5 rounded-lg border border-border p-0.5">
            <button onClick={() => setDens("comfortable")} className={cn("grid h-7 w-7 place-items-center rounded-md", density === "comfortable" ? "bg-secondary text-foreground" : "text-muted-foreground")} title="Comfortable"><Rows3 size={14} /></button>
            <button onClick={() => setDens("compact")} className={cn("grid h-7 w-7 place-items-center rounded-md", density === "compact" ? "bg-secondary text-foreground" : "text-muted-foreground")} title="Compact"><Rows2 size={14} /></button>
          </div>
        </div>
      )}

      {/* Table (desktop) */}
      <Card className="hidden overflow-hidden p-0 md:block">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-sm">
            <thead className="border-b border-border bg-card text-2xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="w-9 px-3 py-2">
                  <input type="checkbox" checked={allShownSelected} onChange={(e) => setSelected(e.target.checked ? new Set(shown.map((c) => c.id)) : new Set())} className="h-3.5 w-3.5 accent-electric" />
                </th>
                <Th label="Company" k="name" sort={sort} onSort={toggleSort} />
                <Th label="Industry" k="industry" sort={sort} onSort={toggleSort} />
                <Th label="Contacts" k="contacts" sort={sort} onSort={toggleSort} align="right" />
                <Th label="Pipeline" k="openValue" sort={sort} onSort={toggleSort} align="right" />
                <Th label="Score" k="score" sort={sort} onSort={toggleSort} align="right" />
                <Th label="Health" k="health" sort={sort} onSort={toggleSort} />
                <Th label="Last activity" k="lastActivity" sort={sort} onSort={toggleSort} align="right" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}>
                    <td className="px-3 py-3" colSpan={8}><Skeleton className="h-4 w-full" /></td>
                  </tr>
                ))
              ) : shown.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-3 py-12 text-center text-sm text-muted-foreground">
                    {all.length === 0 ? "No companies yet — add your first account." : "No matches."}
                  </td>
                </tr>
              ) : (
                shown.map((c) => {
                  const h = health(c);
                  const sc = score(c);
                  return (
                    <tr
                      key={c.id}
                      onClick={() => setPeek(c.id)}
                      className={cn("cursor-pointer transition-colors hover:bg-secondary/50", (selected.has(c.id) || peek === c.id) && "bg-electric/[0.05]")}
                    >
                      <td className={cn("px-3", pad)} onClick={(e) => e.stopPropagation()}>
                        <input type="checkbox" checked={selected.has(c.id)} onChange={() => toggleRow(c.id)} className="h-3.5 w-3.5 accent-electric" />
                      </td>
                      <td className={cn("px-3", pad)}>
                        <p className="font-medium">{c.name}</p>
                        {c.city && <p className="text-2xs text-muted-foreground">{c.city}</p>}
                      </td>
                      <td className={cn("px-3 text-muted-foreground", pad)}>{c.industry || "—"}</td>
                      <td className={cn("px-3 text-right tabular text-muted-foreground", pad)}>{c.contacts || "—"}</td>
                      <td className={cn("px-3 text-right", pad)}>
                        {c.openValue ? <span className="font-medium tabular">{eur(c.openValue)}</span> : <span className="text-muted-foreground">—</span>}
                        {c.openDeals > 0 && <span className="ml-1 text-2xs text-muted-foreground">· {c.openDeals}</span>}
                      </td>
                      <td className={cn("px-3 text-right", pad)}>
                        <span className={cn("inline-block min-w-[26px] rounded px-1.5 py-0.5 text-2xs font-semibold tabular", sc >= 75 ? "bg-emerald/10 text-emerald" : sc >= 50 ? "bg-warning/10 text-warning" : "bg-secondary text-muted-foreground")}>{sc}</span>
                      </td>
                      <td className={cn("px-3", pad)}>
                        <span className="inline-flex items-center gap-1.5 text-xs">
                          <span className={cn("h-2 w-2 rounded-full", h.tone === "emerald" ? "bg-emerald" : h.tone === "danger" ? "bg-danger" : h.tone === "warning" ? "bg-warning" : "bg-muted-foreground")} />
                          {h.label}
                        </span>
                      </td>
                      <td className={cn("px-3 text-right text-2xs text-muted-foreground", pad)}>{c.lastActivity ? timeAgo(c.lastActivity) : "—"}</td>
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
        ) : shown.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border py-12 text-center text-sm text-muted-foreground">
            {all.length === 0 ? "No companies yet — add your first account." : "No matches."}
          </p>
        ) : (
          shown.map((c) => {
            const h = health(c);
            const sc = score(c);
            return (
              <button
                key={c.id}
                onClick={() => setPeek(c.id)}
                className={cn(
                  "w-full rounded-xl border border-border bg-card p-3 text-left transition-colors active:bg-secondary/50",
                  peek === c.id && "border-electric/50"
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{c.name}</p>
                    <p className="truncate text-2xs text-muted-foreground">{[c.industry, c.city].filter(Boolean).join(" · ") || "—"}</p>
                  </div>
                  <Badge tone={STATUS_TONE[c.status] ?? "neutral"}>{STATUS_LABEL[c.status] ?? c.status}</Badge>
                </div>
                <div className="mt-2.5 flex items-center gap-3 text-xs text-muted-foreground">
                  <span>
                    {c.openValue ? <span className="font-medium tabular text-foreground">{eur(c.openValue)}</span> : "—"}
                    <span className="ml-1 text-2xs">pipeline</span>
                  </span>
                  <span className={cn("rounded px-1.5 py-0.5 text-2xs font-semibold tabular", sc >= 75 ? "bg-emerald/10 text-emerald" : sc >= 50 ? "bg-warning/10 text-warning" : "bg-secondary text-muted-foreground")}>{sc}</span>
                  <span className="ml-auto inline-flex items-center gap-1.5">
                    <span className={cn("h-2 w-2 rounded-full", h.tone === "emerald" ? "bg-emerald" : h.tone === "danger" ? "bg-danger" : h.tone === "warning" ? "bg-warning" : "bg-muted-foreground")} />
                    {h.label}
                  </span>
                </div>
              </button>
            );
          })
        )}
      </div>

      {/* Mobile FAB — primary create action */}
      <button
        onClick={() => { setShowCreate(true); window.scrollTo({ top: 0, behavior: "smooth" }); }}
        className="fixed right-4 z-20 grid h-14 w-14 place-items-center rounded-full bg-electric text-white shadow-glow transition-transform active:scale-95 md:hidden"
        style={{ bottom: "calc(env(safe-area-inset-bottom) + 4.75rem)" }}
        aria-label="New company"
      >
        <Plus size={24} />
      </button>

      <CompanyDrawer id={peek} onClose={() => setPeek(null)} onChanged={load} />
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
