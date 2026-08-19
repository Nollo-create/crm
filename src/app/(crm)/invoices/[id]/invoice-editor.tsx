"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Trash2, Plus, Minus, Loader2, Building2, Package, Printer, CheckCircle2, RotateCcw, FileText, Share2, Check, ExternalLink, Copy, Mail, X } from "lucide-react";
import {
  getInvoiceAction,
  updateInvoiceAction,
  setInvoiceStatusAction,
  markInvoicePaidAction,
  markInvoiceUnpaidAction,
  deleteInvoiceAction,
  addInvoiceItemAction,
  setInvoiceItemQuantityAction,
  deleteInvoiceItemAction,
  shareInvoiceAction,
  emailInvoiceAction,
  type InvoiceDetail,
  type InvoiceItem,
} from "@/lib/actions/invoices";
import { searchProductsAction, type ProductHit } from "@/lib/actions/quotes";
import { getCompanyAction } from "@/lib/actions/crm";
import { INVOICE_STATUS_LABEL } from "@/lib/crm/invoices";
import { Card } from "@/components/ui/card";
import { Badge, type Tone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { useCanWrite } from "@/components/crm/role-context";
import { cn } from "@/lib/utils";

const STATUS_TONE: Record<string, Tone> = { draft: "neutral", sent: "electric", paid: "emerald", void: "neutral" };
const EDITABLE_STATUSES = ["draft", "sent", "void"];
const money = (euros: number) => "€" + euros.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtDate = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }) : "");

export function InvoiceEditor({ id }: { id: number }) {
  const router = useRouter();
  const { toast } = useToast();
  const canWrite = useCanWrite();
  const [d, setD] = useState<InvoiceDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [notes, setNotes] = useState("");
  const [issueDate, setIssueDate] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [payBusy, setPayBusy] = useState(false);

  const [addForm, setAddForm] = useState<{ name: string; unitPrice: string; quantity: string }>({ name: "", unitPrice: "", quantity: "1" });
  const [productQuery, setProductQuery] = useState("");
  const [productResults, setProductResults] = useState<ProductHit[]>([]);
  const [adding, setAdding] = useState(false);
  const [shareBusy, setShareBusy] = useState(false);
  const [clientLink, setClientLink] = useState("");
  const [copied, setCopied] = useState(false);
  const [emailOpen, setEmailOpen] = useState(false);
  const [emailTo, setEmailTo] = useState("");
  const [emailContactId, setEmailContactId] = useState<number | null>(null);
  const [emailContacts, setEmailContacts] = useState<{ id: number; name: string; email: string }[]>([]);
  const [emailBusy, setEmailBusy] = useState(false);

  async function load() {
    const res = await getInvoiceAction(id).catch(() => null);
    if (!res) setNotFound(true);
    else {
      setD(res);
      setNotes(res.invoice.notes);
      setIssueDate(res.invoice.issueDate ?? "");
      setDueDate(res.invoice.dueDate ?? "");
      setClientLink(res.invoice.publicToken ? `${res.baseUrl}/i/${res.invoice.publicToken}` : "");
    }
    setLoading(false);
  }
  useEffect(() => { void load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [id]);

  useEffect(() => {
    const s = productQuery.trim();
    if (!s) { setProductResults([]); return; }
    const t = setTimeout(async () => setProductResults(await searchProductsAction(s).catch(() => [])), 200);
    return () => clearTimeout(t);
  }, [productQuery]);

  if (loading) {
    return <div className="space-y-4"><Skeleton className="h-6 w-40" /><Skeleton className="h-24 w-full" /><Skeleton className="h-48 w-full" /></div>;
  }
  if (notFound || !d) {
    return <p className="py-16 text-center text-sm text-muted-foreground">Invoice not found. <Link href="/invoices" className="text-electric">Back</Link></p>;
  }

  const items = d.items;
  const total = items.reduce((s, i) => s + i.lineTotal, 0);
  const editable = d.invoice.status === "draft" && canWrite;
  const inv = d.invoice;

  async function changeStatus(status: string) {
    setD((prev) => (prev ? { ...prev, invoice: { ...prev.invoice, status, overdue: false } } : prev));
    const r = await setInvoiceStatusAction(id, status);
    if (r.error) { toast(r.error, { tone: "error" }); void load(); }
  }
  async function markPaid() {
    setPayBusy(true);
    const r = await markInvoicePaidAction(id);
    setPayBusy(false);
    if (r.error) return toast(r.error, { tone: "error" });
    toast("Marked paid", { tone: "success" });
    void load();
  }
  async function markUnpaid() {
    setPayBusy(true);
    const r = await markInvoiceUnpaidAction(id);
    setPayBusy(false);
    if (r.error) return toast(r.error, { tone: "error" });
    void load();
  }
  function commitHeader() {
    void updateInvoiceAction(id, { notes, issueDate: issueDate || null, dueDate: dueDate || null });
  }
  async function removeInvoice() {
    if (typeof window !== "undefined" && !window.confirm(`Delete ${inv.number}?`)) return;
    await deleteInvoiceAction(id);
    router.push("/invoices");
  }

  async function addItem() {
    const name = addForm.name.trim();
    if (!name) return;
    setAdding(true);
    const r = await addInvoiceItemAction(id, { name, unitPrice: Number(addForm.unitPrice) || 0, quantity: Number(addForm.quantity) || 1 });
    setAdding(false);
    if (r.error) return toast(r.error, { tone: "error" });
    setAddForm({ name: "", unitPrice: "", quantity: "1" });
    setProductQuery("");
    void load();
  }
  async function setQty(item: InvoiceItem, qty: number) {
    const q = Math.max(1, qty);
    setD((prev) => (prev ? { ...prev, items: prev.items.map((i) => (i.id === item.id ? { ...i, quantity: q, lineTotal: i.unitPrice * q } : i)) } : prev));
    const r = await setInvoiceItemQuantityAction(id, item.id, q);
    if (r.error) { toast(r.error, { tone: "error" }); void load(); }
  }
  async function removeItem(item: InvoiceItem) {
    setD((prev) => (prev ? { ...prev, items: prev.items.filter((i) => i.id !== item.id) } : prev));
    await deleteInvoiceItemAction(id, item.id);
  }

  async function share() {
    setShareBusy(true);
    const r = await shareInvoiceAction(id);
    setShareBusy(false);
    if (r.error) return toast(r.error, { tone: "error" });
    if (r.url) setClientLink(r.url);
    void load();
    toast("Client link ready", { tone: "success" });
  }
  async function copyLink() {
    try {
      await navigator.clipboard.writeText(clientLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast("Couldn't copy — select the link manually.", { tone: "error" });
    }
  }
  async function openEmail() {
    setEmailOpen(true);
    const detail = await getCompanyAction(inv.companyId).catch(() => null);
    const withEmail = (detail?.contacts ?? []).filter((c) => c.email).map((c) => ({ id: c.id, name: c.name, email: c.email }));
    setEmailContacts(withEmail);
    if (withEmail[0] && !emailTo) { setEmailTo(withEmail[0].email); setEmailContactId(withEmail[0].id); }
  }
  async function sendEmail() {
    if (!emailTo.trim()) return;
    setEmailBusy(true);
    const r = await emailInvoiceAction(id, emailTo.trim(), emailContactId);
    setEmailBusy(false);
    if (r.error) return toast(r.error, { tone: "error" });
    toast("Invoice emailed to the client", { tone: "success" });
    setEmailOpen(false);
    void load();
  }

  const badge = inv.overdue ? { label: "Overdue", tone: "danger" as Tone } : { label: INVOICE_STATUS_LABEL[inv.status as keyof typeof INVOICE_STATUS_LABEL] ?? inv.status, tone: STATUS_TONE[inv.status] ?? "neutral" };

  return (
    <div className="space-y-4">
      <Link href="/invoices" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground print:hidden"><ArrowLeft size={15} /> Invoices</Link>

      {/* Header */}
      <Card className="p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-semibold tracking-tight tabular">{inv.number}</h1>
              <Badge tone={badge.tone}>{badge.label}</Badge>
            </div>
            <Link href={`/companies/${inv.companyId}`} className="mt-1 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-electric"><Building2 size={13} /> {inv.companyName}</Link>
            {inv.quoteId ? <Link href={`/quotes/${inv.quoteId}`} className="ml-2 inline-flex items-center gap-1 text-2xs text-muted-foreground hover:text-electric"><FileText size={11} /> from quote</Link> : null}
          </div>
          <div className="flex flex-wrap items-center gap-1.5 print:hidden">
            {canWrite && inv.status !== "paid" && (
              <Button size="sm" onClick={markPaid} disabled={payBusy}>{payBusy ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle2 size={13} />} Mark paid</Button>
            )}
            {canWrite && inv.status === "paid" && (
              <Button size="sm" variant="outline" onClick={markUnpaid} disabled={payBusy}>{payBusy ? <Loader2 size={13} className="animate-spin" /> : <RotateCcw size={13} />} Mark unpaid</Button>
            )}
            {canWrite && inv.status !== "paid" && (
              <Select value={inv.status} onChange={(e) => changeStatus(e.target.value)} className="h-8 w-auto text-xs">
                {EDITABLE_STATUSES.map((s) => <option key={s} value={s}>{INVOICE_STATUS_LABEL[s as keyof typeof INVOICE_STATUS_LABEL]}</option>)}
              </Select>
            )}
            <Button size="sm" variant="outline" onClick={() => typeof window !== "undefined" && window.print()}><Printer size={13} /> Print</Button>
            {canWrite && <Button size="icon" variant="ghost" className="text-muted-foreground hover:text-danger" title="Delete invoice" onClick={removeInvoice}><Trash2 size={15} /></Button>}
          </div>
        </div>

        {inv.status === "paid" && (
          <div className="mt-3 flex items-center gap-2 rounded-lg bg-emerald/10 p-2.5 text-2xs text-emerald">
            <CheckCircle2 size={14} /> Paid {inv.paidAt ? `on ${fmtDate(inv.paidAt)}` : ""} · {money(inv.paidAmount)}{inv.paymentMethod ? ` · ${inv.paymentMethod}` : ""}
          </div>
        )}

        <div className="mt-4 grid gap-2 sm:grid-cols-3">
          <label className="text-2xs text-muted-foreground">Issue date<Input type="date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} onBlur={commitHeader} disabled={!canWrite} className="mt-1 h-9" /></label>
          <label className="text-2xs text-muted-foreground">Due date<Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} onBlur={commitHeader} disabled={!canWrite} className="mt-1 h-9" /></label>
          <label className="text-2xs text-muted-foreground">Notes<Input value={notes} onChange={(e) => setNotes(e.target.value)} onBlur={commitHeader} placeholder="Optional" disabled={!canWrite} className="mt-1 h-9" /></label>
        </div>
      </Card>

      {/* Share with client */}
      <Card className="space-y-2 p-4 print:hidden sm:p-5">
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-sm font-medium">Client link</p>
            <p className="text-2xs text-muted-foreground">A public page where the client views the invoice and saves a PDF.</p>
          </div>
          {canWrite && (
            <div className="flex shrink-0 items-center gap-1.5">
              <Button size="sm" variant="outline" onClick={openEmail} disabled={emailOpen}><Mail size={13} /> Email</Button>
              <Button size="sm" variant={clientLink ? "outline" : "default"} onClick={share} disabled={shareBusy}>
                {shareBusy ? <Loader2 size={13} className="animate-spin" /> : <Share2 size={13} />} {clientLink ? "Regenerate" : "Share"}
              </Button>
            </div>
          )}
        </div>
        {clientLink && (
          <div className="flex items-center gap-2 rounded-lg border border-border bg-secondary/40 px-2.5 py-1.5">
            <a href={clientLink} target="_blank" rel="noopener noreferrer" className="min-w-0 flex-1 truncate text-xs text-electric hover:underline">{clientLink}</a>
            <a href={clientLink} target="_blank" rel="noopener noreferrer" className="shrink-0 text-muted-foreground hover:text-foreground" title="Open"><ExternalLink size={13} /></a>
            <button onClick={copyLink} className="shrink-0 text-muted-foreground hover:text-foreground" title="Copy link">{copied ? <Check size={13} className="text-emerald" /> : <Copy size={13} />}</button>
          </div>
        )}
        {emailOpen && (
          <div className="space-y-2 rounded-lg border border-border bg-secondary/30 p-3">
            <div className="flex items-center justify-between">
              <p className="text-2xs font-medium">Email this invoice to the client</p>
              <button onClick={() => setEmailOpen(false)} className="text-muted-foreground hover:text-foreground"><X size={14} /></button>
            </div>
            {emailContacts.length > 0 && (
              <Select
                value={emailContactId ? String(emailContactId) : "custom"}
                onChange={(e) => {
                  const v = e.target.value;
                  if (v === "custom") { setEmailContactId(null); }
                  else { const c = emailContacts.find((x) => String(x.id) === v); if (c) { setEmailContactId(c.id); setEmailTo(c.email); } }
                }}
                className="h-8 text-xs"
              >
                {emailContacts.map((c) => <option key={c.id} value={c.id}>{c.name} · {c.email}</option>)}
                <option value="custom">Custom address…</option>
              </Select>
            )}
            <Input type="email" value={emailTo} onChange={(e) => { setEmailTo(e.target.value); setEmailContactId(null); }} placeholder="client@example.com" className="h-8 text-xs" />
            <div className="flex items-center justify-between gap-2">
              <p className="text-2xs text-muted-foreground">Sends from your Settings → Email mailbox, with a tracked link.</p>
              <Button size="sm" onClick={sendEmail} disabled={emailBusy || !emailTo.trim()}>{emailBusy ? <Loader2 size={13} className="animate-spin" /> : <Mail size={13} />} Send</Button>
            </div>
          </div>
        )}
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
                    <td className="px-3 py-2.5">{it.name}</td>
                    <td className="px-3 py-2.5 text-right tabular text-muted-foreground">{money(it.unitPrice)}</td>
                    <td className="px-3 py-2.5">
                      {editable ? (
                        <div className="mx-auto flex w-fit items-center gap-1">
                          <button onClick={() => setQty(it, it.quantity - 1)} className="grid h-6 w-6 place-items-center rounded border border-border text-muted-foreground hover:text-foreground" aria-label="Decrease"><Minus size={12} /></button>
                          <span className="w-7 text-center tabular">{it.quantity}</span>
                          <button onClick={() => setQty(it, it.quantity + 1)} className="grid h-6 w-6 place-items-center rounded border border-border text-muted-foreground hover:text-foreground" aria-label="Increase"><Plus size={12} /></button>
                        </div>
                      ) : <p className="text-center tabular">{it.quantity}</p>}
                    </td>
                    <td className="px-3 py-2.5 text-right font-medium tabular">{money(it.lineTotal)}</td>
                    <td className="px-3 py-2.5">{editable && <button onClick={() => removeItem(it)} className="text-muted-foreground hover:text-danger" title="Remove"><Trash2 size={13} /></button>}</td>
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
                <Input placeholder="Product or custom line…" value={addForm.name} onChange={(e) => { setAddForm({ ...addForm, name: e.target.value }); setProductQuery(e.target.value); }} className="h-9" />
                {productResults.length > 0 && (
                  <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-lg border border-border bg-popover shadow-pop">
                    {productResults.map((p) => (
                      <button key={p.id} onClick={() => { setAddForm({ ...addForm, name: p.name, unitPrice: String(p.price) }); setProductResults([]); setProductQuery(""); }} className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm hover:bg-secondary">
                        <span className="inline-flex items-center gap-1.5 truncate"><Package size={13} className="shrink-0 text-muted-foreground" />{p.name}</span>
                        <span className="shrink-0 text-2xs text-muted-foreground">{money(p.price)}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <Input type="number" step="0.01" placeholder="Unit €" value={addForm.unitPrice} onChange={(e) => setAddForm({ ...addForm, unitPrice: e.target.value })} className="h-9 w-24" />
              <Input type="number" placeholder="Qty" value={addForm.quantity} onChange={(e) => setAddForm({ ...addForm, quantity: e.target.value })} className="h-9 w-20" />
              <Button size="sm" onClick={addItem} disabled={adding || !addForm.name.trim()}>{adding ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />} Add</Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
