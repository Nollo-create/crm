"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowUpRight, Globe, HeartPulse, Handshake, Users, Activity as ActivityIcon, Plus, Loader2, Mail, Phone } from "lucide-react";
import { getCompanyAction, updateCompanyAction, addActivityAction, type CompanyDetail } from "@/lib/actions/crm";
import { weightedValue, leadScore } from "@/lib/crm/pipeline";
import { Drawer, DrawerHeader, DrawerBody, DrawerFooter } from "@/components/ui/drawer";
import { Badge, type Tone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
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

function health(d: CompanyDetail): { tone: Tone; label: string; reason: string } {
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
const dot = (t: Tone) => (t === "emerald" ? "bg-emerald" : t === "danger" ? "bg-danger" : t === "warning" ? "bg-warning" : "bg-muted-foreground");

/**
 * Peek panel for a company row. Shows the essentials and a couple of quick
 * actions (status, log activity) without leaving the table; the footer opens
 * the full profile. `onChanged` lets the table refresh after an edit here.
 */
export function CompanyDrawer({ id, onClose, onChanged }: { id: number | null; onClose: () => void; onChanged?: () => void }) {
  const router = useRouter();
  const { toast } = useToast();
  const [d, setD] = useState<CompanyDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");

  useEffect(() => {
    if (id == null) return;
    setD(null);
    setNote("");
    setLoading(true);
    getCompanyAction(id)
      .then((res) => setD(res))
      .catch(() => setD(null))
      .finally(() => setLoading(false));
  }, [id]);

  async function reload() {
    if (id == null) return;
    setD(await getCompanyAction(id).catch(() => null));
    onChanged?.();
  }

  async function setStatus(status: string) {
    if (!d) return;
    const c = d.company;
    setBusy(true);
    await updateCompanyAction(c.id, {
      name: c.name, industry: c.industry, city: c.city, website: c.website,
      employees: c.employees, annualValue: c.annualValue, status,
      accountManager: c.accountManager, industryMatch: c.industryMatch,
    });
    setBusy(false);
    toast(`${c.name} set to ${STATUS_LABEL[status] ?? status}`, { tone: "success" });
    await reload();
  }
  async function logNote() {
    if (!d || !note.trim()) return;
    setBusy(true);
    const r = await addActivityAction({ companyId: d.company.id, type: "note", summary: note });
    setBusy(false);
    if (r.error) {
      toast(r.error, { tone: "error" });
      return;
    }
    toast("Activity logged", { tone: "success" });
    setNote("");
    await reload();
  }

  const c = d?.company;
  const sc = c ? leadScore({ hasWebsite: !!c.website, employees: c.employees, industryMatch: c.industryMatch, annualValue: c.annualValue }) : 0;
  const h = d ? health(d) : null;
  const openDeals = d ? d.deals.filter((x) => x.stage !== "won" && x.stage !== "lost") : [];
  const keyContacts = d ? d.contacts.slice().sort((a, b) => (INFLUENCE[b.influence]?.stars ?? 0) - (INFLUENCE[a.influence]?.stars ?? 0)).slice(0, 4) : [];
  const primaryEmail = d?.contacts.find((x) => x.email)?.email;
  const primaryPhone = d?.contacts.find((x) => x.phone)?.phone;

  return (
    <Drawer open={id != null} onClose={onClose} width="lg">
      {loading || !d || !c || !h ? (
        <div className="space-y-4 p-4">
          <Skeleton className="h-12 w-2/3" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      ) : (
        <>
          <DrawerHeader onClose={onClose}>
            <div className="flex items-start gap-3">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-secondary text-sm font-bold text-muted-foreground">
                {c.name.slice(0, 2).toUpperCase()}
              </span>
              <div className="min-w-0">
                <h2 className="truncate text-base font-semibold tracking-tight">{c.name}</h2>
                <p className="mt-0.5 flex flex-wrap items-center gap-x-1.5 text-xs text-muted-foreground">
                  {c.industry && <span>{c.industry}</span>}
                  {c.city && <span>· {c.city}</span>}
                  {c.employees ? <span>· {c.employees} empl.</span> : null}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  <Badge tone={STATUS_TONE[c.status] ?? "neutral"}>{STATUS_LABEL[c.status] ?? c.status}</Badge>
                  <Badge tone={sc >= 75 ? "emerald" : sc >= 50 ? "warning" : "neutral"}>Score {sc}</Badge>
                  <Badge tone={h.tone}><HeartPulse size={11} /> {h.label}</Badge>
                </div>
              </div>
            </div>
          </DrawerHeader>

          <DrawerBody>
            {/* Quick actions row */}
            <div className="flex flex-wrap items-center gap-1.5">
              <a href={primaryEmail ? `mailto:${primaryEmail}` : undefined} className={cn(!primaryEmail && "pointer-events-none opacity-40")}>
                <Button size="sm" variant="outline"><Mail size={13} /> Email</Button>
              </a>
              <a href={primaryPhone ? `tel:${primaryPhone}` : undefined} className={cn(!primaryPhone && "pointer-events-none opacity-40")}>
                <Button size="sm" variant="outline"><Phone size={13} /> Call</Button>
              </a>
              {c.website && (
                <a href={c.website.startsWith("http") ? c.website : `https://${c.website}`} target="_blank" rel="noreferrer">
                  <Button size="sm" variant="ghost"><Globe size={13} /> Site</Button>
                </a>
              )}
              <Select value={c.status} onChange={(e) => setStatus(e.target.value)} disabled={busy} className="ml-auto h-8 w-auto text-xs">
                {Object.entries(STATUS_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </Select>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-4 gap-2">
              <Metric label="Pipeline" value={eur(d.summary.open)} />
              <Metric label="Won" value={eur(d.summary.won)} tone="text-emerald" />
              <Metric label="Deals" value={String(d.deals.length)} />
              <Metric label="Contacts" value={String(d.contacts.length)} />
            </div>

            {/* Health */}
            <div className="rounded-lg border border-border p-3">
              <p className="flex items-center gap-2 text-sm">
                <span className={cn("h-2.5 w-2.5 rounded-full", dot(h.tone))} />
                <span className="font-medium">{h.label}</span>
                <span className="text-muted-foreground">· {h.reason}</span>
              </p>
            </div>

            {/* Open deals */}
            <Section icon={Handshake} title="Open deals" count={openDeals.length}>
              {openDeals.length === 0 ? (
                <Empty text="No open deals." />
              ) : (
                <div className="space-y-1.5">
                  {openDeals.slice(0, 5).map((dl) => (
                    <div key={dl.id} className="flex items-center justify-between gap-2 rounded-lg border border-border px-2.5 py-2 text-sm">
                      <span className="min-w-0 truncate">{dl.title}</span>
                      <span className="flex shrink-0 items-center gap-2">
                        <span className="font-semibold tabular">{eur(dl.value)}</span>
                        <span className="text-2xs text-muted-foreground">· wtd {eur(weightedValue(dl))}</span>
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </Section>

            {/* Key contacts */}
            <Section icon={Users} title="Key contacts" count={d.contacts.length}>
              {keyContacts.length === 0 ? (
                <Empty text="No contacts yet." />
              ) : (
                <div className="space-y-1.5">
                  {keyContacts.map((k) => (
                    <div key={k.id} className="flex items-center justify-between gap-2 rounded-lg border border-border px-2.5 py-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{k.name}</p>
                        <p className="truncate text-2xs text-muted-foreground">{[INFLUENCE[k.influence]?.label, k.role].filter(Boolean).join(" · ") || "—"}</p>
                      </div>
                      <div className="flex shrink-0 items-center gap-1">
                        {k.email && <a href={`mailto:${k.email}`} className="grid h-7 w-7 place-items-center rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground" title={k.email}><Mail size={13} /></a>}
                        {k.phone && <a href={`tel:${k.phone}`} className="grid h-7 w-7 place-items-center rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground" title={k.phone}><Phone size={13} /></a>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Section>

            {/* Recent activity + quick log */}
            <Section icon={ActivityIcon} title="Recent activity" count={d.activities.length}>
              <div className="flex gap-2">
                <Input
                  placeholder="Log a note…"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") logNote(); }}
                  className="h-8"
                />
                <Button size="sm" onClick={logNote} disabled={busy || !note.trim()}>
                  {busy ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
                </Button>
              </div>
              {d.activities.length > 0 && (
                <div className="mt-3 space-y-2.5 border-l border-border pl-3.5">
                  {d.activities.slice(0, 4).map((a) => (
                    <div key={a.id} className="relative">
                      <span className="absolute -left-[19px] top-1 h-1.5 w-1.5 rounded-full bg-electric ring-4 ring-popover" />
                      <div className="flex items-center justify-between gap-2">
                        <Badge tone="neutral">{a.type}</Badge>
                        <span className="text-2xs text-muted-foreground">{timeAgo(a.createdAt)}</span>
                      </div>
                      <p className="mt-1 text-sm">{a.summary}</p>
                    </div>
                  ))}
                </div>
              )}
            </Section>

            {/* AI — soon */}
            <div className="ai-surface p-3">
              <p className="text-sm font-semibold text-royal">Next best action</p>
              <p className="mt-1 text-xs text-muted-foreground">AI recommends the next move from this account&apos;s signals.</p>
              <span className="soon-badge mt-2 inline-block">soon</span>
            </div>
          </DrawerBody>

          <DrawerFooter>
            <span className="text-2xs text-muted-foreground">Updated {timeAgo(c.updatedAt)}</span>
            <Button
              size="sm"
              className="ml-auto"
              onClick={() => { router.push(`/companies/${c.id}`); onClose(); }}
            >
              Open full profile <ArrowUpRight size={14} />
            </Button>
          </DrawerFooter>
        </>
      )}
    </Drawer>
  );
}

function Metric({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div className="rounded-lg bg-secondary/50 p-2.5">
      <p className={cn("truncate text-sm font-semibold tabular", tone)}>{value}</p>
      <p className="text-2xs text-muted-foreground">{label}</p>
    </div>
  );
}
function Section({ icon: Icon, title, count, children }: { icon: typeof Users; title: string; count?: number; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-2 flex items-center gap-2 text-sm font-semibold">
        <Icon size={15} className="text-electric" /> {title}
        {count != null && count > 0 && <span className="rounded bg-secondary px-1.5 text-2xs font-normal text-muted-foreground">{count}</span>}
      </p>
      {children}
    </div>
  );
}
function Empty({ text }: { text: string }) {
  return <p className="rounded-lg border border-dashed border-border py-4 text-center text-xs text-muted-foreground">{text}</p>;
}
