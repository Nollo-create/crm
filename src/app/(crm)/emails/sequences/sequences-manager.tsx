"use client";

import { useEffect, useState } from "react";
import { GitBranch, Plus, Pencil, Trash2, Loader2, X, ArrowDown, Users } from "lucide-react";
import { listSequencesAction, getSequenceAction, saveSequenceAction, deleteSequenceAction, type SequenceListItem, type SequenceDetail } from "@/lib/actions/sequences";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { useCanWrite } from "@/components/crm/role-context";

const blankStep = () => ({ delayDays: 3, subject: "", body: "" });
const blankSeq = (): SequenceDetail => ({ id: 0, name: "", stopOnOpen: true, steps: [{ delayDays: 0, subject: "", body: "" }] });

export function SequencesManager() {
  const { toast } = useToast();
  const canWrite = useCanWrite();
  const [items, setItems] = useState<SequenceListItem[] | null>(null);
  const [edit, setEdit] = useState<SequenceDetail | null>(null);
  const [busy, setBusy] = useState(false);

  function load() {
    listSequencesAction().then(setItems).catch(() => setItems([]));
  }
  useEffect(() => { load(); }, []);

  async function openEdit(id: number) {
    const d = await getSequenceAction(id).catch(() => null);
    if (d) setEdit(d);
  }

  async function save() {
    if (!edit) return;
    setBusy(true);
    const r = await saveSequenceAction({ id: edit.id || undefined, name: edit.name, stopOnOpen: edit.stopOnOpen, steps: edit.steps });
    setBusy(false);
    if (r.error) return toast(r.error, { tone: "error" });
    toast(edit.id ? "Sequence saved" : "Sequence created", { tone: "success" });
    setEdit(null);
    load();
  }

  async function remove(id: number, name: string) {
    if (typeof window !== "undefined" && !window.confirm(`Delete "${name}"? Active enrollments are stopped.`)) return;
    const r = await deleteSequenceAction(id);
    if (r.error) return toast(r.error, { tone: "error" });
    toast("Sequence deleted", { tone: "success" });
    load();
  }

  // ---- builder helpers
  const setStep = (i: number, patch: Partial<SequenceDetail["steps"][number]>) =>
    setEdit((e) => (e ? { ...e, steps: e.steps.map((s, j) => (j === i ? { ...s, ...patch } : s)) } : e));
  const addStep = () => setEdit((e) => (e ? { ...e, steps: [...e.steps, blankStep()] } : e));
  const removeStep = (i: number) => setEdit((e) => (e && e.steps.length > 1 ? { ...e, steps: e.steps.filter((_, j) => j !== i) } : e));

  if (edit) {
    return (
      <div className="max-w-2xl space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="flex items-center gap-2 text-xl font-semibold tracking-tight"><GitBranch size={18} className="text-electric" /> {edit.id ? "Edit sequence" : "New sequence"}</h1>
          <button onClick={() => setEdit(null)} className="grid h-8 w-8 place-items-center rounded text-muted-foreground hover:text-foreground"><X size={16} /></button>
        </div>

        <Card className="space-y-3 p-4">
          <label className="block text-2xs uppercase tracking-wide text-muted-foreground">
            Sequence name
            <Input value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} placeholder="e.g. New lead nurture" className="mt-1" />
          </label>
          <label className="flex cursor-pointer items-center gap-1.5 text-2xs text-muted-foreground">
            <input type="checkbox" checked={edit.stopOnOpen} onChange={(e) => setEdit({ ...edit, stopOnOpen: e.target.checked })} className="h-3.5 w-3.5 accent-electric" />
            Stop the sequence once the recipient opens an email
          </label>
        </Card>

        {edit.steps.map((s, i) => (
          <div key={i}>
            {i > 0 && <div className="flex items-center justify-center py-1 text-muted-foreground"><ArrowDown size={14} /></div>}
            <Card className="space-y-2 p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold">Step {i + 1}</p>
                {edit.steps.length > 1 && <button onClick={() => removeStep(i)} className="grid h-7 w-7 place-items-center rounded text-muted-foreground hover:text-danger"><Trash2 size={14} /></button>}
              </div>
              <label className="flex items-center gap-2 text-2xs uppercase tracking-wide text-muted-foreground">
                <span className="w-24 shrink-0">{i === 0 ? "Send after" : "Then wait"}</span>
                <Input type="number" min={0} max={365} value={String(s.delayDays)} onChange={(e) => setStep(i, { delayDays: Math.max(0, Number(e.target.value) || 0) })} className="h-8 w-20" />
                <span className="normal-case">day(s){i === 0 ? " from enrollment (0 = right away)" : " after the previous step"}</span>
              </label>
              <Input value={s.subject} onChange={(e) => setStep(i, { subject: e.target.value })} placeholder="Subject — {{company}}" />
              <textarea value={s.body} onChange={(e) => setStep(i, { body: e.target.value })} rows={5} placeholder={"Hi {{first_name}}, …"} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-electric" />
            </Card>
          </div>
        ))}

        <div className="flex items-center justify-between">
          <Button size="sm" variant="outline" onClick={addStep} disabled={edit.steps.length >= 10}><Plus size={14} /> Add step</Button>
          <div className="flex items-center gap-2">
            <p className="text-[10px] text-muted-foreground"><code>{"{{name}}"}</code> <code>{"{{first_name}}"}</code> <code>{"{{company}}"}</code> per recipient</p>
            <Button size="sm" onClick={save} disabled={busy || !edit.name.trim()}>{busy ? <Loader2 size={14} className="animate-spin" /> : null} Save</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-semibold tracking-tight"><GitBranch size={18} className="text-electric" /> Follow-up sequences</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">Multi-step email cadences. Enroll a contact from their profile; the cron sends each step on schedule.</p>
        </div>
        {canWrite && <Button size="sm" onClick={() => setEdit(blankSeq())}><Plus size={14} /> New</Button>}
      </div>

      {items === null ? (
        <div className="space-y-2">{[0, 1].map((i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
      ) : items.length === 0 ? (
        <Card className="p-8 text-center text-sm text-muted-foreground">No sequences yet.{canWrite ? " Create one, then enroll contacts from their profiles." : ""}</Card>
      ) : (
        <div className="space-y-2">
          {items.map((s) => (
            <Card key={s.id} className="flex items-center gap-3 p-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-electric/12 text-electric"><GitBranch size={16} /></span>
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-2 truncate text-sm font-medium">{s.name} {s.stopOnOpen && <Badge tone="neutral">stops on open</Badge>}</p>
                <p className="flex items-center gap-2 text-2xs text-muted-foreground">{s.stepCount} step{s.stepCount === 1 ? "" : "s"} · <span className="inline-flex items-center gap-1"><Users size={11} /> {s.activeCount} active</span>{s.totalEnrolled > 0 && ` · ${s.totalEnrolled} enrolled`}</p>
              </div>
              {canWrite && (
                <div className="flex shrink-0 items-center gap-1">
                  <button onClick={() => openEdit(s.id)} className="grid h-7 w-7 place-items-center rounded text-muted-foreground hover:text-foreground" title="Edit"><Pencil size={14} /></button>
                  <button onClick={() => remove(s.id, s.name)} className="grid h-7 w-7 place-items-center rounded text-muted-foreground hover:text-danger" title="Delete"><Trash2 size={14} /></button>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
