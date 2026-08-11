"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Pencil,
  X,
  Building2,
  Mail,
  Phone,
  Smartphone,
  Linkedin,
  Activity as ActivityIcon,
  Compass,
} from "lucide-react";
import {
  getContactAction,
  updateContactAction,
  deleteContactAction,
  addActivityAction,
  type ContactDetail as Detail,
} from "@/lib/actions/crm";
import { Card } from "@/components/ui/card";
import { Badge, type Tone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { timeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";

const INFLUENCE: Record<string, { label: string; stars: number; tone: Tone }> = {
  decision_maker: { label: "Decision maker", stars: 5, tone: "royal" },
  technical: { label: "Technical decision", stars: 5, tone: "electric" },
  influencer: { label: "Influencer", stars: 4, tone: "electric" },
  finance: { label: "Payment decision", stars: 2, tone: "warning" },
  none: { label: "Contact", stars: 0, tone: "neutral" },
};
const infl = (k: string) => INFLUENCE[k] ?? INFLUENCE.none;

type Form = { name: string; role: string; department: string; email: string; phone: string; mobile: string; linkedin: string; influence: string; notes: string };

export function ContactDetail({ id }: { id: number }) {
  const { toast } = useToast();
  const [d, setD] = useState<Detail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<Form | null>(null);
  const [note, setNote] = useState({ type: "note", summary: "" });

  async function load() {
    const res = await getContactAction(id).catch(() => null);
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
    const c = d.contact;
    setForm({ name: c.name, role: c.role, department: c.department, email: c.email, phone: c.phone, mobile: c.mobile, linkedin: c.linkedin, influence: c.influence, notes: c.notes });
    setEditing(true);
  }

  async function save() {
    if (!d || !form) return;
    if (!form.name.trim()) return;
    setBusy(true);
    const r = await updateContactAction(id, d.contact.companyId, form);
    setBusy(false);
    if (r.error) return toast(r.error, { tone: "error" });
    toast("Contact updated", { tone: "success" });
    setEditing(false);
    await load();
  }

  async function logActivity() {
    if (!d || !note.summary.trim()) return;
    setBusy(true);
    const r = await addActivityAction({ companyId: d.contact.companyId, contactId: id, type: note.type, summary: note.summary });
    setBusy(false);
    if (r.error) return toast(r.error, { tone: "error" });
    setNote({ type: "note", summary: "" });
    await load();
  }

  async function remove() {
    if (!d) return;
    if (typeof window !== "undefined" && !window.confirm(`Remove ${d.contact.name} from ${d.contact.companyName}?`)) return;
    await deleteContactAction(id, d.contact.companyId);
    if (typeof window !== "undefined") window.location.href = "/contacts";
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
        Contact not found.{" "}
        <Link href="/contacts" className="text-electric">Back</Link>
      </p>
    );

  const c = d.contact;
  const inf = infl(c.influence);
  const linkedinHref = c.linkedin ? (c.linkedin.startsWith("http") ? c.linkedin : `https://${c.linkedin}`) : null;

  return (
    <div className="space-y-4">
      <Link href="/contacts" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft size={15} /> Contacts
      </Link>

      {/* Header */}
      <Card className="p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-royal/15 text-sm font-bold text-royal">
              {c.name.slice(0, 2).toUpperCase()}
            </span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="truncate text-lg font-semibold tracking-tight">{c.name}</h1>
                <Badge tone={inf.tone}>{inf.label}</Badge>
              </div>
              <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
                {c.role && <span>{c.role}</span>}
                {c.department && <span>· {c.department}</span>}
                <Link href={`/companies/${c.companyId}`} className="inline-flex items-center gap-1 text-electric hover:underline">
                  <Building2 size={11} /> {c.companyName || "Company"}
                </Link>
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <a href={c.email ? `mailto:${c.email}` : undefined} className={cn(!c.email && "pointer-events-none opacity-40")}>
              <Button size="icon" variant="ghost" title="Email"><Mail size={15} /></Button>
            </a>
            <a href={c.phone || c.mobile ? `tel:${c.phone || c.mobile}` : undefined} className={cn(!c.phone && !c.mobile && "pointer-events-none opacity-40")}>
              <Button size="icon" variant="ghost" title="Call"><Phone size={15} /></Button>
            </a>
            <Button size="sm" variant="outline" onClick={editing ? () => setEditing(false) : startEdit}>
              {editing ? <X size={14} /> : <Pencil size={14} />} {editing ? "Cancel" : "Edit"}
            </Button>
            <Button size="icon" variant="ghost" className="text-muted-foreground hover:text-danger" title="Remove contact" onClick={remove}>
              <Trash2 size={15} />
            </Button>
          </div>
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        {/* Main */}
        <div className="space-y-4">
          {/* Info / edit */}
          <Card className="p-4 sm:p-5">
            <p className="text-sm font-semibold">Contact information</p>
            {editing && form ? (
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                <LabeledInput label="Name *" value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
                <LabeledInput label="Job title" value={form.role} onChange={(v) => setForm({ ...form, role: v })} />
                <LabeledInput label="Department" value={form.department} onChange={(v) => setForm({ ...form, department: v })} />
                <label className="block text-2xs uppercase tracking-wide text-muted-foreground">
                  Influence
                  <Select value={form.influence} onChange={(e) => setForm({ ...form, influence: e.target.value })} className="mt-1 h-9">
                    {Object.entries(INFLUENCE).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </Select>
                </label>
                <LabeledInput label="Email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} />
                <LabeledInput label="Phone" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} />
                <LabeledInput label="Mobile" value={form.mobile} onChange={(v) => setForm({ ...form, mobile: v })} />
                <LabeledInput label="LinkedIn" value={form.linkedin} onChange={(v) => setForm({ ...form, linkedin: v })} />
                <label className="block text-2xs uppercase tracking-wide text-muted-foreground sm:col-span-2">
                  Notes
                  <textarea
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    className="mt-1 min-h-[80px] w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-electric"
                  />
                </label>
                <div className="flex justify-end gap-2 sm:col-span-2">
                  <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>Cancel</Button>
                  <Button size="sm" onClick={save} disabled={busy || !form.name.trim()}>Save</Button>
                </div>
              </div>
            ) : (
              <>
                <div className="mt-3 grid grid-cols-1 gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
                  <ContactFact Icon={Mail} label="Email" value={c.email} href={c.email ? `mailto:${c.email}` : undefined} />
                  <ContactFact Icon={Phone} label="Phone" value={c.phone} href={c.phone ? `tel:${c.phone}` : undefined} />
                  <ContactFact Icon={Smartphone} label="Mobile" value={c.mobile} href={c.mobile ? `tel:${c.mobile}` : undefined} />
                  <ContactFact Icon={Linkedin} label="LinkedIn" value={c.linkedin} href={linkedinHref ?? undefined} external />
                </div>
                {inf.stars > 0 && <p className="mt-3 border-t border-border pt-3 text-xs text-warning">{"★".repeat(inf.stars)}<span className="text-muted-foreground"> {inf.label}</span></p>}
                {c.notes && <p className="mt-3 whitespace-pre-wrap border-t border-border pt-3 text-sm text-muted-foreground">{c.notes}</p>}
              </>
            )}
          </Card>

          {/* Timeline */}
          <Card className="p-4 sm:p-5">
            <p className="flex items-center gap-2 text-sm font-semibold"><ActivityIcon size={15} className="text-royal" /> Timeline</p>
            <div className="mt-3 flex gap-2">
              <Select value={note.type} onChange={(e) => setNote({ ...note, type: e.target.value })} className="h-9 w-28 shrink-0">
                {["note", "call", "email", "meeting"].map((t) => <option key={t} value={t}>{t}</option>)}
              </Select>
              <Input placeholder="What happened?" value={note.summary} onChange={(e) => setNote({ ...note, summary: e.target.value })} className="h-9" />
              <Button size="sm" disabled={busy || !note.summary.trim()} onClick={logActivity}><Plus size={13} /> Log</Button>
            </div>
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
                <p className="rounded-lg border border-dashed border-border py-6 text-center text-xs text-muted-foreground">No activity logged with this contact yet.</p>
              )}
            </div>
          </Card>
        </div>

        {/* Context panel */}
        <div className="space-y-4">
          <Card className="p-4">
            <p className="text-sm font-semibold">Company</p>
            <Link href={`/companies/${c.companyId}`} className="mt-2 flex items-center gap-2 rounded-lg border border-border p-2.5 transition-colors hover:bg-secondary/50">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-secondary text-2xs font-bold text-muted-foreground">
                {(c.companyName || "?").slice(0, 2).toUpperCase()}
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium">{c.companyName || "—"}</span>
                <span className="block text-2xs text-electric">Open account →</span>
              </span>
            </Link>
          </Card>

          <div className="ai-surface p-4">
            <p className="flex items-center gap-2 text-sm font-semibold text-royal"><Compass size={15} /> Next best action</p>
            <p className="mt-2 text-xs text-muted-foreground">AI will recommend the next touch for this stakeholder from engagement signals.</p>
            <span className="soon-badge mt-2 inline-block">soon</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function LabeledInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block text-2xs uppercase tracking-wide text-muted-foreground">
      {label}
      <Input value={value} onChange={(e) => onChange(e.target.value)} className="mt-1 h-9" />
    </label>
  );
}

function ContactFact({ Icon, label, value, href, external }: { Icon: typeof Mail; label: string; value: string; href?: string; external?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <Icon size={14} className="shrink-0 text-muted-foreground" />
      <span className="w-16 shrink-0 text-2xs uppercase tracking-wide text-muted-foreground">{label}</span>
      {value ? (
        href ? (
          <a href={href} target={external ? "_blank" : undefined} rel={external ? "noreferrer" : undefined} className="truncate text-electric hover:underline">{value}</a>
        ) : (
          <span className="truncate">{value}</span>
        )
      ) : (
        <span className="text-muted-foreground">—</span>
      )}
    </div>
  );
}
