"use client";

import { useEffect, useState } from "react";
import { FormInput, Plus, Pencil, Trash2, Loader2, X, Copy, Check, ExternalLink, Code2 } from "lucide-react";
import {
  captureFormsAction,
  createCaptureFormAction,
  updateCaptureFormAction,
  deleteCaptureFormAction,
  type CaptureFormView,
  type CaptureFormDTO,
} from "@/lib/actions/capture-forms";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { useCanWrite } from "@/components/crm/role-context";
import { cn } from "@/lib/utils";

type Draft = CaptureFormDTO & { id: number };
const emptyDraft = (): Draft => ({ id: 0, name: "", title: "", description: "", successMessage: "", redirectUrl: "", requireCompany: false, notify: true, active: true });

export function FormsManager() {
  const { toast } = useToast();
  const canWrite = useCanWrite();
  const [forms, setForms] = useState<CaptureFormView[] | null>(null);
  const [baseUrl, setBaseUrl] = useState("");
  const [draft, setDraft] = useState<Draft | null>(null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState<string>("");

  function load() {
    captureFormsAction()
      .then((r) => { setForms(r.forms); setBaseUrl(r.baseUrl || (typeof window !== "undefined" ? window.location.origin : "")); })
      .catch(() => setForms([]));
  }
  useEffect(() => { load(); }, []);

  function hostedUrl(token: string) { return `${baseUrl}/f/${token}`; }
  function embedSnippet(f: CaptureFormView) {
    return `<iframe src="${baseUrl}/f/${f.token}?embed=1" width="100%" height="560" style="border:0;max-width:480px" title="${(f.title || f.name).replace(/"/g, "&quot;")}"></iframe>`;
  }

  async function copy(key: string, text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      setTimeout(() => setCopied((c) => (c === key ? "" : c)), 1500);
    } catch {
      toast("Couldn't copy — select and copy manually.", { tone: "error" });
    }
  }

  function openNew() { setDraft(emptyDraft()); }
  function openEdit(f: CaptureFormView) {
    setDraft({ id: f.id, name: f.name, title: f.title, description: f.description, successMessage: f.successMessage, redirectUrl: f.redirectUrl, requireCompany: f.requireCompany, notify: f.notify, active: f.active });
  }

  async function save() {
    if (!draft) return;
    setBusy(true);
    const { id, ...dto } = draft;
    const r = id ? await updateCaptureFormAction(id, dto) : await createCaptureFormAction(dto);
    setBusy(false);
    if (r.error) return toast(r.error, { tone: "error" });
    toast(id ? "Form updated" : "Form created", { tone: "success" });
    setDraft(null);
    load();
  }

  async function toggleActive(f: CaptureFormView) {
    const r = await updateCaptureFormAction(f.id, { name: f.name, title: f.title, description: f.description, successMessage: f.successMessage, redirectUrl: f.redirectUrl, requireCompany: f.requireCompany, notify: f.notify, active: !f.active });
    if (r.error) return toast(r.error, { tone: "error" });
    load();
  }

  async function remove(f: CaptureFormView) {
    if (typeof window !== "undefined" && !window.confirm(`Delete "${f.name}"? Existing leads it created are kept.`)) return;
    const r = await deleteCaptureFormAction(f.id);
    if (r.error) return toast(r.error, { tone: "error" });
    toast("Form deleted", { tone: "success" });
    load();
  }

  return (
    <div className="max-w-2xl space-y-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-semibold tracking-tight"><FormInput size={18} className="text-electric" /> Lead Capture</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">Embeddable web forms that turn website visitors into leads.</p>
        </div>
        {canWrite && !draft && <Button size="sm" onClick={openNew}><Plus size={14} /> New form</Button>}
      </div>

      {draft && (
        <Card className="space-y-3 p-4">
          <div className="flex items-center justify-between"><p className="text-sm font-semibold">{draft.id ? "Edit form" : "New form"}</p><button onClick={() => setDraft(null)} className="grid h-7 w-7 place-items-center rounded text-muted-foreground hover:text-foreground"><X size={15} /></button></div>
          <label className="block text-2xs uppercase tracking-wide text-muted-foreground">Internal name
            <Input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder="Website contact form" className="mt-1" />
          </label>
          <label className="block text-2xs uppercase tracking-wide text-muted-foreground">Heading (shown to visitors)
            <Input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} placeholder="Get in touch" className="mt-1" />
          </label>
          <label className="block text-2xs uppercase tracking-wide text-muted-foreground">Description
            <Input value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} placeholder="Tell us about your project and we'll reply within a day." className="mt-1" />
          </label>
          <label className="block text-2xs uppercase tracking-wide text-muted-foreground">Success message
            <Input value={draft.successMessage} onChange={(e) => setDraft({ ...draft, successMessage: e.target.value })} placeholder="Thanks — we'll be in touch shortly." className="mt-1" />
          </label>
          <label className="block text-2xs uppercase tracking-wide text-muted-foreground">Redirect URL after submit (optional)
            <Input value={draft.redirectUrl} onChange={(e) => setDraft({ ...draft, redirectUrl: e.target.value })} placeholder="https://yoursite.com/thank-you" className="mt-1" />
          </label>
          <div className="flex flex-wrap gap-4 pt-1">
            <label className="flex items-center gap-2 text-sm text-muted-foreground"><input type="checkbox" checked={!!draft.requireCompany} onChange={(e) => setDraft({ ...draft, requireCompany: e.target.checked })} className="h-4 w-4 accent-electric" /> Require company</label>
            <label className="flex items-center gap-2 text-sm text-muted-foreground"><input type="checkbox" checked={draft.notify !== false} onChange={(e) => setDraft({ ...draft, notify: e.target.checked })} className="h-4 w-4 accent-electric" /> Notify team on submit</label>
            <label className="flex items-center gap-2 text-sm text-muted-foreground"><input type="checkbox" checked={draft.active !== false} onChange={(e) => setDraft({ ...draft, active: e.target.checked })} className="h-4 w-4 accent-electric" /> Active</label>
          </div>
          <div className="flex justify-end"><Button size="sm" onClick={save} disabled={busy || !draft.name.trim()}>{busy ? <Loader2 size={14} className="animate-spin" /> : null} Save</Button></div>
        </Card>
      )}

      {forms === null ? (
        <div className="space-y-2">{[0, 1].map((i) => <Skeleton key={i} className="h-24 w-full" />)}</div>
      ) : forms.length === 0 ? (
        <Card className="p-8 text-center text-sm text-muted-foreground">No capture forms yet.{canWrite ? " Create one to start collecting leads from your website." : ""}</Card>
      ) : (
        <div className="space-y-3">
          {forms.map((f) => (
            <Card key={f.id} className="space-y-3 p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="flex items-center gap-2 text-sm font-medium">{f.name} {f.active ? <Badge tone="emerald">Active</Badge> : <Badge tone="neutral">Off</Badge>}</p>
                  <p className="text-2xs text-muted-foreground">{f.submissions} submission{f.submissions === 1 ? "" : "s"}{f.requireCompany ? " · company required" : ""}{f.notify ? " · notifies team" : ""}</p>
                </div>
                {canWrite && (
                  <div className="flex shrink-0 items-center gap-1">
                    <button onClick={() => toggleActive(f)} className="rounded px-2 py-1 text-2xs font-medium text-muted-foreground hover:text-foreground" title={f.active ? "Deactivate" : "Activate"}>{f.active ? "Turn off" : "Turn on"}</button>
                    <button onClick={() => openEdit(f)} className="grid h-7 w-7 place-items-center rounded text-muted-foreground hover:text-foreground"><Pencil size={13} /></button>
                    <button onClick={() => remove(f)} className="grid h-7 w-7 place-items-center rounded text-muted-foreground hover:text-danger"><Trash2 size={13} /></button>
                  </div>
                )}
              </div>

              {/* Hosted link */}
              <div className="flex items-center gap-2 rounded-lg border border-border bg-secondary/40 px-2.5 py-1.5">
                <ExternalLink size={13} className="shrink-0 text-muted-foreground" />
                <a href={hostedUrl(f.token)} target="_blank" rel="noopener noreferrer" className="min-w-0 flex-1 truncate text-xs text-electric hover:underline">{hostedUrl(f.token)}</a>
                <button onClick={() => copy(`url-${f.id}`, hostedUrl(f.token))} className="shrink-0 text-muted-foreground hover:text-foreground" title="Copy link">{copied === `url-${f.id}` ? <Check size={13} className="text-emerald" /> : <Copy size={13} />}</button>
              </div>

              {/* Embed snippet */}
              <div className="flex items-start gap-2 rounded-lg border border-border bg-secondary/40 px-2.5 py-1.5">
                <Code2 size={13} className="mt-0.5 shrink-0 text-muted-foreground" />
                <code className="min-w-0 flex-1 truncate text-2xs text-muted-foreground">{embedSnippet(f)}</code>
                <button onClick={() => copy(`embed-${f.id}`, embedSnippet(f))} className="shrink-0 text-muted-foreground hover:text-foreground" title="Copy embed code">{copied === `embed-${f.id}` ? <Check size={13} className="text-emerald" /> : <Copy size={13} />}</button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
