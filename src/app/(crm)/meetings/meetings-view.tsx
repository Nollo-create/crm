"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CalendarDays, Plus, Pencil, Trash2, Loader2, X, Building2, MapPin, Clock } from "lucide-react";
import { meetingsAction, createMeetingAction, updateMeetingAction, deleteMeetingAction, type MeetingView, type MeetingDTO } from "@/lib/actions/meetings";
import { searchCompaniesAction, getCompanyAction, type SearchHit } from "@/lib/actions/crm";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { useCanWrite } from "@/components/crm/role-context";
import { cn } from "@/lib/utils";

type Draft = { id: number; title: string; when: string; durationMin: number; companyId: number; companyName: string; contactId: number; location: string; notes: string };
const emptyDraft = (): Draft => ({ id: 0, title: "", when: "", durationMin: 30, companyId: 0, companyName: "", contactId: 0, location: "", notes: "" });

// ISO → value for <input type="datetime-local"> (local time, no seconds).
function toLocalInput(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const DAY = 86_400_000;
const startOfToday = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d.getTime(); };

export function MeetingsView() {
  const { toast } = useToast();
  const canWrite = useCanWrite();
  const [items, setItems] = useState<MeetingView[] | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [q, setQ] = useState("");
  const [results, setResults] = useState<SearchHit[]>([]);
  const [contacts, setContacts] = useState<{ id: number; name: string }[]>([]);
  const [busy, setBusy] = useState(false);

  function load() { meetingsAction().then(setItems).catch(() => setItems([])); }
  useEffect(() => { load(); }, []);

  useEffect(() => {
    const s = q.trim();
    if (!s) { setResults([]); return; }
    const t = setTimeout(async () => setResults(await searchCompaniesAction(s).catch(() => [])), 200);
    return () => clearTimeout(t);
  }, [q]);

  async function pickCompany(id: number, name: string) {
    setDraft((d) => (d ? { ...d, companyId: id, companyName: name, contactId: 0 } : d));
    setQ(""); setResults([]);
    const detail = await getCompanyAction(id).catch(() => null);
    setContacts(detail ? detail.contacts.map((c) => ({ id: c.id, name: c.name })) : []);
  }

  function openNew() { setDraft(emptyDraft()); setContacts([]); }
  async function openEdit(m: MeetingView) {
    setDraft({ id: m.id, title: m.title, when: toLocalInput(m.startsAt), durationMin: m.durationMin, companyId: m.companyId ?? 0, companyName: m.companyName ?? "", contactId: m.contactId ?? 0, location: m.location, notes: m.notes });
    if (m.companyId) { const d = await getCompanyAction(m.companyId).catch(() => null); setContacts(d ? d.contacts.map((c) => ({ id: c.id, name: c.name })) : []); }
  }

  async function save() {
    if (!draft) return;
    if (!draft.when) return toast("Pick a date and time.", { tone: "error" });
    setBusy(true);
    const dto: MeetingDTO = { title: draft.title, startsAt: new Date(draft.when).toISOString(), durationMin: draft.durationMin, companyId: draft.companyId || null, contactId: draft.contactId || null, location: draft.location, notes: draft.notes };
    const r = draft.id ? await updateMeetingAction(draft.id, dto) : await createMeetingAction(dto);
    setBusy(false);
    if (r.error) return toast(r.error, { tone: "error" });
    toast(draft.id ? "Meeting updated" : "Meeting scheduled", { tone: "success" });
    setDraft(null);
    load();
  }

  async function remove(id: number, title: string) {
    if (typeof window !== "undefined" && !window.confirm(`Delete "${title}"?`)) return;
    const r = await deleteMeetingAction(id);
    if (r.error) return toast(r.error, { tone: "error" });
    load();
  }

  const today0 = startOfToday();
  const groups: { label: string; items: MeetingView[] }[] = [
    { label: "Today", items: (items ?? []).filter((m) => { const t = new Date(m.startsAt).getTime(); return t >= today0 && t < today0 + DAY; }) },
    { label: "Upcoming", items: (items ?? []).filter((m) => new Date(m.startsAt).getTime() >= today0 + DAY) },
    { label: "Earlier", items: (items ?? []).filter((m) => new Date(m.startsAt).getTime() < today0).reverse() },
  ].filter((g) => g.items.length > 0);

  const when = (iso: string) => new Date(iso).toLocaleString(undefined, { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });

  return (
    <div className="max-w-2xl space-y-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-semibold tracking-tight"><CalendarDays size={18} className="text-electric" /> Meetings</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">Schedule and track meetings, linked to your accounts.</p>
        </div>
        {canWrite && !draft && <Button size="sm" onClick={openNew}><Plus size={14} /> New</Button>}
      </div>

      {draft && (
        <Card className="space-y-3 p-4">
          <div className="flex items-center justify-between"><p className="text-sm font-semibold">{draft.id ? "Edit meeting" : "New meeting"}</p><button onClick={() => setDraft(null)} className="grid h-7 w-7 place-items-center rounded text-muted-foreground hover:text-foreground"><X size={15} /></button></div>
          <Input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} placeholder="Meeting title" />
          <div className="grid gap-2 sm:grid-cols-2">
            <label className="text-2xs uppercase tracking-wide text-muted-foreground">When
              <Input type="datetime-local" value={draft.when} onChange={(e) => setDraft({ ...draft, when: e.target.value })} className="mt-1" />
            </label>
            <label className="text-2xs uppercase tracking-wide text-muted-foreground">Duration
              <Select value={String(draft.durationMin)} onChange={(e) => setDraft({ ...draft, durationMin: Number(e.target.value) })} className="mt-1 h-9">
                {[15, 30, 45, 60, 90, 120].map((d) => <option key={d} value={d}>{d} min</option>)}
              </Select>
            </label>
          </div>
          {/* Company link */}
          {draft.companyId ? (
            <div className="flex h-9 items-center justify-between rounded-lg border border-border bg-secondary/40 px-3 text-sm">
              <span className="truncate"><Building2 size={13} className="mr-1 inline text-muted-foreground" />{draft.companyName}</span>
              <button onClick={() => { setDraft({ ...draft, companyId: 0, companyName: "", contactId: 0 }); setContacts([]); }} className="text-muted-foreground hover:text-foreground"><X size={14} /></button>
            </div>
          ) : (
            <div className="relative">
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Link a company (optional)…" />
              {results.length > 0 && (
                <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-lg border border-border bg-popover shadow-pop">
                  {results.map((c) => <button key={c.id} onClick={() => pickCompany(c.id, c.name)} className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-secondary"><Building2 size={14} className="shrink-0 text-muted-foreground" /><span className="flex-1 truncate">{c.name}</span></button>)}
                </div>
              )}
            </div>
          )}
          {contacts.length > 0 && (
            <Select value={String(draft.contactId)} onChange={(e) => setDraft({ ...draft, contactId: Number(e.target.value) })} className="h-9 text-sm">
              <option value="0">No specific contact</option>
              {contacts.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Select>
          )}
          <Input value={draft.location} onChange={(e) => setDraft({ ...draft, location: e.target.value })} placeholder="Location or link (Zoom, address…)" />
          <textarea value={draft.notes} onChange={(e) => setDraft({ ...draft, notes: e.target.value })} rows={3} placeholder="Notes / agenda" className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-electric" />
          <div className="flex justify-end"><Button size="sm" onClick={save} disabled={busy || !draft.title.trim() || !draft.when}>{busy ? <Loader2 size={14} className="animate-spin" /> : null} Save</Button></div>
        </Card>
      )}

      {items === null ? (
        <div className="space-y-2">{[0, 1].map((i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
      ) : items.length === 0 ? (
        <Card className="p-8 text-center text-sm text-muted-foreground">No meetings scheduled.{canWrite ? " Add one to get started." : ""}</Card>
      ) : (
        groups.map((g) => (
          <div key={g.label}>
            <p className="mb-2 text-2xs font-semibold uppercase tracking-wide text-muted-foreground">{g.label}</p>
            <div className="space-y-2">
              {g.items.map((m) => {
                const past = new Date(m.startsAt).getTime() < Date.now();
                return (
                  <Card key={m.id} className={cn("flex items-start gap-3 p-3", past && "opacity-70")}>
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-electric/12 text-electric"><CalendarDays size={16} /></span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{m.title}</p>
                      <p className="flex flex-wrap items-center gap-x-2 text-2xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1"><Clock size={11} /> {when(m.startsAt)} · {m.durationMin}m</span>
                        {m.companyId && m.companyName && <Link href={`/companies/${m.companyId}`} className="text-electric hover:underline">{m.companyName}</Link>}
                        {m.contactName && <span>· {m.contactName}</span>}
                        {m.location && <span className="inline-flex items-center gap-1"><MapPin size={11} /> {m.location}</span>}
                      </p>
                      {m.notes && <p className="mt-1 line-clamp-2 whitespace-pre-wrap text-2xs text-muted-foreground/80">{m.notes}</p>}
                    </div>
                    {canWrite && (
                      <div className="flex shrink-0 items-center gap-1">
                        <button onClick={() => openEdit(m)} className="grid h-7 w-7 place-items-center rounded text-muted-foreground hover:text-foreground"><Pencil size={13} /></button>
                        <button onClick={() => remove(m.id, m.title)} className="grid h-7 w-7 place-items-center rounded text-muted-foreground hover:text-danger"><Trash2 size={13} /></button>
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
