"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Trash2, Plus, Minus, Loader2, Building2, Package, X, Copy, Printer } from "lucide-react";
import {
  getQuoteAction,
  duplicateQuoteAction,
  updateQuoteStatusAction,
  updateQuoteAction,
  deleteQuoteAction,
  addQuoteItemAction,
  setQuoteItemQuantityAction,
  deleteQuoteItemAction,
  searchProductsAction,
  type QuoteDetail,
  type QuoteItem,
  type ProductHit,
} from "@/lib/actions/quotes";
import { QUOTE_STATUSES, QUOTE_STATUS_LABEL } from "@/lib/crm/quotes";
import { Card } from "@/components/ui/card";
import { Badge, type Tone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

const STATUS_TONE: Record<string, Tone> = { draft: "neutral", sent: "electric", accepted: "emerald", declined: "danger" };
const money = (euros: number) => "€" + euros.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function QuoteEditor({ id }: { id: number }) {
  const router = useRouter();
  const { toast } = useToast();
  const [d, setD] = useState<QuoteDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [notes, setNotes] = useState("");
  const [validUntil, setValidUntil] = useState("");

  const [dupBusy, setDupBusy] = useState(false);
  const [addForm, setAddForm] = useState<{ productId: number | null; name: string; unitPrice: string; quantity: string }>({ productId: null, name: "", unitPrice: "", quantity: "1" });
  const [productQuery, setProductQuery] = useState("");
  const [productResults, setProductResults] = useState<ProductHit[]>([]);
  const [adding, setAdding] = useState(false);

  async function load() {
    const res = await getQuoteAction(id).catch(() => null);
    if (!res) setNotFound(true);
    else {
      setD(res);
      setNotes(res.quote.notes);
      setValidUntil(res.quote.validUntil ?? "");
    }
    setLoading(false);
  }
  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    const s = productQuery.trim();
    if (!s) {
      setProductResults([]);
      return;
    }
    const t = setTimeout(async () => setProductResults(await searchProductsAction(s).catch(() => [])), 200);
    return () => clearTimeout(t);
  }, [productQuery]);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }
  if (notFound || !d) {
    return (
      <p className="py-16 text-center text-sm text-muted-foreground">
        Quote not found. <Link href="/quotes" className="text-electric">Back</Link>
      </p>
    );
  }

  const items = d.items;
  const total = items.reduce((s, i) => s + i.lineTotal, 0);
  const editable = d.quote.status === "draft";

  async function changeStatus(status: string) {
    setD((prev) => (prev ? { ...prev, quote: { ...prev.quote, status } } : prev));
    const r = await updateQuoteStatusAction(id, status);
    if (r.error) {
      toast(r.error, { tone: "error" });
      void load();
    }
  }
  async function duplicate() {
    setDupBusy(true);
    const r = await duplicateQuoteAction(id);
    setDupBusy(false);
    if (r.error) return toast(r.error, { tone: "error" });
    toast("Quote duplicated — opening the copy", { tone: "success" });
    if (r.id) router.push(`/quotes/${r.id}`);
  }
  function commitHeader() {
    void updateQuoteAction(id, { notes, validUntil: validUntil || null });
  }
  async function removeQuote() {
    if (typeof window !== "undefined" && !window.confirm(`Delete ${d!.quote.number}?`)) return;
    await deleteQuoteAction(id);
    router.push("/quotes");
  }

  async function addItem() {
    const name = addForm.name.trim();
    if (!name) return;
    setAdding(true);
    const r = await addQuoteItemAction(id, { productId: addForm.productId, name, unitPrice: Number(addForm.unitPrice) || 0, quantity: Number(addForm.quantity) || 1 });
    setAdding(false);
    if (r.error) {
      toast(r.error, { tone: "error" });
      return;
    }
    setAddForm({ productId: null, name: "", unitPrice: "", quantity: "1" });
    setProductQuery("");
    void load();
  }
  async function setQty(item: QuoteItem, qty: number) {
    const q = Math.max(1, qty);
    setD((prev) => (prev ? { ...prev, items: prev.items.map((i) => (i.id === item.id ? { ...i, quantity: q, lineTotal: i.unitPrice * q } : i)) } : prev)); // optimistic
    const r = await setQuoteItemQuantityAction(id, item.id, q);
    if (r.error) {
      toast(r.error, { tone: "error" });
      void load();
    }
  }
  async function removeItem(item: QuoteItem) {
    setD((prev) => (prev ? { ...prev, items: prev.items.filter((i) => i.id !== item.id) } : prev)); // optimistic
    await deleteQuoteItemAction(id, item.id);
  }

  const qNum = d.quote.number;

  return (
    <div className="space-y-4">
      <Link href="/quotes" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground print:hidden">
        <ArrowLeft size={15} /> Quotes
      </Link>

      {/* Header */}
      <Card className="p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-semibold tracking-tight tabular">{qNum}</h1>
              <Badge tone={STATUS_TONE[d.quote.status] ?? "neutral"}>{QUOTE_STATUS_LABEL[d.quote.status as keyof typeof QUOTE_STATUS_LABEL] ?? d.quote.status}</Badge>
            </div>
            <Link href={`/companies/${d.quote.companyId}`} className="mt-1 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-electric">
              <Building2 size={13} /> {d.quote.companyName}
            </Link>
          </div>
          <div className="flex flex-wrap items-center gap-1.5 print:hidden">
            <Select value={d.quote.status} onChange={(e) => changeStatus(e.target.value)} className="h-8 w-auto text-xs">
              {QUOTE_STATUSES.map((s) => <option key={s} value={s}>{QUOTE_STATUS_LABEL[s]}</option>)}
            </Select>
            <Button size="sm" variant="outline" onClick={duplicate} disabled={dupBusy} title="Duplicate as a new draft">
              {dupBusy ? <Loader2 size={13} className="animate-spin" /> : <Copy size={13} />} Duplicate
            </Button>
            <Button size="sm" variant="outline" onClick={() => typeof window !== "undefined" && window.print()} title="Print / save as PDF">
              <Printer size={13} /> Print
            </Button>
            <Button size="icon" variant="ghost" className="text-muted-foreground hover:text-danger" title="Delete quote" onClick={removeQuote}>
              <Trash2 size={15} />
            </Button>
          </div>
        </div>
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          <label className="text-2xs text-muted-foreground">
            Valid until
            <Input type="date" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} onBlur={commitHeader} className="mt-1 h-9" />
          </label>
          <label className="text-2xs text-muted-foreground">
            Notes
            <Input value={notes} onChange={(e) => setNotes(e.target.value)} onBlur={commitHeader} placeholder="Optional" className="mt-1 h-9" />
          </label>
        </div>
      </Card>

      {/* Line items */}
      <Card className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[620px] text-sm">
            <thead className="border-b border-border text-2xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-3 py-2 text-left font-medium">Item</th>
                <th className="px-3 py-2 text-right font-medium">Unit price</th>
                <th className="px-3 py-2 text-center font-medium">Qty</th>
                <th className="px-3 py-2 text-right font-medium">Line total</th>
                <th className="w-8 px-3 py-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {items.length === 0 ? (
                <tr><td colSpan={5} className="px-3 py-8 text-center text-sm text-muted-foreground">No line items yet.</td></tr>
              ) : (
                items.map((it) => (
                  <tr key={it.id}>
                    <td className="px-3 py-2.5">
                      <span className="inline-flex items-center gap-1.5">
                        {it.productId && <Package size={12} className="text-muted-foreground" />}
                        {it.name}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-right tabular text-muted-foreground">{money(it.unitPrice)}</td>
                    <td className="px-3 py-2.5">
                      {editable ? (
                        <div className="mx-auto flex w-fit items-center gap-1">
                          <button onClick={() => setQty(it, it.quantity - 1)} className="grid h-6 w-6 place-items-center rounded border border-border text-muted-foreground hover:text-foreground" aria-label="Decrease"><Minus size={12} /></button>
                          <span className="w-7 text-center tabular">{it.quantity}</span>
                          <button onClick={() => setQty(it, it.quantity + 1)} className="grid h-6 w-6 place-items-center rounded border border-border text-muted-foreground hover:text-foreground" aria-label="Increase"><Plus size={12} /></button>
                        </div>
                      ) : (
                        <p className="text-center tabular">{it.quantity}</p>
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-right font-medium tabular">{money(it.lineTotal)}</td>
                    <td className="px-3 py-2.5">
                      {editable && <button onClick={() => removeItem(it)} className="text-muted-foreground hover:text-danger" title="Remove"><Trash2 size={13} /></button>}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            <tfoot className="border-t border-border">
              <tr>
                <td colSpan={3} className="px-3 py-3 text-right text-sm font-semibold">Total</td>
                <td className="px-3 py-3 text-right text-base font-semibold tabular">{money(total)}</td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>

        {editable && (
          <div className="border-t border-border p-3">
            <div className="grid gap-2 sm:grid-cols-[1fr_auto_auto_auto]">
              <div className="relative">
                <Input placeholder="Product or custom line…" value={addForm.name} onChange={(e) => { setAddForm({ ...addForm, name: e.target.value, productId: null }); setProductQuery(e.target.value); }} className="h-9" />
                {productResults.length > 0 && (
                  <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-lg border border-border bg-popover shadow-pop">
                    {productResults.map((p) => (
                      <button key={p.id} onClick={() => { setAddForm({ ...addForm, productId: p.id, name: p.name, unitPrice: String(p.price) }); setProductResults([]); setProductQuery(""); }} className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm hover:bg-secondary">
                        <span className="inline-flex items-center gap-1.5 truncate"><Package size={13} className="shrink-0 text-muted-foreground" />{p.name}</span>
                        <span className="shrink-0 text-2xs text-muted-foreground">{money(p.price)}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <Input type="number" step="0.01" placeholder="Unit €" value={addForm.unitPrice} onChange={(e) => setAddForm({ ...addForm, unitPrice: e.target.value })} className="h-9 w-24" />
              <Input type="number" placeholder="Qty" value={addForm.quantity} onChange={(e) => setAddForm({ ...addForm, quantity: e.target.value })} className="h-9 w-20" />
              <Button size="sm" onClick={addItem} disabled={adding || !addForm.name.trim()}>
                {adding ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />} Add
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
