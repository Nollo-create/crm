"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Trash2, Pencil, X, Sparkles, ArrowRight, Globe, Mail, Phone, Building2, Gauge } from "lucide-react";
import {
  getLeadAction,
  updateLeadAction,
  deleteLeadAction,
  convertLeadAction,
  setLeadStatusAction,
  type Lead,
} from "@/lib/actions/leads";
import {
  LEAD_STATUSES,
  LEAD_STATUS_LABEL,
  LEAD_SOURCES,
  LEAD_SOURCE_LABEL,
  LEAD_PRIORITIES,
  LEAD_PRIORITY_LABEL,
} from "@/lib/crm/leads";
import { leadScoreBreakdown, STAGES } from "@/lib/crm/pipeline";
import { searchCompaniesAction, type SearchHit } from "@/lib/actions/crm";
import { TagEditor } from "@/components/crm/tag-editor";
import { Card } from "@/components/ui/card";
import { Badge, type Tone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { useCanWrite } from "@/components/crm/role-context";
import { eur } from "@/lib/format";
import { cn } from "@/lib/utils";

const STATUS_TONE: Record<string, Tone> = { new: "electric", working: "warning", qualified: "emerald", unqualified: "neutral", converted: "royal" };
const PRIORITY_TONE: Record<string, Tone> = { high: "danger", normal: "neutral", low: "neutral" };
const OPEN_STATUSES = LEAD_STATUSES.filter((s) => s !== "converted");

type Form = {
  name: string; company: string; title: string; email: string; phone: string; website: string;
  industry: string; employees: string; annualValue: string; source: string; priority: string; owner: string;
  industryMatch: boolean; notes: string;
};

export function LeadDetail({ id }: { id: number }) {
  const { toast } = useToast();
  const canWrite = useCanWrite();
  const [l, setL] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<Form | null>(null);

  // convert dialog
  const [showConvert, setShowConvert] = useState(false);
  const [companyMode, setCompanyMode] = useState<"new" | "existing">("new");
  const [companyPick, setCompanyPick] = useState<{ id: number; name: string } | null>(null);
  const [companyQuery, setCompanyQuery] = useState("");
  const [companyResults, setCompanyResults] = useState<SearchHit[]>([]);
  const [dealOn, setDealOn] = useState(false);
  const [dealForm, setDealForm] = useState({ title: "", value: "", stage: "new" });

  useEffect(() => {
    if (!showConvert || companyMode !== "existing") return;
    const s = companyQuery.trim();
    if (!s) {
      setCompanyResults([]);
      return;
    }
    const t = setTimeout(async () => setCompanyResults(await searchCompaniesAction(s).catch(() => [])), 200);
    return () => clearTimeout(t);
  }, [companyQuery, showConvert, companyMode]);

  async function load() {
    const res = await getLeadAction(id).catch(() => null);
    if (!res) setNotFound(true);
    else setL(res);
    setLoading(false);
  }
  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  function startEdit() {
    if (!l) return;
    setForm({
      name: l.name, company: l.company, title: l.title, email: l.email, phone: l.phone, website: l.website,
      industry: l.industry, employees: l.employees != null ? String(l.employees) : "", annualValue: l.annualValue ? String(l.annualValue) : "",
      source: l.source, priority: l.priority, owner: l.owner, industryMatch: l.industryMatch, notes: l.notes,
    });
    setEditing(true);
  }

  async function save() {
    if (!form) return;
    if (!form.name.trim() && !form.company.trim()) return;
    setBusy(true);
    const r = await updateLeadAction(id, {
      name: form.name, company: form.company, title: form.title, email: form.email, phone: form.phone, website: form.website,
      industry: form.industry, employees: form.employees ? Number(form.employees) : null, annualValue: form.annualValue ? Number(form.annualValue) : 0,
      source: form.source, priority: form.priority, owner: form.owner, industryMatch: form.industryMatch, notes: form.notes,
    });
    setBusy(false);
    if (r.error) return toast(r.error, { tone: "error" });
    toast("Lead updated", { tone: "success" });
    setEditing(false);
    await load();
  }

  async function changeStatus(next: string) {
    if (!l) return;
    setL({ ...l, status: next });
    const r = await setLeadStatusAction(id, next);
    if (r.error) {
      toast(r.error, { tone: "error" });
      await load();
    }
  }

  async function convert() {
    setBusy(true);
    const companyId = companyMode === "existing" ? companyPick?.id ?? null : null;
    const deal = dealOn && dealForm.title.trim() ? { title: dealForm.title, value: dealForm.value ? Number(dealForm.value) : 0, stage: dealForm.stage } : null;
    const r = await convertLeadAction(id, { companyId, deal });
    setBusy(false);
    if (r.error) return toast(r.error, { tone: "error" });
    toast(r.createdCompany ? "Converted to a new company" : "Converted into the company", { tone: "success" });
    if (r.companyId && typeof window !== "undefined") window.location.href = `/companies/${r.companyId}`;
    else await load();
  }

  async function remove() {
    if (typeof window !== "undefined" && !window.confirm(`Delete lead ${l?.name || l?.company}?`)) return;
    await deleteLeadAction(id);
    if (typeof window !== "undefined") window.location.href = "/leads";
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
  if (notFound || !l)
    return (
      <p className="py-16 text-center text-sm text-muted-foreground">
        Lead not found.{" "}
        <Link href="/leads" className="text-electric">Back</Link>
      </p>
    );

  const converted = l.status === "converted";
  const title = l.name || l.company || "Lead";
  const breakdown = leadScoreBreakdown({ hasWebsite: !!l.website, employees: l.employees, industryMatch: l.industryMatch, annualValue: l.annualValue });

  return (
    <div className="space-y-4">
      <Link href="/leads" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft size={15} /> Leads
      </Link>

      {/* Header */}
      <Card className="p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <span className={cn("grid h-11 w-11 shrink-0 place-items-center rounded-xl text-sm font-bold", l.score >= 75 ? "bg-emerald/15 text-emerald" : l.score >= 50 ? "bg-warning/15 text-warning" : "bg-secondary text-muted-foreground")}>
              {l.score}
            </span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="truncate text-lg font-semibold tracking-tight">{title}</h1>
                <Badge tone={STATUS_TONE[l.status] ?? "neutral"}>{LEAD_STATUS_LABEL[l.status as keyof typeof LEAD_STATUS_LABEL] ?? l.status}</Badge>
                {l.priority !== "normal" && <Badge tone={PRIORITY_TONE[l.priority] ?? "neutral"}>{LEAD_PRIORITY_LABEL[l.priority as keyof typeof LEAD_PRIORITY_LABEL] ?? l.priority} priority</Badge>}
              </div>
              <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
                {l.title && <span>{l.title}</span>}
                {l.company && l.name && <span>· {l.company}</span>}
                <span>· {LEAD_SOURCE_LABEL[l.source as keyof typeof LEAD_SOURCE_LABEL] ?? l.source}</span>
                {l.owner && <span>· Owner {l.owner}</span>}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <a href={l.email ? `mailto:${l.email}` : undefined} className={cn(!l.email && "pointer-events-none opacity-40")}>
              <Button size="icon" variant="ghost" title="Email"><Mail size={15} /></Button>
            </a>
            {canWrite && !converted && (
              <>
                <Select value={l.status} onChange={(e) => changeStatus(e.target.value)} className="h-8 w-auto text-xs">
                  {OPEN_STATUSES.map((s) => <option key={s} value={s}>{LEAD_STATUS_LABEL[s]}</option>)}
                </Select>
                <Button size="sm" variant="outline" onClick={editing ? () => setEditing(false) : startEdit}>
                  {editing ? <X size={14} /> : <Pencil size={14} />} {editing ? "Cancel" : "Edit"}
                </Button>
              </>
            )}
            {canWrite && <Button size="icon" variant="ghost" className="text-muted-foreground hover:text-danger" title="Delete lead" onClick={remove}><Trash2 size={15} /></Button>}
          </div>
        </div>
      </Card>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-2xs font-medium uppercase tracking-wide text-muted-foreground">Tags</span>
        <TagEditor entityType="lead" entityId={id} />
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        {/* Main */}
        <div className="space-y-4">
          <Card className="p-4 sm:p-5">
            <p className="text-sm font-semibold">Lead information</p>
            {editing && form ? (
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                <LabeledInput label="Contact name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
                <LabeledInput label="Company" value={form.company} onChange={(v) => setForm({ ...form, company: v })} />
                <LabeledInput label="Title" value={form.title} onChange={(v) => setForm({ ...form, title: v })} />
                <LabeledInput label="Owner" value={form.owner} onChange={(v) => setForm({ ...form, owner: v })} />
                <LabeledInput label="Email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} />
                <LabeledInput label="Phone" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} />
                <LabeledInput label="Website" value={form.website} onChange={(v) => setForm({ ...form, website: v })} />
                <LabeledInput label="Industry" value={form.industry} onChange={(v) => setForm({ ...form, industry: v })} />
                <LabeledInput label="Employees" value={form.employees} onChange={(v) => setForm({ ...form, employees: v })} type="number" />
                <LabeledInput label="Est. annual value (€)" value={form.annualValue} onChange={(v) => setForm({ ...form, annualValue: v })} type="number" />
                <label className="block text-2xs uppercase tracking-wide text-muted-foreground">
                  Source
                  <Select value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })} className="mt-1 h-9">
                    {LEAD_SOURCES.map((s) => <option key={s} value={s}>{LEAD_SOURCE_LABEL[s]}</option>)}
                  </Select>
                </label>
                <label className="block text-2xs uppercase tracking-wide text-muted-foreground">
                  Priority
                  <Select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} className="mt-1 h-9">
                    {LEAD_PRIORITIES.map((p) => <option key={p} value={p}>{LEAD_PRIORITY_LABEL[p]}</option>)}
                  </Select>
                </label>
                <label className="flex items-center gap-2 text-sm text-muted-foreground sm:col-span-2">
                  <input type="checkbox" checked={form.industryMatch} onChange={(e) => setForm({ ...form, industryMatch: e.target.checked })} className="h-4 w-4 accent-electric" /> Industry fit
                </label>
                <label className="block text-2xs uppercase tracking-wide text-muted-foreground sm:col-span-2">
                  Notes
                  <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="mt-1 min-h-[80px] w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-electric" />
                </label>
                <div className="flex justify-end gap-2 sm:col-span-2">
                  <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>Cancel</Button>
                  <Button size="sm" onClick={save} disabled={busy || (!form.name.trim() && !form.company.trim())}>Save</Button>
                </div>
              </div>
            ) : (
              <>
                <div className="mt-3 grid grid-cols-1 gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
                  <Fact label="Company" value={l.company || "—"} />
                  <Fact label="Contact" value={l.name || "—"} />
                  <Fact label="Title" value={l.title || "—"} />
                  <Fact label="Industry" value={l.industry || "—"} />
                  <Fact label="Employees" value={l.employees != null ? String(l.employees) : "—"} />
                  <Fact label="Est. annual value" value={l.annualValue ? eur(l.annualValue) : "—"} />
                  <FactLink label="Email" value={l.email} href={l.email ? `mailto:${l.email}` : undefined} Icon={Mail} />
                  <FactLink label="Phone" value={l.phone} href={l.phone ? `tel:${l.phone}` : undefined} Icon={Phone} />
                  <FactLink label="Website" value={l.website} href={l.website ? (l.website.startsWith("http") ? l.website : `https://${l.website}`) : undefined} Icon={Globe} external />
                </div>
                {l.notes && <p className="mt-3 whitespace-pre-wrap border-t border-border pt-3 text-sm text-muted-foreground">{l.notes}</p>}
              </>
            )}
          </Card>

          {/* Score breakdown */}
          <Card className="p-4 sm:p-5">
            <p className="flex items-center gap-2 text-sm font-semibold"><Gauge size={15} className="text-electric" /> Lead score — {breakdown.total}</p>
            <div className="mt-3 space-y-1.5">
              {breakdown.factors.map((f, i) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{f.label}</span>
                  <span className="font-medium tabular">+{f.points}</span>
                </div>
              ))}
            </div>
            <p className="mt-3 border-t border-border pt-2 text-2xs text-muted-foreground">Rule-based today; an AI scorer can refine this later without changing the model.</p>
          </Card>
        </div>

        {/* Context panel */}
        <div className="space-y-4">
          <Card className="p-4">
            <p className="text-sm font-semibold">Conversion</p>
            {converted ? (
              <div className="mt-2">
                <Badge tone="royal">Converted</Badge>
                {l.convertedCompanyId && (
                  <Link href={`/companies/${l.convertedCompanyId}`} className="mt-2 block text-xs text-electric hover:underline">Open the company →</Link>
                )}
              </div>
            ) : !canWrite ? null : !showConvert ? (
              <>
                <p className="mt-1 text-xs text-muted-foreground">Turn this qualified lead into a company (and a contact), optionally with a deal.</p>
                <Button size="sm" className="mt-2 w-full" onClick={() => setShowConvert(true)}>
                  <Sparkles size={13} /> Convert lead
                </Button>
              </>
            ) : (
              <div className="mt-2 space-y-2.5">
                <div className="flex gap-1 rounded-lg bg-secondary p-0.5 text-xs">
                  {(["new", "existing"] as const).map((m) => (
                    <button key={m} onClick={() => setCompanyMode(m)} className={cn("flex-1 rounded-md px-2 py-1 transition-colors", companyMode === m ? "bg-card font-medium text-foreground" : "text-muted-foreground")}>
                      {m === "new" ? "New company" : "Existing company"}
                    </button>
                  ))}
                </div>

                {companyMode === "existing" &&
                  (companyPick ? (
                    <div className="flex items-center justify-between gap-2 rounded-lg border border-border bg-secondary/40 px-2.5 py-1.5 text-sm">
                      <span className="truncate"><Building2 size={12} className="mr-1 inline text-muted-foreground" />{companyPick.name}</span>
                      <button onClick={() => { setCompanyPick(null); setCompanyQuery(""); }} className="text-muted-foreground hover:text-foreground"><X size={13} /></button>
                    </div>
                  ) : (
                    <div className="relative">
                      <Input placeholder="Search companies…" value={companyQuery} onChange={(e) => setCompanyQuery(e.target.value)} className="h-9" />
                      {companyResults.length > 0 && (
                        <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-lg border border-border bg-popover shadow-pop">
                          {companyResults.map((cc) => (
                            <button key={cc.id} onClick={() => { setCompanyPick({ id: cc.id, name: cc.name }); setCompanyResults([]); }} className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-secondary">
                              <Building2 size={13} className="shrink-0 text-muted-foreground" /><span className="flex-1 truncate">{cc.name}</span>{cc.city && <span className="text-2xs text-muted-foreground">{cc.city}</span>}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}

                <label className="flex items-center gap-2 text-xs text-muted-foreground">
                  <input type="checkbox" checked={dealOn} onChange={(e) => setDealOn(e.target.checked)} className="h-3.5 w-3.5 accent-electric" /> Also create a deal
                </label>
                {dealOn && (
                  <div className="space-y-2">
                    <Input placeholder="Deal title" value={dealForm.title} onChange={(e) => setDealForm({ ...dealForm, title: e.target.value })} className="h-9" />
                    <div className="flex gap-2">
                      <Input type="number" placeholder="Value (€)" value={dealForm.value} onChange={(e) => setDealForm({ ...dealForm, value: e.target.value })} className="h-9" />
                      <Select value={dealForm.stage} onChange={(e) => setDealForm({ ...dealForm, stage: e.target.value })} className="h-9 w-auto">
                        {STAGES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
                      </Select>
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button size="sm" variant="ghost" onClick={() => setShowConvert(false)}>Cancel</Button>
                  <Button size="sm" className="flex-1" onClick={convert} disabled={busy || (companyMode === "existing" && !companyPick) || (dealOn && !dealForm.title.trim())}>
                    <ArrowRight size={13} /> Convert
                  </Button>
                </div>
              </div>
            )}
          </Card>

          <Card className="p-4">
            <p className="text-sm font-semibold">Details</p>
            <div className="mt-2 space-y-1.5 text-sm">
              <Fact label="Source" value={LEAD_SOURCE_LABEL[l.source as keyof typeof LEAD_SOURCE_LABEL] ?? l.source} />
              <Fact label="Priority" value={LEAD_PRIORITY_LABEL[l.priority as keyof typeof LEAD_PRIORITY_LABEL] ?? l.priority} />
              <Fact label="Owner" value={l.owner || "—"} />
              <Fact label="Industry fit" value={l.industryMatch ? "Yes" : "No"} />
            </div>
          </Card>
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
function FactLink({ label, value, href, Icon, external }: { label: string; value: string; href?: string; Icon: typeof Mail; external?: boolean }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="inline-flex items-center gap-1 text-muted-foreground"><Icon size={12} /> {label}</span>
      {value ? (
        href ? (
          <a href={href} target={external ? "_blank" : undefined} rel={external ? "noreferrer" : undefined} className="truncate text-right text-electric hover:underline">{value}</a>
        ) : (
          <span className="text-right font-medium">{value}</span>
        )
      ) : (
        <span className="text-right text-muted-foreground">—</span>
      )}
    </div>
  );
}
