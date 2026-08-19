"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Trash2, Pencil, X, Building2, User, Activity as ActivityIcon, Handshake, Compass, CheckCircle2, XCircle, RotateCcw, Sparkles, Loader2, Mail } from "lucide-react";
import {
  getDealAction,
  updateDealAction,
  updateDealStageAction,
  markDealWonAction,
  markDealLostAction,
  reopenDealAction,
  deleteDealAction,
  addActivityAction,
  type DealDetail as Detail,
} from "@/lib/actions/crm";
import { OPEN_STAGES, stageLabel, weightedValue, LOSS_REASONS, LOSS_REASON_LABEL } from "@/lib/crm/pipeline";
import { TagEditor } from "@/components/crm/tag-editor";
import { EmailComposer } from "@/components/crm/email-composer";
import { AiOutput } from "@/components/crm/ai-output";
import { dealInsightAction, type AiOut } from "@/lib/actions/ai";
import { Card } from "@/components/ui/card";
import { Badge, type Tone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { useCanWrite } from "@/components/crm/role-context";
import { eur, timeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";

function stageTone(stage: string): Tone {
  if (stage === "won") return "emerald";
  if (stage === "lost") return "danger";
  if (stage === "negotiation" || stage === "quote") return "warning";
  return "electric";
}

type Form = { title: string; value: string; probability: string; expectedClose: string; owner: string; contactId: string; notes: string };

export function DealDetail({ id }: { id: number }) {
  const { toast } = useToast();
  const canWrite = useCanWrite();
  const [d, setD] = useState<Detail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<Form | null>(null);
  const [note, setNote] = useState({ type: "note", summary: "" });
  const [lostOpen, setLostOpen] = useState(false);
  const [lossReason, setLossReason] = useState<string>(LOSS_REASONS[0]);
  const [aiResult, setAiResult] = useState<AiOut | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [composing, setComposing] = useState(false);

  async function analyze() {
    setAiLoading(true);
    const r = await dealInsightAction(id).catch(() => null);
    setAiLoading(false);
    setAiResult(r);
  }

  async function load() {
    const res = await getDealAction(id).catch(() => null);
    if (!res) setNotFound(true);
    else setD(res);
    setLoading(false);
  }
  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  function startEdit() {
    if (!d) return;
    const dl = d.deal;
    setForm({
      title: dl.title, value: dl.value ? String(dl.value) : "", probability: dl.probability != null ? String(dl.probability) : "",
      expectedClose: dl.expectedClose ?? "", owner: dl.owner, contactId: dl.contactId != null ? String(dl.contactId) : "", notes: dl.notes,
    });
    setEditing(true);
  }

  async function save() {
    if (!d || !form) return;
    if (!form.title.trim()) return;
    setBusy(true);
    const r = await updateDealAction(id, d.deal.companyId, {
      title: form.title, value: form.value ? Number(form.value) : 0,
      probability: form.probability ? Number(form.probability) : null, expectedClose: form.expectedClose || null,
      owner: form.owner, contactId: form.contactId ? Number(form.contactId) : null, notes: form.notes,
    });
    setBusy(false);
    if (r.error) return toast(r.error, { tone: "error" });
    toast("Deal updated", { tone: "success" });
    setEditing(false);
    await load();
  }

  async function changeStage(stage: string) {
    if (!d) return;
    setD({ ...d, deal: { ...d.deal, stage: stage as Detail["deal"]["stage"] } });
    const r = await updateDealStageAction(id, stage);
    if (r.error) toast(r.error, { tone: "error" });
    await load();
  }

  async function markWon() {
    if (typeof window !== "undefined" && !window.confirm("Mark this deal as Won? Its company becomes a Customer.")) return;
    setBusy(true);
    const r = await markDealWonAction(id);
    setBusy(false);
    if (r.error) return toast(r.error, { tone: "error" });
    toast("Deal won — company is now a Customer 🎉", { tone: "success" });
    await load();
  }

  async function markLost() {
    setBusy(true);
    const r = await markDealLostAction(id, lossReason);
    setBusy(false);
    if (r.error) return toast(r.error, { tone: "error" });
    toast("Deal marked as Lost", { tone: "success" });
    setLostOpen(false);
    await load();
  }

  async function reopen() {
    setBusy(true);
    const r = await reopenDealAction(id, "negotiation");
    setBusy(false);
    if (r.error) return toast(r.error, { tone: "error" });
    toast("Deal reopened", { tone: "success" });
    await load();
  }

  async function logActivity() {
    if (!d || !note.summary.trim()) return;
    setBusy(true);
    const r = await addActivityAction({ companyId: d.deal.companyId, dealId: id, type: note.type, summary: note.summary });
    setBusy(false);
    if (r.error) return toast(r.error, { tone: "error" });
    setNote({ type: "note", summary: "" });
    await load();
  }

  async function remove() {
    if (!d) return;
    if (typeof window !== "undefined" && !window.confirm(`Delete deal "${d.deal.title}"?`)) return;
    const r = await deleteDealAction(id, d.deal.companyId);
    if (r.error) return toast(r.error, { tone: "error" });
    if (typeof window !== "undefined") window.location.href = "/deals";
  }

  if (loading)
    return (
      <div className="space-y-4">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-24 w-full" />
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  if (notFound || !d)
    return (
      <p className="py-16 text-center text-sm text-muted-foreground">
        Deal not found.{" "}
        <Link href="/deals" className="text-electric">Back</Link>
      </p>
    );

  const dl = d.deal;
  const closed = dl.stage === "won" || dl.stage === "lost";
  const weighted = weightedValue({ value: dl.value, stage: dl.stage, probability: dl.probability });

  return (
    <div className="space-y-4">
      <Link href="/deals" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft size={15} /> Deals
      </Link>

      {/* Header */}
      <Card className="p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-electric/12 text-electric"><Handshake size={18} /></span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="truncate text-lg font-semibold tracking-tight">{dl.title}</h1>
                <Badge tone={stageTone(dl.stage)}>{stageLabel(dl.stage)}</Badge>
              </div>
              <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
                <Link href={`/companies/${dl.companyId}`} className="inline-flex items-center gap-1 text-electric hover:underline">
                  <Building2 size={11} /> {dl.companyName || "Company"}
                </Link>
                <span>· <span className="font-semibold text-foreground">{eur(dl.value)}</span></span>
                <span>· weighted {eur(weighted)}</span>
                {dl.probability != null && <span>· {dl.probability}%</span>}
                {dl.owner && <span>· {dl.owner}</span>}
              </p>
            </div>
          </div>
          {canWrite && (
            <div className="flex flex-wrap items-center gap-1.5">
              {closed ? (
                <Button size="sm" variant="outline" onClick={reopen} disabled={busy}><RotateCcw size={13} /> Reopen</Button>
              ) : (
                <>
                  <Select value={dl.stage} onChange={(e) => changeStage(e.target.value)} className="h-8 w-auto text-xs">
                    {OPEN_STAGES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
                  </Select>
                  <Button size="sm" className="bg-emerald text-white hover:bg-emerald/90" onClick={markWon} disabled={busy}><CheckCircle2 size={14} /> Won</Button>
                  <Button size="sm" variant="outline" className="text-danger hover:text-danger" onClick={() => setLostOpen((v) => !v)} disabled={busy}><XCircle size={14} /> Lost</Button>
                </>
              )}
              <Button size="sm" variant="outline" onClick={() => setComposing((v) => !v)}><Mail size={14} /> Email</Button>
              <Button size="sm" variant="outline" onClick={editing ? () => setEditing(false) : startEdit}>
                {editing ? <X size={14} /> : <Pencil size={14} />} {editing ? "Cancel" : "Edit"}
              </Button>
              <Button size="icon" variant="ghost" className="text-muted-foreground hover:text-danger" title="Delete deal" onClick={remove}><Trash2 size={15} /></Button>
            </div>
          )}
        </div>
      </Card>

      {composing && canWrite && (
        <EmailComposer
          to={d.contacts.find((c) => c.id === dl.contactId)?.email ?? d.contacts[0]?.email ?? ""}
          contactId={dl.contactId ?? undefined}
          dealId={id}
          companyId={dl.companyId}
          onClose={() => setComposing(false)}
          onSent={load}
        />
      )}

      {canWrite && lostOpen && !closed && (
        <Card className="flex flex-wrap items-end gap-2 border-danger/30 p-4">
          <label className="text-2xs uppercase tracking-wide text-muted-foreground">
            Loss reason
            <Select value={lossReason} onChange={(e) => setLossReason(e.target.value)} className="mt-1 h-9 w-48">
              {LOSS_REASONS.map((r) => <option key={r} value={r}>{LOSS_REASON_LABEL[r]}</option>)}
            </Select>
          </label>
          <div className="ml-auto flex gap-2">
            <Button size="sm" variant="ghost" onClick={() => setLostOpen(false)}>Cancel</Button>
            <Button size="sm" className="bg-danger text-white hover:bg-danger/90" onClick={markLost} disabled={busy}>Mark Lost</Button>
          </div>
        </Card>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-2xs font-medium uppercase tracking-wide text-muted-foreground">Tags</span>
        <TagEditor entityType="deal" entityId={id} />
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        {/* Main */}
        <div className="space-y-4">
          <Card className="p-4 sm:p-5">
            <p className="text-sm font-semibold">Deal information</p>
            {editing && form ? (
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                <label className="block text-2xs uppercase tracking-wide text-muted-foreground sm:col-span-2">
                  Title
                  <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="mt-1 h-9" />
                </label>
                <LabeledInput label="Value (€)" type="number" value={form.value} onChange={(v) => setForm({ ...form, value: v })} />
                <LabeledInput label="Probability (%)" type="number" value={form.probability} onChange={(v) => setForm({ ...form, probability: v })} />
                <LabeledInput label="Expected close" type="date" value={form.expectedClose} onChange={(v) => setForm({ ...form, expectedClose: v })} />
                <LabeledInput label="Owner" value={form.owner} onChange={(v) => setForm({ ...form, owner: v })} />
                <label className="block text-2xs uppercase tracking-wide text-muted-foreground">
                  Primary contact
                  <Select value={form.contactId} onChange={(e) => setForm({ ...form, contactId: e.target.value })} className="mt-1 h-9">
                    <option value="">— None —</option>
                    {d.contacts.map((c) => <option key={c.id} value={c.id}>{c.name}{c.role ? ` · ${c.role}` : ""}</option>)}
                  </Select>
                </label>
                <label className="block text-2xs uppercase tracking-wide text-muted-foreground sm:col-span-2">
                  Notes
                  <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="mt-1 min-h-[80px] w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-electric" />
                </label>
                <div className="flex justify-end gap-2 sm:col-span-2">
                  <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>Cancel</Button>
                  <Button size="sm" onClick={save} disabled={busy || !form.title.trim()}>Save</Button>
                </div>
              </div>
            ) : (
              <>
                <div className="mt-3 grid grid-cols-1 gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
                  <Fact label="Value" value={eur(dl.value)} />
                  <Fact label="Weighted" value={eur(weighted)} />
                  <Fact label="Stage" value={stageLabel(dl.stage)} />
                  <Fact label="Probability" value={dl.probability != null ? `${dl.probability}%` : "—"} />
                  <Fact label="Expected close" value={dl.expectedClose ?? "—"} />
                  <Fact label="Owner" value={dl.owner || "—"} />
                  <Fact label="Primary contact" value={dl.contactName || "—"} />
                  {closed && <Fact label="Closed" value={dl.closedAt ?? "—"} />}
                  {dl.stage === "lost" && <Fact label="Loss reason" value={dl.lossReason ? (LOSS_REASON_LABEL[dl.lossReason as keyof typeof LOSS_REASON_LABEL] ?? dl.lossReason) : "—"} />}
                </div>
                {dl.notes && <p className="mt-3 whitespace-pre-wrap border-t border-border pt-3 text-sm text-muted-foreground">{dl.notes}</p>}
              </>
            )}
          </Card>

          {/* Timeline */}
          <Card className="p-4 sm:p-5">
            <p className="flex items-center gap-2 text-sm font-semibold"><ActivityIcon size={15} className="text-royal" /> Timeline</p>
            {canWrite && (
              <div className="mt-3 flex gap-2">
                <Select value={note.type} onChange={(e) => setNote({ ...note, type: e.target.value })} className="h-9 w-28 shrink-0">
                  {["note", "call", "email", "meeting"].map((t) => <option key={t} value={t}>{t}</option>)}
                </Select>
                <Input placeholder="What happened?" value={note.summary} onChange={(e) => setNote({ ...note, summary: e.target.value })} className="h-9" />
                <Button size="sm" disabled={busy || !note.summary.trim()} onClick={logActivity}>Log</Button>
              </div>
            )}
            <div className="mt-4 space-y-3 border-l border-border pl-4">
              {d.activities.map((a) => (
                <div key={a.id} className="relative">
                  <span className="absolute -left-[21px] top-1 h-2 w-2 rounded-full bg-electric ring-4 ring-background" />
                  <div className="flex items-center justify-between gap-2">
                    <Badge tone="neutral">{a.type}</Badge>
                    <span className="text-2xs text-muted-foreground">{timeAgo(a.createdAt)}</span>
                  </div>
                  <p className="mt-1 text-sm">{a.summary}</p>
                </div>
              ))}
              {d.activities.length === 0 && (
                <p className="rounded-lg border border-dashed border-border py-6 text-center text-xs text-muted-foreground">No activity logged on this deal yet.</p>
              )}
            </div>
          </Card>
        </div>

        {/* Context panel */}
        <div className="space-y-4">
          <Card className="p-4">
            <p className="text-sm font-semibold">Company</p>
            <Link href={`/companies/${dl.companyId}`} className="mt-2 flex items-center gap-2 rounded-lg border border-border p-2.5 transition-colors hover:bg-secondary/50">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-secondary text-2xs font-bold text-muted-foreground">{(dl.companyName || "?").slice(0, 2).toUpperCase()}</span>
              <span className="min-w-0"><span className="block truncate text-sm font-medium">{dl.companyName || "—"}</span><span className="block text-2xs text-electric">Open account →</span></span>
            </Link>
          </Card>

          {dl.contactId && dl.contactName && (
            <Card className="p-4">
              <p className="text-sm font-semibold">Primary contact</p>
              <Link href={`/contacts/${dl.contactId}`} className="mt-2 flex items-center gap-2 rounded-lg border border-border p-2.5 transition-colors hover:bg-secondary/50">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-royal/15 text-2xs font-bold text-royal"><User size={14} /></span>
                <span className="min-w-0"><span className="block truncate text-sm font-medium">{dl.contactName}</span><span className="block text-2xs text-electric">Open contact →</span></span>
              </Link>
            </Card>
          )}

          <div className="ai-surface p-4">
            <div className="flex items-center justify-between gap-2">
              <p className="flex items-center gap-2 text-sm font-semibold text-royal"><Compass size={15} /> Deal insights</p>
              <Button size="sm" variant="outline" onClick={analyze} disabled={aiLoading}>
                {aiLoading ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />} Analyze
              </Button>
            </div>
            {aiResult || aiLoading ? (
              <div className="mt-3"><AiOutput loading={aiLoading} result={aiResult} /></div>
            ) : (
              <p className="mt-2 text-xs text-muted-foreground">Momentum, risks and the next move for this deal — from the Sajtpress AI.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function LabeledInput({ label, value, onChange, type }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <label className="block text-2xs uppercase tracking-wide text-muted-foreground">
      {label}
      <Input type={type} value={value} onChange={(e) => onChange(e.target.value)} className="mt-1 h-9" />
    </label>
  );
}
function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  );
}
