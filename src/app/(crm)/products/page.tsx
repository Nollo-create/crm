"use client";

import { useEffect, useState } from "react";
import { Plus, Search, Loader2, Trash2, X, ArrowUp, ArrowDown, ChevronsUpDown, ChevronLeft, ChevronRight, Pencil, Copy } from "lucide-react";
import {
  productsPageAction,
  createProductAction,
  updateProductAction,
  setProductActiveAction,
  deleteProductAction,
  duplicateProductAction,
  type Product,
} from "@/lib/actions/products";
import { BILLINGS, BILLING_LABEL, BILLING_SUFFIX, type Billing, type ProductSortKey } from "@/lib/crm/products";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { useCanWrite } from "@/components/crm/role-context";
import { cn } from "@/lib/utils";

const emptyForm = { name: "", sku: "", price: "", billing: "onetime", description: "", active: true };
const money = (euros: number) => "€" + euros.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const ACTIVE_FILTERS = [
  { id: "active", label: "Active", active: true as boolean | undefined },
  { id: "all", label: "All", active: undefined as boolean | undefined },
  { id: "archived", label: "Archived", active: false as boolean | undefined },
];

export default function ProductsPage() {
  const { toast } = useToast();
  const canWrite = useCanWrite();
  const [rows, setRows] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [pageCount, setPageCount] = useState(1);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [activeFilter, setActiveFilter] = useState("active");
  const [billing, setBilling] = useState("");
  const [sort, setSort] = useState<{ key: ProductSortKey; dir: 1 | -1 }>({ key: "name", dir: 1 });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [reloadKey, setReloadKey] = useState(0);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
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
    const active = ACTIVE_FILTERS.find((f) => f.id === activeFilter)?.active;
    productsPageAction({ q: debouncedQ, active, billing, sortKey: sort.key, sortDir: sort.dir, page, pageSize })
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
  }, [debouncedQ, activeFilter, billing, sort, page, pageSize, reloadKey]);

  const refetch = () => setReloadKey((k) => k + 1);

  function toggleSort(key: ProductSortKey) {
    setSort((s) => (s.key === key ? { key, dir: (s.dir * -1) as 1 | -1 } : { key, dir: 1 }));
    setPage(1);
  }

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(true);
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  }
  function openEdit(p: Product) {
    setEditingId(p.id);
    setForm({ name: p.name, sku: p.sku, price: String(p.price), billing: p.billing, description: p.description, active: p.active });
    setShowForm(true);
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function save() {
    if (!form.name.trim()) return;
    setBusy(true);
    const dto = { name: form.name, sku: form.sku, price: form.price ? Number(form.price) : 0, billing: form.billing, description: form.description, active: form.active };
    const r = editingId ? await updateProductAction(editingId, dto) : await createProductAction(dto);
    setBusy(false);
    if (r.error) {
      toast(r.error, { tone: "error" });
      return;
    }
    toast(editingId ? "Product updated" : `${form.name.trim()} added`, { tone: "success" });
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(false);
    refetch();
  }

  async function toggleActive(p: Product) {
    setRows((prev) => prev.map((r) => (r.id === p.id ? { ...r, active: !r.active } : r))); // optimistic
    const res = await setProductActiveAction(p.id, !p.active);
    if (res.error) {
      toast(res.error, { tone: "error" });
      refetch();
    } else if (activeFilter !== "all") {
      setTimeout(refetch, 400);
    }
  }

  async function remove(p: Product) {
    const warn = p.quoteUses > 0 ? ` It's used on ${p.quoteUses} quote${p.quoteUses === 1 ? "" : "s"} (those lines keep their saved price).` : "";
    if (typeof window !== "undefined" && !window.confirm(`Delete product "${p.name}"?${warn}`)) return;
    await deleteProductAction(p.id);
    toast("Product deleted", { tone: "success" });
    refetch();
  }

  async function duplicate(p: Product) {
    const r = await duplicateProductAction(p.id);
    if (r.error) {
      toast(r.error, { tone: "error" });
      return;
    }
    toast(`Duplicated “${p.name}”`, { tone: "success" });
    refetch();
  }

  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);
  const hasFilters = !!(debouncedQ || billing || activeFilter !== "active");

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Products</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">{total} product{total === 1 ? "" : "s"} in your catalog</p>
        </div>
        {canWrite && <Button size="sm" onClick={openCreate}><Plus size={15} /> Add product</Button>}
      </div>

      {canWrite && showForm && (
        <Card className="space-y-3 p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold">{editingId ? "Edit product" : "New product"}</p>
            <button onClick={() => { setShowForm(false); setEditingId(null); }} className="text-muted-foreground hover:text-foreground"><X size={16} /></button>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            <Input placeholder="Product name *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="sm:col-span-2" />
            <Input placeholder="SKU / code" value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} />
            <Input type="number" step="0.01" placeholder="Price (€)" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
            <Select value={form.billing} onChange={(e) => setForm({ ...form, billing: e.target.value })}>
              {BILLINGS.map((b) => <option key={b} value={b}>{BILLING_LABEL[b]}</option>)}
            </Select>
            <Input placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="sm:col-span-2" />
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} className="h-4 w-4 accent-electric" /> Active
            </label>
          </div>
          <div className="flex justify-end">
            <Button size="sm" onClick={save} disabled={busy || !form.name.trim()}>
              {busy ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />} {editingId ? "Save" : "Create"}
            </Button>
          </div>
        </Card>
      )}

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[180px] flex-1 sm:max-w-xs">
          <Search size={15} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search products…" value={q} onChange={(e) => setQ(e.target.value)} className="h-9 pl-8" />
        </div>
        <div className="flex gap-1">
          {ACTIVE_FILTERS.map((f) => (
            <button key={f.id} onClick={() => { setActiveFilter(f.id); setPage(1); }} className={cn("rounded-lg px-2.5 py-1 text-xs font-medium transition-colors", activeFilter === f.id ? "bg-secondary text-foreground" : "text-muted-foreground hover:bg-secondary/60")}>
              {f.label}
            </button>
          ))}
        </div>
        <Select value={billing} onChange={(e) => { setBilling(e.target.value); setPage(1); }} className="ml-auto h-9 w-auto text-xs">
          <option value="">Any billing</option>
          {BILLINGS.map((b) => <option key={b} value={b}>{BILLING_LABEL[b]}</option>)}
        </Select>
      </div>

      {/* Table (desktop) */}
      <Card className="hidden overflow-hidden p-0 md:block">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="border-b border-border bg-card text-2xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <Th label="Product" k="name" sort={sort} onSort={toggleSort} />
                <Th label="SKU" k="sku" sort={sort} onSort={toggleSort} />
                <Th label="Price" k="price" sort={sort} onSort={toggleSort} align="right" />
                <th className="px-3 py-2 text-left font-medium">Used</th>
                <th className="px-3 py-2 text-left font-medium">Status</th>
                <th className="w-28 px-3 py-2" />
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
                    {hasFilters ? "No matches." : "No products yet — add your first product."}
                  </td>
                </tr>
              ) : (
                rows.map((p) => (
                  <tr key={p.id} onClick={() => openEdit(p)} className={cn("cursor-pointer transition-colors hover:bg-secondary/50", !p.active && "opacity-60")}>
                    <td className="px-3 py-2.5">
                      <p className="font-medium">{p.name}</p>
                      {p.description && <p className="truncate text-2xs text-muted-foreground">{p.description}</p>}
                    </td>
                    <td className="px-3 py-2.5 text-muted-foreground">{p.sku || "—"}</td>
                    <td className="px-3 py-2.5 text-right">
                      <span className="font-medium tabular">{money(p.price)}</span>
                      <span className="text-2xs text-muted-foreground">{BILLING_SUFFIX[p.billing as Billing] ?? ""}</span>
                    </td>
                    <td className="px-3 py-2.5 text-muted-foreground tabular">{p.quoteUses > 0 ? `${p.quoteUses} quote${p.quoteUses === 1 ? "" : "s"}` : "—"}</td>
                    <td className="px-3 py-2.5"><Badge tone={p.active ? "emerald" : "neutral"}>{p.active ? "Active" : "Archived"}</Badge></td>
                    <td className="px-3 py-2.5" onClick={(e) => e.stopPropagation()}>
                      {canWrite && (
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => openEdit(p)} className="grid h-7 w-7 place-items-center rounded text-muted-foreground hover:text-foreground" title="Edit"><Pencil size={13} /></button>
                          <button onClick={() => duplicate(p)} className="grid h-7 w-7 place-items-center rounded text-muted-foreground hover:text-foreground" title="Duplicate"><Copy size={13} /></button>
                          <button onClick={() => toggleActive(p)} className="rounded px-1.5 text-2xs text-muted-foreground hover:text-foreground" title={p.active ? "Archive" : "Activate"}>{p.active ? "Archive" : "Activate"}</button>
                          <button onClick={() => remove(p)} className="grid h-7 w-7 place-items-center rounded text-muted-foreground hover:text-danger" title="Delete"><Trash2 size={13} /></button>
                        </div>
                      )}
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
            {hasFilters ? "No matches." : "No products yet."}
          </p>
        ) : (
          rows.map((p) => (
            <div key={p.id} className={cn("rounded-xl border border-border bg-card p-3", !p.active && "opacity-60")}>
              <div className="flex items-start justify-between gap-2">
                <button onClick={() => openEdit(p)} className="min-w-0 text-left">
                  <p className="truncate font-medium">{p.name}</p>
                  <p className="truncate text-2xs text-muted-foreground">{p.sku || p.description || "—"}</p>
                </button>
                <span className="shrink-0 text-sm font-semibold tabular">{money(p.price)}<span className="text-2xs font-normal text-muted-foreground">{BILLING_SUFFIX[p.billing as Billing] ?? ""}</span></span>
              </div>
              <div className="mt-2 flex items-center gap-2">
                <Badge tone={p.active ? "emerald" : "neutral"}>{p.active ? "Active" : "Archived"}</Badge>
                {p.quoteUses > 0 && <span className="text-2xs text-muted-foreground">· {p.quoteUses} quote{p.quoteUses === 1 ? "" : "s"}</span>}
                {canWrite && (
                  <>
                    <button onClick={() => toggleActive(p)} className="text-2xs text-muted-foreground hover:text-foreground">{p.active ? "Archive" : "Activate"}</button>
                    <button onClick={() => duplicate(p)} className="ml-auto grid h-7 w-7 place-items-center rounded text-muted-foreground hover:text-foreground" title="Duplicate"><Copy size={13} /></button>
                    <button onClick={() => remove(p)} className="grid h-7 w-7 place-items-center rounded text-muted-foreground hover:text-danger"><Trash2 size={13} /></button>
                  </>
                )}
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

function Th({ label, k, sort, onSort, align }: { label: string; k: ProductSortKey; sort: { key: ProductSortKey; dir: 1 | -1 }; onSort: (k: ProductSortKey) => void; align?: "right" }) {
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
