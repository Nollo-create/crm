"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, Plus, Trash2, Sparkles, Users, Handshake, Activity as ActivityIcon } from "lucide-react";
import {
  getCompanyAction,
  updateCompanyAction,
  addContactAction,
  deleteContactAction,
  createDealAction,
  updateDealStageAction,
  deleteDealAction,
  addActivityAction,
  type CompanyDetail as Detail,
} from "@/lib/actions/crm";
import { STAGES, stageLabel, weightedValue } from "@/lib/crm/pipeline";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { eur, timeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";

const STATUS_LABEL: Record<string, string> = { lead: "Lead", active: "Active", customer: "Customer", at_risk: "At risk", lost: "Lost" };
const INFLUENCE: Record<string, { label: string; stars: number }> = {
  decision_maker: { label: "Decision maker", stars: 5 },
  technical: { label: "Technical decision", stars: 5 },
  influencer: { label: "Influencer", stars: 4 },
  finance: { label: "Payment decision", stars: 2 },
  none: { label: "Contact", stars: 0 },
};
const AI_ACTIONS = ["Analyze website", "Find decision makers", "Score lead", "Write outreach", "Find competitors", "Prepare strategy"];

export function CompanyDetail({ id }: { id: number }) {
  const [d, setD] = useState<Detail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [busy, setBusy] = useState(false);

  const [contact, setContact] = useState({ name: "", role: "", email: "", phone: "", department: "", influence: "none" });
  const [deal, setDeal] = useState({ title: "", value: "", stage: "new", expectedClose: "" });
  const [note, setNote] = useState({ type: "note", summary: "" });

  async function load() {
    const res = await getCompanyAction(id).catch(() => null);
    if (!res) setNotFound(true);
    else setD(res);
    setLoading(false);
  }
  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function run(fn: () => Promise<{ error?: string } | void>) {
    setBusy(true);
    const res = await fn();
    setBusy(false);
    if (res && "error" in res && res.error) return;
    await load();
  }

  if (loading) return <div className="grid min-h-[50vh] place-items-center"><Loader2 className="animate-spin text-muted-foreground" /></div>;
  if (notFound || !d) return <p className="py-16 text-center text-sm text-muted-foreground">Company not found. <Link href="/companies" className="text-electric">Back</Link></p>;

  const c = d.company;

  return (
    <div className="space-y-5">
      <Link href="/companies" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft size={15} /> Companies
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">{c.name}</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {[c.industry, c.city, c.employees ? `${c.employees} employees` : "", c.website].filter(Boolean).join(" · ") || "—"}
          </p>
        </div>
        <Select
          value={c.status}
          onChange={(e) =>
            run(() =>
              updateCompanyAction(c.id, {
                name: c.name,
                industry: c.industry,
                city: c.city,
                website: c.website,
                employees: c.employees,
                annualValue: c.annualValue,
                status: e.target.value,
                accountManager: c.accountManager,
                industryMatch: c.industryMatch,
              })
            )
          }
          className="h-9 w-auto"
        >
          {Object.entries(STATUS_LABEL).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="glass rounded-xl p-3"><p className="text-lg font-semibold">{d.contacts.length}</p><p className="text-[11px] text-muted-foreground">Contacts</p></div>
        <div className="glass rounded-xl p-3"><p className="text-lg font-semibold">{d.deals.length}</p><p className="text-[11px] text-muted-foreground">Deals</p></div>
        <div className="glass rounded-xl p-3"><p className="text-lg font-semibold">{eur(d.summary.open)}</p><p className="text-[11px] text-muted-foreground">Open pipeline</p></div>
        <div className="glass rounded-xl p-3"><p className="text-lg font-semibold text-emerald">{eur(d.summary.won)}</p><p className="text-[11px] text-muted-foreground">Won</p></div>
      </div>

      {/* AI actions — Soon */}
      <div className="glass-strong rounded-2xl border border-royal/30 bg-royal/5 p-4">
        <p className="flex items-center gap-2 text-sm font-semibold text-royal"><Sparkles size={15} /> AI actions <span className="rounded bg-secondary px-1.5 py-0.5 text-[9px] font-semibold uppercase text-muted-foreground">soon</span></p>
        <p className="mt-1 text-xs text-muted-foreground">These will call your Sajtpress agents (Crawl, Sales, Email) once the integration is connected.</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {AI_ACTIONS.map((a) => (
            <span key={a} className="cursor-default rounded-lg border border-border bg-card/60 px-2.5 py-1 text-xs text-muted-foreground opacity-70">{a}</span>
          ))}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Contacts */}
        <div className="glass rounded-2xl p-4">
          <p className="flex items-center gap-2 text-sm font-semibold"><Users size={15} className="text-electric" /> Contacts</p>
          <div className="mt-3 space-y-2">
            {d.contacts.map((ct) => {
              const inf = INFLUENCE[ct.influence] ?? INFLUENCE.none;
              return (
                <div key={ct.id} className="flex items-start justify-between gap-2 rounded-lg border border-border/60 p-2.5">
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{ct.name} {ct.role && <span className="text-xs text-muted-foreground">· {ct.role}</span>}</p>
                    <p className="text-[11px] text-muted-foreground">{[ct.email, ct.phone].filter(Boolean).join(" · ") || "—"}</p>
                    <p className="mt-0.5 text-[11px] text-warning">{"★".repeat(inf.stars)}<span className="text-muted-foreground"> {inf.label}</span></p>
                  </div>
                  <button onClick={() => run(() => deleteContactAction(ct.id, c.id))} className="text-muted-foreground hover:text-danger"><Trash2 size={13} /></button>
                </div>
              );
            })}
            {d.contacts.length === 0 && <p className="text-xs text-muted-foreground">No contacts yet.</p>}
          </div>
          <div className="mt-3 space-y-2 border-t border-border pt-3">
            <div className="grid grid-cols-2 gap-2">
              <Input placeholder="Name *" value={contact.name} onChange={(e) => setContact({ ...contact, name: e.target.value })} className="h-9" />
              <Input placeholder="Role" value={contact.role} onChange={(e) => setContact({ ...contact, role: e.target.value })} className="h-9" />
              <Input placeholder="Email" value={contact.email} onChange={(e) => setContact({ ...contact, email: e.target.value })} className="h-9" />
              <Input placeholder="Phone" value={contact.phone} onChange={(e) => setContact({ ...contact, phone: e.target.value })} className="h-9" />
              <Select value={contact.influence} onChange={(e) => setContact({ ...contact, influence: e.target.value })} className="h-9">
                {Object.entries(INFLUENCE).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </Select>
              <Button size="sm" disabled={busy || !contact.name.trim()} onClick={() => run(async () => { const r = await addContactAction(c.id, contact); if (!r.error) setContact({ name: "", role: "", email: "", phone: "", department: "", influence: "none" }); return r; })}>
                <Plus size={13} /> Add
              </Button>
            </div>
          </div>
        </div>

        {/* Deals */}
        <div className="glass rounded-2xl p-4">
          <p className="flex items-center gap-2 text-sm font-semibold"><Handshake size={15} className="text-emerald" /> Deals</p>
          <div className="mt-3 space-y-2">
            {d.deals.map((dl) => (
              <div key={dl.id} className="rounded-lg border border-border/60 p-2.5">
                <div className="flex items-center justify-between gap-2">
                  <p className="min-w-0 truncate text-sm font-medium">{dl.title}</p>
                  <button onClick={() => run(() => deleteDealAction(dl.id, c.id))} className="shrink-0 text-muted-foreground hover:text-danger"><Trash2 size={13} /></button>
                </div>
                <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs">
                  <span className="font-semibold">{eur(dl.value)}</span>
                  <span className="text-muted-foreground">weighted {eur(weightedValue(dl))}</span>
                  <Select value={dl.stage} onChange={(e) => run(() => updateDealStageAction(dl.id, e.target.value))} className="ml-auto h-7 w-auto text-[11px]">
                    {STAGES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
                  </Select>
                </div>
              </div>
            ))}
            {d.deals.length === 0 && <p className="text-xs text-muted-foreground">No deals yet.</p>}
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 border-t border-border pt-3">
            <Input placeholder="Deal title *" value={deal.title} onChange={(e) => setDeal({ ...deal, title: e.target.value })} className="col-span-2 h-9" />
            <Input type="number" placeholder="Value (€)" value={deal.value} onChange={(e) => setDeal({ ...deal, value: e.target.value })} className="h-9" />
            <Select value={deal.stage} onChange={(e) => setDeal({ ...deal, stage: e.target.value })} className="h-9">
              {STAGES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
            </Select>
            <Input type="date" value={deal.expectedClose} onChange={(e) => setDeal({ ...deal, expectedClose: e.target.value })} className="h-9" />
            <Button size="sm" disabled={busy || !deal.title.trim()} onClick={() => run(async () => { const r = await createDealAction(c.id, { title: deal.title, value: deal.value ? Number(deal.value) : 0, stage: deal.stage, expectedClose: deal.expectedClose || null }); if (!r.error) setDeal({ title: "", value: "", stage: "new", expectedClose: "" }); return r; })}>
              <Plus size={13} /> Add deal
            </Button>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="glass rounded-2xl p-4">
        <p className="flex items-center gap-2 text-sm font-semibold"><ActivityIcon size={15} className="text-royal" /> Timeline</p>
        <div className="mt-3 flex gap-2">
          <Select value={note.type} onChange={(e) => setNote({ ...note, type: e.target.value })} className="h-9 w-28 shrink-0">
            {["note", "call", "email", "meeting", "quote"].map((t) => <option key={t} value={t}>{t}</option>)}
          </Select>
          <Input placeholder="What happened?" value={note.summary} onChange={(e) => setNote({ ...note, summary: e.target.value })} className="h-9" />
          <Button size="sm" disabled={busy || !note.summary.trim()} onClick={() => run(async () => { const r = await addActivityAction({ companyId: c.id, type: note.type, summary: note.summary }); if (!r.error) setNote({ type: "note", summary: "" }); return r; })}>
            <Plus size={13} /> Log
          </Button>
        </div>
        <div className="mt-3 space-y-2">
          {d.activities.map((a) => (
            <div key={a.id} className="flex items-start gap-2 text-sm">
              <span className="mt-0.5 shrink-0 rounded bg-secondary px-1.5 py-0.5 text-[10px] uppercase text-muted-foreground">{a.type}</span>
              <span className="flex-1">{a.summary}</span>
              <span className="shrink-0 text-[11px] text-muted-foreground">{timeAgo(a.createdAt)}</span>
            </div>
          ))}
          {d.activities.length === 0 && <p className="text-xs text-muted-foreground">No activity logged yet.</p>}
        </div>
      </div>
    </div>
  );
}
