"use client";

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toCsv } from "@/lib/crm/csv";

/** Export button: `collect` returns the full grid (header row first); the button
 *  serializes it with the shared injection-safe toCsv and downloads a .csv. */
export function ExportButton({ filename, collect, disabled }: { filename: string; collect: () => Promise<unknown[][]>; disabled?: boolean }) {
  const [busy, setBusy] = useState(false);
  async function run() {
    setBusy(true);
    try {
      const rows = await collect();
      if (rows.length <= 1) return; // header only = nothing to export
      const url = URL.createObjectURL(new Blob([toCsv(rows)], { type: "text/csv;charset=utf-8" }));
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Button size="sm" variant="outline" onClick={run} disabled={busy || disabled} title="Export the current filter to CSV">
      {busy ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />} Export
    </Button>
  );
}
