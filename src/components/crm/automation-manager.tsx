"use client";

import { useEffect, useState } from "react";
import { Plus, Loader2, Trash2, X, Zap, Play, Eye, Clock, CheckCircle2 } from "lucide-react";
import {
  listAutomationsAction,
  createAutomationAction,
  toggleAutomationAction,
  deleteAutomationAction,
  runAutomationsNowAction,
  runOneAutomationNowAction,
  previewAutomationAction,
  automationStatusAction,
  type Automation,
} from "@/lib/actions/automation";
import { AUTOMATION_TEMPLATES, type AutomationCategory } from "@/lib/crm/automation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { timeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";

export function AutomationManager({ title, subtitle, category }: { title: string; subtitle: string; category?: AutomationCategory }) {
  const { toast } = useToast();
  const templates = category ? AUTOMATION_TEMPLATES.filter((t) => t.category === category) : AUTOMATION_TEMPLATES;
  const [rows, setRows] = useState<Automation[]>([]);
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);
  const [showAdd, setShowAdd] = useState(false);
  const [templateKey, setTemplateKey] = useState(templates[0]?.key ?? "");
  const [params, setParams] = useState<Record<string, string | number>>({});
  const [busy, setBusy] = useState(false);
  const [running, setRunning] = useState(false);
  const [runningId, setRunningId] = useState<number | null>(null);
  const [cronConfigured, setCronConfigured] = useState<boolean | null>(null);
  const [preview, setPreview] = useState<number | null>(null);
  const [previewing, setPreviewing] = useState(false);

  const template = AUTOMATION_TEMPLATES.find((t) => t.key === templateKey) ?? templates[0];

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    listAutomationsAction(category)
      .then((r) => !cancelled && setRows(r))
      .catch(() => !cancelled && setRows([]))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [category, reloadKey]);

  useEffect(() => {
    // reset params to the selected template's defaults
    if (!template) return;
    setParams(Object.fromEntries(template.params.map((p) => [p.key, p.default])));
    setPreview(null);
  }, [templateKey]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    automationStatusAction().then((s) => setCronConfigured(s.cronConfigured)).catch(() => setCronConfigured(null));
  }, []);

  const refetch = () => setReloadKey((k) => k + 1);

  function setParam(key: string, value: string) {
    setParams((prev) => ({ ...prev, [key]: value }));
    setPreview(null); // params changed — stale preview no longer valid
  }

  async function doPreview() {
    if (!template) return;
    setPreviewing(true);
    const r = await previewAutomationAction(template.key, params).catch(() => ({ count: 0 }));
    setPreviewing(false);
    setPreview(r.count);
  }

  async function runOne(a: Automation) {
    setRunningId(a.id);
    const r = await runOneAutomationNowAction(a.id).catch(() => ({ created: 0 }));
    setRunningId(null);
    toast(r.created > 0 ? `${r.created} task${r.created === 1 ? "" : "s"} created` : "Nothing to do right now", { tone: "success" });
    refetch();
  }

  async function create() {
    if (!template) return;
    setBusy(true);
    const r = await createAutomationAction({ templateKey: template.key, params });
    setBusy(false);
    if (r.error) {
      toast(r.error, { tone: "error" });
      return;
    }
    toast("Automation added", { tone: "success" });
    setShowAdd(false);
    refetch();
  }
  async function toggle(a: Automation) {
    setRows((prev) => prev.map((x) => (x.id === a.id ? { ...x, enabled: !x.enabled } : x)));
    const r = await toggleAutomationAction(a.id, !a.enabled);
    if (r.error) {
      toast(r.error, { tone: "error" });
      refetch();
    }
  }
  async function remove(a: Automation) {
    if (typeof window !== "undefined" && !window.confirm(`Delete automation "${a.name}"?`)) return;
    await deleteAutomationAction(a.id);
    toast("Automation deleted", { tone: "success" });
    refetch();
  }
  async function runNow() {
    setRunning(true);
    const r = await runAutomationsNowAction();
    setRunning(false);
    toast(r.created > 0 ? `${r.created} task${r.created === 1 ? "" : "s"} created` : "Nothing to do right now", { tone: "success" });
    refetch();
  }

  function summary(a: Automation): string {
    return Object.entries(a.params).map(([k, v]) => `${k}: ${v}`).join(" · ");
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">{subtitle}</p>
          {cronConfigured !== null && (
            <span className={cn("mt-1.5 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-2xs font-medium", cronConfigured ? "bg-emerald/10 text-emerald" : "bg-warning/10 text-warning")}>
              {cronConfigured ? <CheckCircle2 size={11} /> : <Clock size={11} />}
              {cronConfigured ? "Scheduled — runs automatically" : "Manual only — schedule not configured"}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <Button size="sm" variant="outline" onClick={runNow} disabled={running}>
            {running ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />} Run now
          </Button>
          <Button size="sm" onClick={() => setShowAdd((v) => !v)}><Plus size={15} /> Add automation</Button>
        </div>
      </div>

      {showAdd && template && (
        <Card className="space-y-3 p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold">New automation</p>
            <button onClick={() => setShowAdd(false)} className="text-muted-foreground hover:text-foreground"><X size={16} /></button>
          </div>
          <Select value={templateKey} onChange={(e) => setTemplateKey(e.target.value)}>
            {templates.map((t) => <option key={t.key} value={t.key}>{t.name}</option>)}
          </Select>
          <p className="text-2xs text-muted-foreground">{template.description}</p>
          <div className="grid gap-2 sm:grid-cols-3">
            {template.params.map((p) => (
              <label key={p.key} className="block text-2xs uppercase tracking-wide text-muted-foreground">
                {p.label}
                {p.kind === "priority" ? (
                  <Select value={String(params[p.key] ?? p.default)} onChange={(e) => setParam(p.key, e.target.value)} className="mt-1 h-9">
                    <option value="low">Low</option>
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                  </Select>
                ) : (
                  <Input type="number" value={String(params[p.key] ?? p.default)} onChange={(e) => setParam(p.key, e.target.value)} className="mt-1 h-9" />
                )}
              </label>
            ))}
          </div>
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0 text-2xs text-muted-foreground">
              {previewing ? (
                <span className="inline-flex items-center gap-1"><Loader2 size={12} className="animate-spin" /> Checking…</span>
              ) : preview !== null ? (
                <span>Would create <span className="font-semibold text-foreground">up to {preview}</span> task{preview === 1 ? "" : "s"} now{preview > 0 ? " (before dedup)" : ""}.</span>
              ) : (
                <span>Preview how many tasks this would create right now.</span>
              )}
            </div>
            <div className="flex shrink-0 gap-1.5">
              <Button size="sm" variant="outline" onClick={doPreview} disabled={previewing || busy}><Eye size={14} /> Preview</Button>
              <Button size="sm" onClick={create} disabled={busy}>
                {busy ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />} Create
              </Button>
            </div>
          </div>
        </Card>
      )}

      {loading ? (
        <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-[68px] w-full rounded-xl" />)}</div>
      ) : rows.length === 0 ? (
        <Card className="p-8 text-center text-sm text-muted-foreground">No automations yet — add one to put follow-ups on autopilot.</Card>
      ) : (
        <div className="space-y-2">
          {rows.map((a) => (
            <Card key={a.id} className={cn("flex items-center gap-3 p-3", !a.enabled && "opacity-60")}>
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-royal/15 text-royal"><Zap size={15} /></span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{a.name}</p>
                <p className="truncate text-2xs text-muted-foreground">
                  {summary(a)}
                  {a.lastRunAt ? ` · ran ${timeAgo(a.lastRunAt)} · ${a.createdCount} created` : " · never run"}
                </p>
              </div>
              <button onClick={() => runOne(a)} disabled={runningId === a.id} className="grid h-7 w-7 shrink-0 place-items-center rounded text-muted-foreground hover:text-foreground disabled:opacity-50" title="Run now">
                {runningId === a.id ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
              </button>
              <label className="flex shrink-0 cursor-pointer items-center gap-1.5 text-2xs text-muted-foreground">
                <input type="checkbox" checked={a.enabled} onChange={() => toggle(a)} className="h-3.5 w-3.5 accent-electric" />
                {a.enabled ? "On" : "Off"}
              </label>
              <button onClick={() => remove(a)} className="grid h-7 w-7 shrink-0 place-items-center rounded text-muted-foreground hover:text-danger" title="Delete"><Trash2 size={14} /></button>
            </Card>
          ))}
        </div>
      )}
      <p className="text-2xs text-muted-foreground">Automations create Tasks on a schedule (needs the cron seam configured). Use “Run now” to trigger immediately.</p>
    </div>
  );
}
