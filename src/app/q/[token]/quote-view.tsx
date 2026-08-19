"use client";

import { useState } from "react";
import { Loader2, CheckCircle2, XCircle, Printer, FileText } from "lucide-react";
import { eur } from "@/lib/format";
import { cn } from "@/lib/utils";

interface QuoteData {
  token: string;
  number: string;
  companyName: string;
  status: string;
  validUntil: string | null;
  notes: string;
  total: number;
  decidedAt: string | null;
  clientName: string;
  items: { name: string; unitPrice: number; quantity: number; lineTotal: number }[];
}

export function QuoteView({ data }: { data: QuoteData }) {
  const [status, setStatus] = useState(data.status);
  const [clientName, setClientName] = useState(data.clientName);
  const [busy, setBusy] = useState<"" | "accepted" | "declined">("");
  const [error, setError] = useState("");

  const decided = status === "accepted" || status === "declined";
  const fmtDate = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" }) : "");

  async function decide(decision: "accepted" | "declined") {
    setError("");
    setBusy(decision);
    try {
      const res = await fetch(`/api/quotes/${encodeURIComponent(data.token)}/decision`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ decision, clientName }),
      });
      const j = (await res.json().catch(() => ({}))) as { ok?: boolean; status?: string; error?: string };
      if (!res.ok || !j.ok) {
        setError(j.error || "Something went wrong. Please try again.");
        setBusy("");
        return;
      }
      setStatus(j.status || decision);
    } catch {
      setError("Network error. Please try again.");
    }
    setBusy("");
  }

  return (
    <div className="mx-auto w-full max-w-2xl">
      {/* Print styling: hide the action bar, flatten the card. */}
      <style>{`@media print { .no-print { display: none !important; } .print-card { border: 0 !important; box-shadow: none !important; } }`}</style>

      <div className="print-card overflow-hidden rounded-2xl border border-border bg-card shadow-card">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-border p-6">
          <div>
            <p className="flex items-center gap-1.5 text-sm font-semibold text-electric"><FileText size={15} /> Sajtpress</p>
            <h1 className="mt-2 text-lg font-semibold tracking-tight">Quote {data.number}</h1>
            <p className="text-sm text-muted-foreground">Prepared for {data.companyName}</p>
          </div>
          <div className="text-right text-2xs text-muted-foreground">
            {data.validUntil && <p>Valid until<br /><span className="text-sm font-medium text-foreground">{fmtDate(data.validUntil)}</span></p>}
          </div>
        </div>

        {/* Line items */}
        <div className="overflow-x-auto p-6">
          <table className="w-full text-sm">
            <thead className="border-b border-border text-2xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="pb-2 text-left font-medium">Item</th>
                <th className="pb-2 text-right font-medium">Unit</th>
                <th className="pb-2 text-right font-medium">Qty</th>
                <th className="pb-2 text-right font-medium">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data.items.length === 0 ? (
                <tr><td colSpan={4} className="py-6 text-center text-muted-foreground">No line items.</td></tr>
              ) : (
                data.items.map((it, i) => (
                  <tr key={i}>
                    <td className="py-2.5 pr-2">{it.name}</td>
                    <td className="py-2.5 text-right tabular text-muted-foreground">{eur(it.unitPrice)}</td>
                    <td className="py-2.5 text-right tabular text-muted-foreground">{it.quantity}</td>
                    <td className="py-2.5 text-right tabular font-medium">{eur(it.lineTotal)}</td>
                  </tr>
                ))
              )}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-border">
                <td colSpan={3} className="pt-3 text-right text-sm font-semibold">Total</td>
                <td className="pt-3 text-right text-base font-bold tabular">{eur(data.total)}</td>
              </tr>
            </tfoot>
          </table>

          {data.notes && (
            <div className="mt-6 rounded-lg bg-secondary/50 p-3 text-2xs text-muted-foreground">
              <p className="mb-1 font-medium text-foreground">Notes</p>
              <p className="whitespace-pre-wrap">{data.notes}</p>
            </div>
          )}
        </div>

        {/* Decision area */}
        <div className="border-t border-border p-6">
          {decided ? (
            <div className={cn("flex items-center gap-3 rounded-lg p-3 text-sm", status === "accepted" ? "bg-emerald/10 text-emerald" : "bg-danger/10 text-danger")}>
              {status === "accepted" ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
              <span className="font-medium">
                {status === "accepted" ? "You accepted this quote." : "You declined this quote."}
                {data.decidedAt && <span className="font-normal opacity-80"> · {fmtDate(data.decidedAt)}</span>}
              </span>
            </div>
          ) : (
            <div className="no-print space-y-3">
              <input
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="Your name (optional)"
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-electric sm:max-w-xs"
              />
              {error && <p className="text-xs text-danger">{error}</p>}
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => decide("accepted")}
                  disabled={!!busy}
                  className="inline-flex items-center gap-2 rounded-lg bg-emerald px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
                >
                  {busy === "accepted" ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle2 size={15} />} Accept quote
                </button>
                <button
                  onClick={() => decide("declined")}
                  disabled={!!busy}
                  className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground disabled:opacity-60"
                >
                  {busy === "declined" ? <Loader2 size={15} className="animate-spin" /> : <XCircle size={15} />} Decline
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Toolbar */}
      <div className="no-print mt-4 flex justify-center">
        <button onClick={() => window.print()} className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm text-muted-foreground shadow-card transition-colors hover:text-foreground">
          <Printer size={15} /> Download PDF
        </button>
      </div>
    </div>
  );
}
