"use client";

import { useEffect, useState } from "react";
import { FileText, Plus, Pencil, Trash2, Loader2, X } from "lucide-react";
import { listEmailTemplatesAction, saveEmailTemplateAction, deleteEmailTemplateAction, type EmailTemplateView } from "@/lib/actions/email";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { useCanWrite } from "@/components/crm/role-context";

const BLANK = { id: 0, name: "", subject: "", body: "" };

export function TemplatesManager() {
  const { toast } = useToast();
  const canWrite = useCanWrite();
  const [items, setItems] = useState<EmailTemplateView[] | null>(null);
  const [edit, setEdit] = useState<typeof BLANK | null>(null);
  const [busy, setBusy] = useState(false);

  function load() {
    listEmailTemplatesAction().then(setItems).catch(() => setItems([]));
  }
  useEffect(() => { load(); }, []);

  async function save() {
    if (!edit) return;
    setBusy(true);
    const r = await saveEmailTemplateAction({ id: edit.id || undefined, name: edit.name, subject: edit.subject, body: edit.body });
    setBusy(false);
    if (r.error) return toast(r.error, { tone: "error" });
    toast(edit.id ? "Template updated" : "Template added", { tone: "success" });
    setEdit(null);
    load();
  }

  async function remove(id: number, name: string) {
    if (typeof window !== "undefined" && !window.confirm(`Delete the "${name}" template?`)) return;
    const r = await deleteEmailTemplateAction(id);
    if (r.error) return toast(r.error, { tone: "error" });
    toast("Template deleted", { tone: "success" });
    load();
  }

  return (
    <div className="max-w-2xl space-y-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-semibold tracking-tight"><FileText size={18} className="text-electric" /> Email templates</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">Reusable subject + body your team can pick from when composing an email.</p>
        </div>
        {canWrite && !edit && <Button size="sm" onClick={() => setEdit({ ...BLANK })}><Plus size={14} /> New</Button>}
      </div>

      {edit && (
        <Card className="space-y-3 p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold">{edit.id ? "Edit template" : "New template"}</p>
            <button onClick={() => setEdit(null)} className="grid h-7 w-7 place-items-center rounded text-muted-foreground hover:text-foreground"><X size={15} /></button>
          </div>
          <label className="block text-2xs uppercase tracking-wide text-muted-foreground">
            Template name
            <Input value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} placeholder="e.g. Intro call request" className="mt-1" />
          </label>
          <label className="block text-2xs uppercase tracking-wide text-muted-foreground">
            Subject
            <Input value={edit.subject} onChange={(e) => setEdit({ ...edit, subject: e.target.value })} placeholder="Quick idea for {{company}}" className="mt-1" />
          </label>
          <label className="block text-2xs uppercase tracking-wide text-muted-foreground">
            Body
            <textarea value={edit.body} onChange={(e) => setEdit({ ...edit, body: e.target.value })} rows={8} placeholder={"Hi {{first_name}},\n\n…\n\nBest,"} className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-electric" />
          </label>
          <div className="flex items-center justify-between gap-2">
            <p className="text-[10px] text-muted-foreground">Placeholders: <code>{"{{name}}"}</code> <code>{"{{first_name}}"}</code> <code>{"{{company}}"}</code> — filled in per recipient.</p>
            <Button size="sm" onClick={save} disabled={busy || !edit.name.trim() || !edit.subject.trim() || !edit.body.trim()}>{busy ? <Loader2 size={14} className="animate-spin" /> : null} Save</Button>
          </div>
        </Card>
      )}

      {items === null ? (
        <Card className="p-6 text-center text-sm text-muted-foreground"><Loader2 size={16} className="mx-auto animate-spin" /></Card>
      ) : items.length === 0 ? (
        <Card className="p-8 text-center text-sm text-muted-foreground">No templates yet.{canWrite ? " Add one to speed up your team's sends." : ""}</Card>
      ) : (
        <div className="space-y-2">
          {items.map((t) => (
            <Card key={t.id} className="flex items-start gap-3 p-3">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-electric/12 text-electric"><FileText size={15} /></span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{t.name}</p>
                <p className="truncate text-2xs text-muted-foreground">{t.subject}</p>
              </div>
              {canWrite && (
                <div className="flex shrink-0 items-center gap-1">
                  <button onClick={() => setEdit({ id: t.id, name: t.name, subject: t.subject, body: t.body })} className="grid h-7 w-7 place-items-center rounded text-muted-foreground hover:text-foreground" title="Edit"><Pencil size={14} /></button>
                  <button onClick={() => remove(t.id, t.name)} className="grid h-7 w-7 place-items-center rounded text-muted-foreground hover:text-danger" title="Delete"><Trash2 size={14} /></button>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
