"use client";

import { useEffect, useMemo, useState } from "react";
import { Upload, X, Loader2, FileText } from "lucide-react";
import { parseCsv, autoMapHeaders, LEAD_IMPORT_FIELDS, type LeadImportField } from "@/lib/crm/csv";
import { importLeadsAction } from "@/lib/actions/leads";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";

const SAMPLE = "name,company,email,phone,title\nJane Doe,Acme Ltd,jane@acme.com,+38160123,CTO";

export function LeadImport({ onDone, onClose }: { onDone: () => void; onClose: () => void }) {
  const { toast } = useToast();
  const [raw, setRaw] = useState("");
  const [mapping, setMapping] = useState<Partial<Record<LeadImportField, number>>>({});
  const [busy, setBusy] = useState(false);

  const grid = useMemo(() => parseCsv(raw), [raw]);
  const headers = grid[0] ?? [];
  const dataRows = grid.slice(1);
  const hasData = headers.length > 0 && dataRows.length > 0;

  // Auto-map columns whenever the CSV changes (manual tweaks persist until then).
  useEffect(() => {
    setMapping(autoMapHeaders(headers));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [raw]);

  const canImport = mapping.name != null || mapping.company != null;

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setRaw(String(reader.result ?? ""));
    reader.readAsText(file);
  }

  function mappedRows() {
    return dataRows
      .map((cells) => {
        const get = (f: LeadImportField) => (mapping[f] != null ? (cells[mapping[f] as number] ?? "").trim() : "");
        return { name: get("name"), company: get("company"), email: get("email"), phone: get("phone"), title: get("title"), website: get("website"), industry: get("industry") };
      })
      .filter((r) => r.name || r.company);
  }

  async function doImport() {
    const rows = mappedRows();
    if (!rows.length) {
      toast("Nothing to import — map a name or company column.", { tone: "error" });
      return;
    }
    setBusy(true);
    const res = await importLeadsAction(rows).catch(() => null);
    setBusy(false);
    if (!res) {
      toast("Import failed. Please try again.", { tone: "error" });
      return;
    }
    toast(`Imported ${res.created} lead${res.created === 1 ? "" : "s"}${res.skipped ? `, ${res.skipped} skipped` : ""}`, { tone: "success" });
    onDone();
  }

  const preview = hasData ? mappedRows().slice(0, 3) : [];

  return (
    <Card className="space-y-3 p-4">
      <div className="flex items-center justify-between">
        <p className="flex items-center gap-2 text-sm font-semibold"><Upload size={15} className="text-electric" /> Import leads from CSV</p>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X size={16} /></button>
      </div>

      <textarea
        value={raw}
        onChange={(e) => setRaw(e.target.value)}
        placeholder={`Paste CSV here (with a header row), e.g.\n${SAMPLE}`}
        className="min-h-[96px] w-full rounded-lg border border-input bg-background px-3 py-2 font-mono text-xs outline-none focus:border-electric"
      />
      <div className="flex flex-wrap items-center gap-2">
        <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-secondary">
          <FileText size={13} /> Upload .csv
          <input type="file" accept=".csv,text/csv" onChange={handleFile} className="hidden" />
        </label>
        {hasData && <span className="text-2xs text-muted-foreground">{dataRows.length} row{dataRows.length === 1 ? "" : "s"} · {headers.length} columns detected</span>}
        <button onClick={() => setRaw(SAMPLE)} className="ml-auto text-2xs text-electric hover:underline">Use sample</button>
      </div>

      {hasData && (
        <>
          {/* Column mapping */}
          <div className="grid gap-2 border-t border-border pt-3 sm:grid-cols-2 lg:grid-cols-3">
            {LEAD_IMPORT_FIELDS.map((f) => (
              <label key={f.key} className="block text-2xs uppercase tracking-wide text-muted-foreground">
                {f.label}{(f.key === "name" || f.key === "company") && " *"}
                <Select
                  value={mapping[f.key] != null ? String(mapping[f.key]) : ""}
                  onChange={(e) => setMapping((m) => ({ ...m, [f.key]: e.target.value === "" ? undefined : Number(e.target.value) }))}
                  className="mt-1 h-9"
                >
                  <option value="">— Ignore —</option>
                  {headers.map((h, i) => <option key={i} value={i}>{h || `Column ${i + 1}`}</option>)}
                </Select>
              </label>
            ))}
          </div>
          {!canImport && <p className="text-2xs text-danger">Map at least a Contact name or a Company column.</p>}

          {/* Preview */}
          {preview.length > 0 && (
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full min-w-[520px] text-2xs">
                <thead className="bg-secondary/50 text-muted-foreground">
                  <tr>{["Name", "Company", "Email", "Phone", "Title"].map((h) => <th key={h} className="px-2 py-1.5 text-left font-medium">{h}</th>)}</tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {preview.map((r, i) => (
                    <tr key={i}>
                      <td className="px-2 py-1.5">{r.name || "—"}</td>
                      <td className="px-2 py-1.5">{r.company || "—"}</td>
                      <td className="px-2 py-1.5 text-muted-foreground">{r.email || "—"}</td>
                      <td className="px-2 py-1.5 text-muted-foreground">{r.phone || "—"}</td>
                      <td className="px-2 py-1.5 text-muted-foreground">{r.title || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="flex items-center justify-between">
            <p className="text-2xs text-muted-foreground">Imported leads get source “Imported”. Up to 500 per import.</p>
            <Button size="sm" onClick={doImport} disabled={busy || !canImport}>
              {busy ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />} Import {mappedRows().length} leads
            </Button>
          </div>
        </>
      )}
    </Card>
  );
}
