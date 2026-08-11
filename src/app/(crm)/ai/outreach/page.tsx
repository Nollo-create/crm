"use client";

import { useEffect, useState } from "react";
import { Send, Building2, X, Sparkles } from "lucide-react";
import { outreachDraftAction, type AiOut } from "@/lib/actions/ai";
import { searchCompaniesAction, type SearchHit } from "@/lib/actions/crm";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AiOutput } from "@/components/crm/ai-output";

export default function OutreachPage() {
  const [companyId, setCompanyId] = useState(0);
  const [companyName, setCompanyName] = useState("");
  const [companyQuery, setCompanyQuery] = useState("");
  const [companyResults, setCompanyResults] = useState<SearchHit[]>([]);
  const [goal, setGoal] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AiOut | null>(null);

  useEffect(() => {
    const s = companyQuery.trim();
    if (!s) {
      setCompanyResults([]);
      return;
    }
    const t = setTimeout(async () => setCompanyResults(await searchCompaniesAction(s).catch(() => [])), 200);
    return () => clearTimeout(t);
  }, [companyQuery]);

  async function draft() {
    if (!companyId) return;
    setLoading(true);
    setResult(null);
    const r = await outreachDraftAction({ companyId, goal }).catch(() => ({ text: "", enabled: false }));
    setResult(r);
    setLoading(false);
  }

  return (
    <div className="max-w-2xl space-y-4">
      <div>
        <h1 className="flex items-center gap-2 text-xl font-semibold tracking-tight"><Sparkles size={18} className="text-royal" /> AI outreach</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">Draft a warm outreach email for an account. You review and send it yourself.</p>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <div className="relative">
          {companyId ? (
            <div className="flex h-10 items-center justify-between gap-2 rounded-lg border border-border bg-secondary/40 px-3 text-sm">
              <span className="truncate"><Building2 size={13} className="mr-1 inline text-muted-foreground" />{companyName}</span>
              <button onClick={() => { setCompanyId(0); setCompanyName(""); setCompanyQuery(""); setResult(null); }} className="text-muted-foreground hover:text-foreground"><X size={14} /></button>
            </div>
          ) : (
            <>
              <Input placeholder="Pick a company…" value={companyQuery} onChange={(e) => setCompanyQuery(e.target.value)} autoFocus />
              {companyResults.length > 0 && (
                <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-lg border border-border bg-popover shadow-pop">
                  {companyResults.map((c) => (
                    <button key={c.id} onClick={() => { setCompanyId(c.id); setCompanyName(c.name); setCompanyResults([]); }} className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-secondary">
                      <Building2 size={14} className="shrink-0 text-muted-foreground" />
                      <span className="flex-1 truncate">{c.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
        <Input placeholder="Goal (e.g. book an intro call)" value={goal} onChange={(e) => setGoal(e.target.value)} />
      </div>
      <div className="flex items-center justify-between gap-2">
        <p className="text-2xs text-muted-foreground">Drafts only — nothing is ever sent automatically.</p>
        <Button onClick={draft} disabled={loading || !companyId}><Send size={15} /> Draft email</Button>
      </div>

      <AiOutput loading={loading} result={result} />
    </div>
  );
}
