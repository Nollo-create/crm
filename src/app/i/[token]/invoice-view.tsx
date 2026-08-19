"use client";

import { Printer, Receipt, CheckCircle2, Clock, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

const money = (euros: number) => "€" + euros.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtDate = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" }) : "");

interface InvoiceData {
  number: string;
  companyName: string;
  status: string;
  issueDate: string | null;
  dueDate: string | null;
  overdue: boolean;
  notes: string;
  total: number;
  paidAt: string | null;
  paidAmount: number;
  paymentMethod: string;
  seller: { name: string; address: string; taxId: string; email: string };
  items: { name: string; unitPrice: number; quantity: number; lineTotal: number }[];
}

export function InvoiceView({ data }: { data: InvoiceData }) {
  const paid = data.status === "paid";
  return (
    <div className="mx-auto w-full max-w-2xl">
      <style>{`@media print { .no-print { display: none !important; } .print-card { border: 0 !important; box-shadow: none !important; } }`}</style>

      <div className="print-card overflow-hidden rounded-2xl border border-border bg-card shadow-card">
        {/* Letterhead */}
        <div className="border-b border-border p-6">
          <div className="flex items-start justify-between gap-4">
            <p className="flex items-center gap-1.5 text-sm font-semibold text-electric"><Receipt size={15} /> {data.seller.name}</p>
            <div className="text-right">
              <h1 className="text-lg font-semibold tracking-tight">Invoice {data.number}</h1>
              {data.issueDate && <p className="text-2xs text-muted-foreground">Issued {fmtDate(data.issueDate)}</p>}
              {data.dueDate && <p className={cn("text-2xs", data.overdue ? "font-medium text-danger" : "text-muted-foreground")}>{data.overdue ? "Was due" : "Due"} {fmtDate(data.dueDate)}</p>}
            </div>
          </div>
          <div className="mt-5 grid grid-cols-2 gap-4">
            <div className="text-2xs text-muted-foreground">
              <p className="font-semibold uppercase tracking-wide">From</p>
              <p className="mt-0.5 text-sm font-medium text-foreground">{data.seller.name}</p>
              {data.seller.address && <p className="whitespace-pre-line">{data.seller.address}</p>}
              {data.seller.taxId && <p>Tax ID: {data.seller.taxId}</p>}
              {data.seller.email && <p>{data.seller.email}</p>}
            </div>
            <div className="text-2xs text-muted-foreground">
              <p className="font-semibold uppercase tracking-wide">Bill to</p>
              <p className="mt-0.5 text-sm font-medium text-foreground">{data.companyName}</p>
            </div>
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
                    <td className="py-2.5 text-right tabular text-muted-foreground">{money(it.unitPrice)}</td>
                    <td className="py-2.5 text-right tabular text-muted-foreground">{it.quantity}</td>
                    <td className="py-2.5 text-right tabular font-medium">{money(it.lineTotal)}</td>
                  </tr>
                ))
              )}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-border">
                <td colSpan={3} className="pt-3 text-right text-sm font-semibold">{paid ? "Total paid" : "Amount due"}</td>
                <td className="pt-3 text-right text-base font-bold tabular">{money(data.total)}</td>
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

        {/* Status */}
        <div className="border-t border-border p-6">
          {paid ? (
            <div className="flex items-center gap-3 rounded-lg bg-emerald/10 p-3 text-sm text-emerald">
              <CheckCircle2 size={18} />
              <span className="font-medium">Paid{data.paidAt ? ` on ${fmtDate(data.paidAt)}` : ""} · {money(data.paidAmount)}{data.paymentMethod ? ` · ${data.paymentMethod}` : ""}</span>
            </div>
          ) : data.overdue ? (
            <div className="flex items-center gap-3 rounded-lg bg-danger/10 p-3 text-sm text-danger">
              <AlertTriangle size={18} />
              <span className="font-medium">Overdue{data.dueDate ? ` — was due ${fmtDate(data.dueDate)}` : ""}.</span>
            </div>
          ) : (
            <div className="flex items-center gap-3 rounded-lg bg-secondary/60 p-3 text-sm text-muted-foreground">
              <Clock size={18} />
              <span className="font-medium">{data.dueDate ? `Payment due by ${fmtDate(data.dueDate)}.` : "Payment pending."}</span>
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
