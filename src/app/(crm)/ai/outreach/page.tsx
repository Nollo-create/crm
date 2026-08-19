"use client";

import { useEffect, useState } from "react";
import { Send, Building2, X, Sparkles, Mail, Linkedin } from "lucide-react";
import { outreachDraftAction, type AiOut } from "@/lib/actions/ai";
import { type OutreachTone, type OutreachLength, type OutreachChannel } from "@/lib/crm/ai-options";
import { searchCompaniesAction, getCompanyAction, type SearchHit } from "@/lib/actions/crm";
import { Input, Select } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AiOutput } from "@/components/crm/ai-output";
import { EmailComposer } from "@/components/crm/email-composer";
import { useCanWrite } from "@/components/crm/role-context";
import { parseOutreachDraft } from "@/lib/crm/outreach-draft";
import { cn } from "@/lib/utils";

type Recipient = { id: number; name: string; role: string; email: string };

const TONES: { id: OutreachTone; label: string }[] = [
  { id: "warm", label: "Warm" },
  { id: "formal", label: "Formal" },
  { id: "direct", label: "Direct" },
];

export default function OutreachPage() {
  const canWrite = useCanWrite();
  const [companyId, setCompanyId] = useState(0);
  const [companyName, setCompanyName] = useState("");
  const [companyQuery, setCompanyQuery] = useState("");
  const [companyResults, setCompanyResults] = useState<SearchHit[]>([]);
  const [contacts, setContacts] = useState<Recipient[]>([]);
  const [contactId, setContactId] = useState(0);
  const [goal, setGoal] = useState("");
  const [tone, setTone] = useState<OutreachTone>("warm");
  const [length, setLength] = useState<OutreachLength>("standard");
  const [channel, setChannel] = useState<OutreachChannel>("email");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AiOut | null>(null);
  const [composing, setComposing] = useState(false);

  useEffect(() => {
    const s = companyQuery.trim();
    if (!s) {
      setCompanyResults([]);
      return;
    }
    const t = setTimeout(async () => setCompanyResults(await searchCompaniesAction(s).catch(() => [])), 200);
    return () => clearTimeout(t);
  }, [companyQuery]);

  async function pickCompany(id: number, name: string) {
    setCompanyId(id);
    setCompanyName(name);
    setCompanyResults([]);
    setContacts([]);
    setContactId(0);
    const d = await getCompanyAction(id).catch(() => null);
    if (d) {
      const list = d.contacts.map((c) => ({ id: c.id, name: c.name, role: c.role, email: c.email }));
      setContacts(list);
      if (list[0]) setContactId(list[0].id);
    }
  }

  function clearCompany() {
    setCompanyId(0);
    setCompanyName("");
    setCompanyQuery("");
    setContacts([]);
    setContactId(0);
    setResult(null);
    setComposing(false);
  }

  async function draft() {
    if (!companyId) return;
    setLoading(true);
    setResult(null);
    setComposing(false);
    const r = await outreachDraftAction({ companyId, contactId: contactId || undefined, goal, tone, length, channel }).catch(() => ({ text: "", enabled: false }));
    setResult(r);
    setLoading(false);
  }

  return (
    <div className="max-w-2xl space-y-4">
      <div>
        <h1 className="flex items-center gap-2 text-xl font-semibold tracking-tight"><Sparkles size={18} className="text-royal" /> AI outreach</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">Draft a warm outreach message for an account. You review and send it yourself.</p>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        {/* Company */}
        <div className="relative">
          {companyId ? (
            <div className="flex h-10 items-center justify-between gap-2 rounded-lg border border-border bg-secondary/40 px-3 text-sm">
              <span className="truncate"><Building2 size={13} className="mr-1 inline text-muted-foreground" />{companyName}</span>
              <button onClick={clearCompany} className="text-muted-foreground hover:text-foreground"><X size={14} /></button>
            </div>
          ) : (
            <>
              <Input placeholder="Pick a company…" value={companyQuery} onChange={(e) => setCompanyQuery(e.target.value)} autoFocus />
              {companyResults.length > 0 && (
                <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-lg border border-border bg-popover shadow-pop">
                  {companyResults.map((c) => (
                    <button key={c.id} onClick={() => pickCompany(c.id, c.name)} className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-secondary">
                      <Building2 size={14} className="shrink-0 text-muted-foreground" />
                      <span className="flex-1 truncate">{c.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Recipient */}
        <Select value={String(contactId)} onChange={(e) => setContactId(Number(e.target.value))} disabled={!companyId} className="h-10 text-sm" title="Recipient">
          {contacts.length === 0 ? (
            <option value="0">{companyId ? "Main contact" : "Pick a company first"}</option>
          ) : (
            contacts.map((c) => <option key={c.id} value={c.id}>{c.name}{c.role ? ` · ${c.role}` : ""}</option>)
          )}
        </Select>

        <Input placeholder="Goal (e.g. book an intro call)" value={goal} onChange={(e) => setGoal(e.target.value)} className="sm:col-span-2" />
      </div>

      {/* Channel + tone + length */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex gap-1 rounded-lg border border-border p-0.5">
          {(["email", "linkedin"] as OutreachChannel[]).map((ch) => (
            <button key={ch} onClick={() => setChannel(ch)} className={cn("inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium transition-colors", channel === ch ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground")}>
              {ch === "email" ? <Mail size={13} /> : <Linkedin size={13} />} {ch === "email" ? "Email" : "LinkedIn"}
            </button>
          ))}
        </div>
        <div className="flex gap-1">
          {TONES.map((t) => (
            <button key={t.id} onClick={() => setTone(t.id)} className={cn("rounded-lg px-2.5 py-1 text-xs font-medium transition-colors", tone === t.id ? "bg-secondary text-foreground" : "text-muted-foreground hover:bg-secondary/60")}>{t.label}</button>
          ))}
        </div>
        <Select value={length} onChange={(e) => setLength(e.target.value as OutreachLength)} className="h-9 w-auto text-xs" title="Length">
          <option value="short">Short</option>
          <option value="standard">Standard</option>
        </Select>
      </div>

      <div className="flex items-center justify-between gap-2">
        <p className="text-2xs text-muted-foreground">Drafts only — nothing is ever sent automatically.</p>
        <Button onClick={draft} disabled={loading || !companyId}><Send size={15} /> Draft {channel === "linkedin" ? "message" : "email"}</Button>
      </div>

      <AiOutput loading={loading} result={result} />

      {/* Turn the draft into a real, logged send — email channel only, writers only. */}
      {result?.enabled && !!result.text && channel === "email" && canWrite && !composing && (
        <div className="flex justify-end">
          <Button size="sm" variant="outline" onClick={() => setComposing(true)}><Mail size={14} /> Send this email</Button>
        </div>
      )}
      {composing && result && (
        <EmailComposer
          to={contacts.find((c) => c.id === contactId)?.email ?? ""}
          subject={parseOutreachDraft(result.text).subject}
          body={parseOutreachDraft(result.text).body}
          contactId={contactId || undefined}
          companyId={companyId}
          onClose={() => setComposing(false)}
          onSent={() => setComposing(false)}
        />
      )}
    </div>
  );
}
