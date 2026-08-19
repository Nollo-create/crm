"use client";

import { useEffect, useMemo, useState } from "react";
import { Upload, X, Loader2, FileText } from "lucide-react";
import { parseCsv, mapHeaders, type ImportField } from "@/lib/crm/csv";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";

/** Generic paste/upload → auto-map → preview → import panel. The parent supplies
 *  the fields, alias map, and an entity-specific import action. */
export function CsvImport({
  title,
  entity,
  fields,
  aliases,
  sample,
  note,
  onImport,
  onDone,
  onClose,
}: {
  title: string;
  entity: string;
  fields: ImportField[];
  aliases: Record<string, string[]>;
  sample: string;
  note: string;
  onImport: (rows: Record<string, string>[]) => Promise<{ created: number; skipped: number; error?: string }>;
  onDone: () => void;
  onClose: () => void;
}) {
  const { toast } = useToast();
  const [raw, setRaw] = useState("");
  const [mapping, setMapping] = useState<Record<string, number | undefined>>({});
  const [busy, setBusy] = useState(false);

  const grid = useMemo(() => parseCsv(raw), [raw]);
  const headers = grid[0] ?? [];
  const dataRows = grid.slice(1);
  const hasData = headers.length > 0 && dataRows.length > 0;
  const required = useMemo(() => fields.filter((f) => f.required).map((f) => f.key), [fields]);

  useEffect(() => {
    setMapping(mapHeaders(headers, aliases));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [raw]);

  const canImport = required.every((k) => mapping[k] != null);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setRaw(String(reader.result ?? ""));
    reader.readAsText(file);
  }

  function mappedRows(): Record<string, string>[] {
    return dataRows
      .map((cells) => {
        const o: Record<string, string> = {};
        for (const f of fields) o[f.key] = mapping[f.key] != null ? (cells[mapping[f.key] as number] ?? "").trim() : "";
        return o;
      })
      .filter((r) => required.every((k) => r[k]));
  }

  async function doImport() {
    const rows = mappedRows();
    if (!rows.length) {
      toast("Nothing to import — map the required columns.", { tone: "error" });
      return;
    }
    setBusy(true);
    const res = await onImport(rows).catch(() => null);
    setBusy(false);
    if (!res || res.error) {
      toast(res?.error || "Import failed. Please try again.", { tone: "error" });
      return;
    }
    toast(`Imported ${res.created} ${entity}${res.created === 1 ? "" : "s"}${res.skipped ? `, ${res.skipped} skipped` : ""}`, { tone: "success" });
    onDone();
  }

  const preview = hasData ? mappedRows().slice(0, 3) : [];
  const previewCols = fields.slice(0, 5);

  return (
    <Card className="space-y-3 p-4">
      <div className="flex items-center justify-between">
        <p className="flex items-center gap-2 text-sm font-semibold"><Upload size={15} className="text-electric" /> {title}</p>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X size={16} /></button>
      </div>

      <textarea
        value={raw}
        onChange={(e) => setRaw(e.target.value)}
        placeholder={`Paste CSV here (with a header row), e.g.\n${sample}`}
        className="min-h-[96px] w-full rounded-lg border border-input bg-background px-3 py-2 font-mono text-xs outline-none focus:border-electric"
      />
      <div className="flex flex-wrap items-center gap-2">
        <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-secondary">
          <FileText size={13} /> Upload .csv
          <input type="file" accept=".csv,text/csv" onChange={handleFile} className="hidden" />
        </label>
        {hasData && <span className="text-2xs text-muted-foreground">{dataRows.length} row{dataRows.length === 1 ? "" : "s"} · {headers.length} columns detected</span>}
        <button onClick={() => setRaw(sample)} className="ml-auto text-2xs text-electric hover:underline">Use sample</button>
      </div>

      {hasData && (
        <>
          <div className="grid gap-2 border-t border-border pt-3 sm:grid-cols-2 lg:grid-cols-3">
            {fields.map((f) => (
              <label key={f.key} className="block text-2xs uppercase tracking-wide text-muted-foreground">
                {f.label}{f.required && " *"}
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
          {!canImport && <p className="text-2xs text-danger">Map the required column{required.length === 1 ? "" : "s"}: {fields.filter((f) => f.required).map((f) => f.label).join(", ")}.</p>}

          {preview.length > 0 && (
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full min-w-[520px] text-2xs">
                <thead className="bg-secondary/50 text-muted-foreground">
                  <tr>{previewCols.map((f) => <th key={f.key} className="px-2 py-1.5 text-left font-medium">{f.label}</th>)}</tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {preview.map((r, i) => (
                    <tr key={i}>{previewCols.map((f) => <td key={f.key} className="px-2 py-1.5 text-muted-foreground">{r[f.key] || "—"}</td>)}</tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="flex items-center justify-between gap-2">
            <p className="text-2xs text-muted-foreground">{note}</p>
            <Button size="sm" onClick={doImport} disabled={busy || !canImport}>
              {busy ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />} Import {mappedRows().length} {entity}{mappedRows().length === 1 ? "" : "s"}
            </Button>
          </div>
        </>
      )}
    </Card>
  );
}
