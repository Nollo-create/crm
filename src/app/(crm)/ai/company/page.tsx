"use client";

import { useEffect, useState } from "react";
import { ScanSearch, Building2, X } from "lucide-react";
import { companyAnalysisAction, type AiOut } from "@/lib/actions/ai";
import { type AnalysisFocus } from "@/lib/crm/ai-options";
import { searchCompaniesAction, getCompanyAction, type SearchHit } from "@/lib/actions/crm";
import { Input, Select } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AiOutput } from "@/components/crm/ai-output";

const FOCUSES: { id: AnalysisFocus; label: string }[] = [
  { id: "general", label: "Balanced review" },
  { id: "growth", label: "Growth & upsell" },
  { id: "risk", label: "Risk & retention" },
  { id: "competitive", label: "Competitive angle" },
];

export default function CompanyAnalysisPage() {
  const [companyId, setCompanyId] = useState(0);
  const [companyName, setCompanyName] = useState("");
  const [companyQuery, setCompanyQuery] = useState("");
  const [companyResults, setCompanyResults] = useState<SearchHit[]>([]);
  const [focus, setFocus] = useState<AnalysisFocus>("general");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AiOut | null>(null);

  // Deep link: /ai/company?companyId=NN prefills the account (e.g. from a profile).
  useEffect(() => {
    const id = Number(new URLSearchParams(window.location.search).get("companyId"));
    if (!id) return;
    getCompanyAction(id).then((d) => {
      if (d) {
        setCompanyId(d.company.id);
        setCompanyName(d.company.name);
      }
    }).catch(() => {});
  }, []);

  useEffect(() => {
    const s = companyQuery.trim();
    if (!s) {
      setCompanyResults([]);
      return;
    }
    const t = setTimeout(async () => setCompanyResults(await searchCompaniesAction(s).catch(() => [])), 200);
    return () => clearTimeout(t);
  }, [companyQuery]);

  async function analyze() {
    if (!companyId) return;
    setLoading(true);
    setResult(null);
    const r = await companyAnalysisAction(companyId, focus).catch(() => ({ text: "", enabled: false }));
    setResult(r);
    setLoading(false);
  }

  return (
    <div className="max-w-2xl space-y-4">
      <div>
        <h1 className="flex items-center gap-2 text-xl font-semibold tracking-tight"><ScanSearch size={18} className="text-royal" /> Company analysis</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">AI reads an account&apos;s data and surfaces opportunities, risks and a next step.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        <div className="relative min-w-[200px] flex-1">
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
                      {c.city && <span className="text-2xs text-muted-foreground">{c.city}</span>}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
        <Select value={focus} onChange={(e) => setFocus(e.target.value as AnalysisFocus)} className="h-10 w-auto text-sm" title="Analysis focus">
          {FOCUSES.map((f) => <option key={f.id} value={f.id}>{f.label}</option>)}
        </Select>
        <Button onClick={analyze} disabled={loading || !companyId}><ScanSearch size={15} /> Analyze</Button>
      </div>

      <AiOutput loading={loading} result={result} />
    </div>
  );
}
