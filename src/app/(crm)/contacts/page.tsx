"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search, Loader2, Trash2, X, ArrowUp, ArrowDown, ChevronsUpDown, ChevronLeft, ChevronRight, Mail, Phone, Building2, UserPlus } from "lucide-react";
import {
  contactsPageAction,
  addContactAction,
  deleteContactAction,
  searchCompaniesAction,
  type ContactListItem,
  type SearchHit,
} from "@/lib/actions/crm";
import type { ContactSortKey } from "@/lib/crm/contact-query";
import { Card } from "@/components/ui/card";
import { Badge, type Tone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

const INFLUENCE: Record<string, { label: string; tone: Tone }> = {
  decision_maker: { label: "Decision maker", tone: "royal" },
  technical: { label: "Technical", tone: "electric" },
  influencer: { label: "Influencer", tone: "electric" },
  finance: { label: "Finance", tone: "warning" },
  none: { label: "Contact", tone: "neutral" },
};
const infl = (k: string) => INFLUENCE[k] ?? INFLUENCE.none;

const emptyForm = { name: "", role: "", email: "", phone: "", influence: "none", companyId: 0, companyName: "" };

export default function ContactsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [rows, setRows] = useState<ContactListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [pageCount, setPageCount] = useState(1);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [influence, setInfluence] = useState("");
  const [sort, setSort] = useState<{ key: ContactSortKey; dir: 1 | -1 }>({ key: "name", dir: 1 });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [reloadKey, setReloadKey] = useState(0);

  const [showAdd, setShowAdd] = useState(false);
  useEffect(() => {
    if (typeof window !== "undefined" && new URLSearchParams(window.location.search).get("new") === "1") setShowAdd(true);
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
    contactsPageAction({ q: debouncedQ, influence, sortKey: sort.key, sortDir: sort.dir, page, pageSize })
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
  }, [debouncedQ, influence, sort, page, pageSize, reloadKey]);

  const refetch = () => setReloadKey((k) => k + 1);

  // Company typeahead for the add form.
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

  function toggleSort(key: ContactSortKey) {
    setSort((s) => (s.key === key ? { key, dir: (s.dir * -1) as 1 | -1 } : { key, dir: 1 }));
    setPage(1);
  }

  async function add() {
    if (!form.name.trim() || !form.companyId) return;
    setBusy(true);
    const r = await addContactAction(form.companyId, {
      name: form.name, role: form.role, email: form.email, phone: form.phone, influence: form.influence,
    });
    setBusy(false);
    if (r.error) {
      toast(r.error, { tone: "error" });
      return;
    }
    toast(`${form.name.trim()} added to ${form.companyName}`, { tone: "success" });
    setForm(emptyForm);
    setCompanyQuery("");
    setShowAdd(false);
    refetch();
  }

  async function remove(c: ContactListItem) {
    if (typeof window !== "undefined" && !window.confirm(`Remove ${c.name} from ${c.companyName}?`)) return;
    await deleteContactAction(c.id, c.companyId);
    toast(`${c.name} removed`, { tone: "success" });
    refetch();
  }

  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);
  const hasFilters = !!(debouncedQ || influence);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Contacts</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">{total} contact{total === 1 ? "" : "s"} across your accounts</p>
        </div>
        <Button size="sm" onClick={() => setShowAdd((v) => !v)}>
          <UserPlus size={15} /> Add contact
        </Button>
      </div>

      {showAdd && (
        <Card className="space-y-3 p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold">New contact</p>
            <button onClick={() => setShowAdd(false)} className="text-muted-foreground hover:text-foreground"><X size={16} /></button>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            <Input placeholder="Name *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <Input placeholder="Role" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} />
            <Select value={form.influence} onChange={(e) => setForm({ ...form, influence: e.target.value })}>
              {Object.entries(INFLUENCE).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </Select>
            <Input placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            <Input placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            {/* Company picker */}
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
                        <button
                          key={c.id}
                          onClick={() => { setForm({ ...form, companyId: c.id, companyName: c.name }); setCompanyResults([]); }}
                          className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-secondary"
                        >
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
          </div>
          <div className="flex justify-end">
            <Button size="sm" onClick={add} disabled={busy || !form.name.trim() || !form.companyId}>
              {busy ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />} Create
            </Button>
          </div>
        </Card>
      )}

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[180px] flex-1 sm:max-w-xs">
          <Search size={15} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search contacts…" value={q} onChange={(e) => setQ(e.target.value)} className="h-9 pl-8" />
        </div>
        <div className="flex flex-wrap gap-1">
          {["", ...Object.keys(INFLUENCE)].map((k) => (
            <button
              key={k || "all"}
              onClick={() => { setInfluence(k); setPage(1); }}
              className={cn("rounded-lg px-2.5 py-1 text-xs font-medium transition-colors", influence === k ? "bg-secondary text-foreground" : "text-muted-foreground hover:bg-secondary/60")}
            >
              {k ? infl(k).label : "All"}
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
                <Th label="Name" k="name" sort={sort} onSort={toggleSort} />
                <Th label="Company" k="company" sort={sort} onSort={toggleSort} />
                <th className="px-3 py-2 text-left font-medium">Contact</th>
                <Th label="Influence" k="influence" sort={sort} onSort={toggleSort} />
                <th className="w-10 px-3 py-2" />
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
                    {hasFilters ? "No matches." : "No contacts yet — add them from a company or here."}
                  </td>
                </tr>
              ) : (
                rows.map((c) => (
                  <tr key={c.id} className="cursor-pointer transition-colors hover:bg-secondary/50" onClick={() => router.push(`/contacts/${c.id}`)}>
                    <td className="px-3 py-2.5">
                      <p className="font-medium">{c.name}</p>
                      {c.role && <p className="text-2xs text-muted-foreground">{c.role}</p>}
                    </td>
                    <td className="px-3 py-2.5 text-muted-foreground">{c.companyName}</td>
                    <td className="px-3 py-2.5" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-1.5">
                        {c.email ? (
                          <a href={`mailto:${c.email}`} className="inline-flex items-center gap-1 text-xs text-electric hover:underline"><Mail size={12} /> {c.email}</a>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                        {c.phone && <a href={`tel:${c.phone}`} className="grid h-6 w-6 place-items-center rounded text-muted-foreground hover:bg-secondary hover:text-foreground" title={c.phone}><Phone size={12} /></a>}
                      </div>
                    </td>
                    <td className="px-3 py-2.5"><Badge tone={infl(c.influence).tone}>{infl(c.influence).label}</Badge></td>
                    <td className="px-3 py-2.5" onClick={(e) => e.stopPropagation()}>
                      <button onClick={() => remove(c)} className="text-muted-foreground hover:text-danger" title="Remove contact"><Trash2 size={14} /></button>
                    </td>
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
            {hasFilters ? "No matches." : "No contacts yet."}
          </p>
        ) : (
          rows.map((c) => (
            <div key={c.id} className="rounded-xl border border-border bg-card p-3">
              <div className="flex items-start justify-between gap-2">
                <button onClick={() => router.push(`/contacts/${c.id}`)} className="min-w-0 text-left">
                  <p className="truncate font-medium">{c.name}</p>
                  <p className="truncate text-2xs text-muted-foreground">{[c.role, c.companyName].filter(Boolean).join(" · ")}</p>
                </button>
                <Badge tone={infl(c.influence).tone}>{infl(c.influence).label}</Badge>
              </div>
              <div className="mt-2 flex items-center gap-3 text-xs">
                {c.email && <a href={`mailto:${c.email}`} className="inline-flex items-center gap-1 text-electric"><Mail size={12} /> Email</a>}
                {c.phone && <a href={`tel:${c.phone}`} className="inline-flex items-center gap-1 text-muted-foreground"><Phone size={12} /> Call</a>}
                <button onClick={() => remove(c)} className="ml-auto text-muted-foreground hover:text-danger"><Trash2 size={13} /></button>
              </div>
            </div>
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

function Th({ label, k, sort, onSort }: { label: string; k: ContactSortKey; sort: { key: ContactSortKey; dir: 1 | -1 }; onSort: (k: ContactSortKey) => void }) {
  const active = sort.key === k;
  return (
    <th className="px-3 py-2 text-left font-medium">
      <button onClick={() => onSort(k)} className={cn("inline-flex items-center gap-1 hover:text-foreground", active && "text-foreground")}>
        {label}
        {active ? sort.dir === 1 ? <ArrowUp size={11} /> : <ArrowDown size={11} /> : <ChevronsUpDown size={11} className="opacity-40" />}
      </button>
    </th>
  );
}
