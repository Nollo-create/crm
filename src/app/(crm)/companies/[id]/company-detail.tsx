"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Sparkles,
  Users,
  Handshake,
  Activity as ActivityIcon,
  Mail,
  Phone,
  Globe,
  Compass,
  HeartPulse,
  X,
} from "lucide-react";
import {
  getCompanyAction,
  updateCompanyAction,
  deleteCompanyAction,
  addContactAction,
  deleteContactAction,
  createDealAction,
  updateDealStageAction,
  deleteDealAction,
  addActivityAction,
  type CompanyDetail as Detail,
} from "@/lib/actions/crm";
import { STAGES, stageLabel, weightedValue, leadScore } from "@/lib/crm/pipeline";
import { Card } from "@/components/ui/card";
import { Badge, type Tone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { eur, timeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";

const STATUS_LABEL: Record<string, string> = { lead: "Lead", active: "Active", customer: "Customer", at_risk: "At risk", lost: "Lost" };
const STATUS_TONE: Record<string, Tone> = { lead: "warning", active: "electric", customer: "emerald", at_risk: "danger", lost: "neutral" };
const INFLUENCE: Record<string, { label: string; stars: number }> = {
  decision_maker: { label: "Decision maker", stars: 5 },
  technical: { label: "Technical decision", stars: 5 },
  influencer: { label: "Influencer", stars: 4 },
  finance: { label: "Payment decision", stars: 2 },
  none: { label: "Contact", stars: 0 },
};
type Tab = "overview" | "contacts" | "deals" | "timeline";

function accountHealth(d: Detail): { tone: Tone; label: string; reason: string } {
  const last = d.activities[0]?.createdAt;
  const days = last ? Math.floor((Date.now() - new Date(last).getTime()) / 86_400_000) : Infinity;
  if (days === Infinity) return { tone: "neutral", label: "New", reason: "No activity logged yet." };
  if (days > 30) return { tone: "danger", label: "At risk", reason: `No activity for ${days} days.` };
  if (d.summary.open > 0 || d.summary.won > 0)
    return days <= 14
      ? { tone: "emerald", label: "Healthy", reason: "Active, with pipeline in play." }
      : { tone: "warning", label: "Attention", reason: `Last activity ${days} days ago.` };
  return { tone: "warning", label: "Attention", reason: "Engaged, but no open pipeline." };
}

export function CompanyDetail({ id }: { id: number }) {
  const [d, setD] = useState<Detail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState<Tab>("overview");
  const [addC, setAddC] = useState(false);
  const [addD, setAddD] = useState(false);

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

  if (loading)
    return (
      <div className="space-y-4">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-24 w-full" />
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  if (notFound || !d)
    return (
      <p className="py-16 text-center text-sm text-muted-foreground">
        Company not found.{" "}
        <Link href="/companies" className="text-electric">
          Back
        </Link>
      </p>
    );

  const c = d.company;
  const health = accountHealth(d);
  const sc = leadScore({ hasWebsite: !!c.website, employees: c.employees, industryMatch: c.industryMatch, annualValue: c.annualValue });
  const primaryEmail = d.contacts.find((x) => x.email)?.email;
  const primaryPhone = d.contacts.find((x) => x.phone)?.phone;
  const keyContacts = d.contacts.filter((x) => (INFLUENCE[x.influence]?.stars ?? 0) >= 4).slice(0, 4);

  const tabs: { id: Tab; label: string; n?: number }[] = [
    { id: "overview", label: "Overview" },
    { id: "contacts", label: "Contacts", n: d.contacts.length },
    { id: "deals", label: "Deals", n: d.deals.length },
    { id: "timeline", label: "Timeline", n: d.activities.length },
  ];

  return (
    <div className="space-y-4">
      <Link href="/companies" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft size={15} /> Companies
      </Link>

      {/* Header */}
      <Card className="p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-secondary text-sm font-bold text-muted-foreground">
              {c.name.slice(0, 2).toUpperCase()}
            </span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="truncate text-lg font-semibold tracking-tight">{c.name}</h1>
                <Badge tone={STATUS_TONE[c.status] ?? "neutral"}>{STATUS_LABEL[c.status] ?? c.status}</Badge>
                <Badge tone={sc >= 75 ? "emerald" : sc >= 50 ? "warning" : "neutral"}>Score {sc}</Badge>
                <Badge tone={health.tone}>
                  <HeartPulse size={11} /> {health.label}
                </Badge>
              </div>
              <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
                {c.industry && <span>{c.industry}</span>}
                {c.city && <span>· {c.city}</span>}
                {c.employees ? <span>· {c.employees} employees</span> : null}
                {c.website && (
                  <a href={c.website.startsWith("http") ? c.website : `https://${c.website}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-electric hover:underline">
                    <Globe size={11} /> {c.website}
                  </a>
                )}
                {c.accountManager && <span>· Owner {c.accountManager}</span>}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <Button size="sm" variant="outline" onClick={() => { setTab("deals"); setAddD(true); }}>
              <Plus size={14} /> Deal
            </Button>
            <a href={primaryEmail ? `mailto:${primaryEmail}` : undefined} className={cn(!primaryEmail && "pointer-events-none opacity-40")}>
              <Button size="icon" variant="ghost" title="Email primary contact"><Mail size={15} /></Button>
            </a>
            <a href={primaryPhone ? `tel:${primaryPhone}` : undefined} className={cn(!primaryPhone && "pointer-events-none opacity-40")}>
              <Button size="icon" variant="ghost" title="Call primary contact"><Phone size={15} /></Button>
            </a>
            <Button size="sm" variant="ghost" className="text-royal opacity-70" title="AI analysis — soon" disabled>
              <Sparkles size={14} /> Analyze
            </Button>
            <Select
              value={c.status}
              onChange={(e) =>
                run(() =>
                  updateCompanyAction(c.id, {
                    name: c.name, industry: c.industry, city: c.city, website: c.website,
                    employees: c.employees, annualValue: c.annualValue, status: e.target.value,
                    accountManager: c.accountManager, industryMatch: c.industryMatch,
                  })
                )
              }
              className="h-8 w-auto text-xs"
            >
              {Object.entries(STATUS_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </Select>
            <Button
              size="icon"
              variant="ghost"
              className="text-muted-foreground hover:text-danger"
              title="Delete company"
              onClick={() => {
                if (typeof window !== "undefined" && window.confirm(`Delete ${c.name} and all its records?`))
                  deleteCompanyAction(c.id).then((r) => {
                    if (r?.error) window.alert(r.error);
                    else window.location.href = "/companies";
                  });
              }}
            >
              <Trash2 size={15} />
            </Button>
          </div>
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
        {/* Main */}
        <div className="space-y-4">
          <div className="flex gap-1 border-b border-border">
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={cn(
                  "-mb-px flex items-center gap-1.5 border-b-2 px-3 py-2 text-sm transition-colors",
                  tab === t.id ? "border-electric font-medium text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                {t.label}
                {t.n != null && t.n > 0 && <span className="rounded bg-secondary px-1.5 text-2xs text-muted-foreground">{t.n}</span>}
              </button>
            ))}
          </div>

          {tab === "overview" && (
            <Card className="p-4 sm:p-5">
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <Metric label="Contacts" value={String(d.contacts.length)} />
                <Metric label="Deals" value={String(d.deals.length)} />
                <Metric label="Open pipeline" value={eur(d.summary.open)} />
                <Metric label="Won" value={eur(d.summary.won)} tone="text-emerald" />
              </div>
              <div className="mt-4 grid grid-cols-1 gap-x-6 gap-y-2 border-t border-border pt-4 text-sm sm:grid-cols-2">
                <Fact label="Industry" value={c.industry || "—"} />
                <Fact label="Location" value={c.city || "—"} />
                <Fact label="Employees" value={c.employees ? String(c.employees) : "—"} />
                <Fact label="Annual value" value={c.annualValue ? eur(c.annualValue) : "—"} />
                <Fact label="Account manager" value={c.accountManager || "—"} />
                <Fact label="Industry fit" value={c.industryMatch ? "Yes" : "No"} />
              </div>
            </Card>
          )}

          {tab === "contacts" && (
            <Card className="p-4 sm:p-5">
              <SectionHead title="Contacts" Icon={Users} onAdd={() => setAddC((v) => !v)} adding={addC} />
              {addC && (
                <div className="mt-3 grid grid-cols-2 gap-2 rounded-lg border border-border bg-secondary/30 p-3">
                  <Input placeholder="Name *" value={contact.name} onChange={(e) => setContact({ ...contact, name: e.target.value })} className="h-9" />
                  <Input placeholder="Role" value={contact.role} onChange={(e) => setContact({ ...contact, role: e.target.value })} className="h-9" />
                  <Input placeholder="Email" value={contact.email} onChange={(e) => setContact({ ...contact, email: e.target.value })} className="h-9" />
                  <Input placeholder="Phone" value={contact.phone} onChange={(e) => setContact({ ...contact, phone: e.target.value })} className="h-9" />
                  <Select value={contact.influence} onChange={(e) => setContact({ ...contact, influence: e.target.value })} className="h-9">
                    {Object.entries(INFLUENCE).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </Select>
                  <Button size="sm" disabled={busy || !contact.name.trim()} onClick={() => run(async () => { const r = await addContactAction(c.id, contact); if (!r.error) { setContact({ name: "", role: "", email: "", phone: "", department: "", influence: "none" }); setAddC(false); } return r; })}>
                    <Plus size={13} /> Add
                  </Button>
                </div>
              )}
              <div className="mt-3 space-y-2">
                {d.contacts.map((ct) => {
                  const inf = INFLUENCE[ct.influence] ?? INFLUENCE.none;
                  return (
                    <div key={ct.id} className="flex items-start justify-between gap-2 rounded-lg border border-border p-2.5">
                      <div className="min-w-0">
                        <p className="text-sm font-medium">{ct.name} {ct.role && <span className="text-xs font-normal text-muted-foreground">· {ct.role}</span>}</p>
                        <p className="truncate text-2xs text-muted-foreground">{[ct.email, ct.phone].filter(Boolean).join(" · ") || "—"}</p>
                        {inf.stars > 0 && <p className="mt-0.5 text-2xs text-warning">{"★".repeat(inf.stars)}<span className="text-muted-foreground"> {inf.label}</span></p>}
                      </div>
                      <button onClick={() => run(() => deleteContactAction(ct.id, c.id))} className="text-muted-foreground hover:text-danger"><Trash2 size={13} /></button>
                    </div>
                  );
                })}
                {d.contacts.length === 0 && !addC && <Empty text="No contacts yet." />}
              </div>
            </Card>
          )}

          {tab === "deals" && (
            <Card className="p-4 sm:p-5">
              <SectionHead title="Deals" Icon={Handshake} onAdd={() => setAddD((v) => !v)} adding={addD} />
              {addD && (
                <div className="mt-3 grid grid-cols-2 gap-2 rounded-lg border border-border bg-secondary/30 p-3">
                  <Input placeholder="Deal title *" value={deal.title} onChange={(e) => setDeal({ ...deal, title: e.target.value })} className="col-span-2 h-9" />
                  <Input type="number" placeholder="Value (€)" value={deal.value} onChange={(e) => setDeal({ ...deal, value: e.target.value })} className="h-9" />
                  <Select value={deal.stage} onChange={(e) => setDeal({ ...deal, stage: e.target.value })} className="h-9">
                    {STAGES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
                  </Select>
                  <Input type="date" value={deal.expectedClose} onChange={(e) => setDeal({ ...deal, expectedClose: e.target.value })} className="h-9" />
                  <Button size="sm" disabled={busy || !deal.title.trim()} onClick={() => run(async () => { const r = await createDealAction(c.id, { title: deal.title, value: deal.value ? Number(deal.value) : 0, stage: deal.stage, expectedClose: deal.expectedClose || null }); if (!r.error) { setDeal({ title: "", value: "", stage: "new", expectedClose: "" }); setAddD(false); } return r; })}>
                    <Plus size={13} /> Add deal
                  </Button>
                </div>
              )}
              <div className="mt-3 space-y-2">
                {d.deals.map((dl) => (
                  <div key={dl.id} className="rounded-lg border border-border p-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <p className="min-w-0 truncate text-sm font-medium">{dl.title}</p>
                      <button onClick={() => run(() => deleteDealAction(dl.id, c.id))} className="shrink-0 text-muted-foreground hover:text-danger"><Trash2 size={13} /></button>
                    </div>
                    <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs">
                      <span className="font-semibold tabular">{eur(dl.value)}</span>
                      <span className="text-muted-foreground">weighted {eur(weightedValue(dl))}</span>
                      <Select value={dl.stage} onChange={(e) => run(() => updateDealStageAction(dl.id, e.target.value))} className="ml-auto h-7 w-auto text-2xs">
                        {STAGES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
                      </Select>
                    </div>
                  </div>
                ))}
                {d.deals.length === 0 && !addD && <Empty text="No deals yet." />}
              </div>
            </Card>
          )}

          {tab === "timeline" && (
            <Card className="p-4 sm:p-5">
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
                {d.activities.length === 0 && <Empty text="No activity logged yet." />}
              </div>
            </Card>
          )}
        </div>

        {/* Context panel */}
        <div className="space-y-4">
          <Card className="p-4">
            <p className="flex items-center gap-2 text-sm font-semibold"><HeartPulse size={15} className={cn(healthClass(health.tone))} /> Account health</p>
            <p className="mt-2 flex items-center gap-2 text-sm">
              <span className={cn("h-2.5 w-2.5 rounded-full", healthDot(health.tone))} />
              <span className="font-medium">{health.label}</span>
            </p>
            <p className="mt-1 text-xs text-muted-foreground">{health.reason}</p>
          </Card>

          <div className="ai-surface p-4">
            <p className="flex items-center gap-2 text-sm font-semibold text-royal"><Compass size={15} /> Next best action</p>
            <p className="mt-2 text-xs text-muted-foreground">AI recommends the next move from this account&apos;s signals — proposal views, buying intent, stakeholder gaps.</p>
            <span className="soon-badge mt-2 inline-block">soon</span>
          </div>

          <div className="ai-surface p-4">
            <p className="flex items-center gap-2 text-sm font-semibold text-royal"><Sparkles size={15} /> AI insights</p>
            <p className="mt-2 text-xs text-muted-foreground">Company analysis, opportunities and a recommended offer, from the Sajtpress Crawl + Sales agents.</p>
            <span className="soon-badge mt-2 inline-block">soon</span>
          </div>

          <Card className="p-4">
            <p className="text-sm font-semibold">Open pipeline</p>
            <p className="mt-1 text-lg font-semibold tabular">{eur(d.summary.open)}</p>
            <p className="text-xs text-muted-foreground">{d.summary.openCount} open · weighted {eur(d.summary.weighted)}</p>
          </Card>

          {keyContacts.length > 0 && (
            <Card className="p-4">
              <p className="text-sm font-semibold">Key contacts</p>
              <div className="mt-2 space-y-2">
                {keyContacts.map((k) => (
                  <div key={k.id} className="text-sm">
                    <p className="font-medium">{k.name}</p>
                    <p className="text-2xs text-muted-foreground">{INFLUENCE[k.influence]?.label}{k.role ? ` · ${k.role}` : ""}</p>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function Metric({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div>
      <p className={cn("text-lg font-semibold tabular", tone)}>{value}</p>
      <p className="text-2xs text-muted-foreground">{label}</p>
    </div>
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
function SectionHead({ title, Icon, onAdd, adding }: { title: string; Icon: typeof Users; onAdd: () => void; adding: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <p className="flex items-center gap-2 text-sm font-semibold"><Icon size={15} className="text-electric" /> {title}</p>
      <Button size="sm" variant="ghost" onClick={onAdd}>
        {adding ? <X size={14} /> : <Plus size={14} />} {adding ? "Close" : "Add"}
      </Button>
    </div>
  );
}
function Empty({ text }: { text: string }) {
  return <p className="rounded-lg border border-dashed border-border py-6 text-center text-xs text-muted-foreground">{text}</p>;
}
function healthClass(t: Tone): string {
  return t === "emerald" ? "text-emerald" : t === "danger" ? "text-danger" : t === "warning" ? "text-warning" : "text-muted-foreground";
}
function healthDot(t: Tone): string {
  return t === "emerald" ? "bg-emerald" : t === "danger" ? "bg-danger" : t === "warning" ? "bg-warning" : "bg-muted-foreground";
}
