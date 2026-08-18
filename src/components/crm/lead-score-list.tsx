"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search, ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export interface ScoredLead {
  id: number;
  name: string;
  company: string;
  title: string;
  email: string;
  score: number;
  factors: { label: string; points: number }[];
}

const TIERS = [
  { id: "all", label: "All", test: () => true },
  { id: "hot", label: "Hot", test: (s: number) => s >= 75 },
  { id: "warm", label: "Warm", test: (s: number) => s >= 50 && s < 75 },
  { id: "cold", label: "Cold", test: (s: number) => s < 50 },
] as const;

const barClass = (sc: number) => (sc >= 75 ? "bg-emerald" : sc >= 50 ? "bg-warning" : "bg-muted-foreground");

export function LeadScoreList({ leads }: { leads: ScoredLead[] }) {
  const [tier, setTier] = useState<(typeof TIERS)[number]["id"]>("all");
  const [q, setQ] = useState("");

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: leads.length, hot: 0, warm: 0, cold: 0 };
    for (const l of leads) c[l.score >= 75 ? "hot" : l.score >= 50 ? "warm" : "cold"]++;
    return c;
  }, [leads]);

  const avg = useMemo(() => (leads.length ? Math.round(leads.reduce((s, l) => s + l.score, 0) / leads.length) : 0), [leads]);

  const shown = useMemo(() => {
    const t = TIERS.find((x) => x.id === tier)!;
    const needle = q.trim().toLowerCase();
    return leads.filter((l) => t.test(l.score) && (!needle || [l.name, l.company, l.title, l.email].some((v) => v?.toLowerCase().includes(needle))));
  }, [leads, tier, q]);

  return (
    <div className="space-y-3">
      {/* Summary */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Card className="p-3"><p className="text-2xs text-muted-foreground">Average score</p><p className="text-lg font-semibold tabular">{avg}</p></Card>
        <Card className="p-3"><p className="text-2xs text-muted-foreground">Hot · ≥75</p><p className="text-lg font-semibold tabular text-emerald">{counts.hot}</p></Card>
        <Card className="p-3"><p className="text-2xs text-muted-foreground">Warm · 50–74</p><p className="text-lg font-semibold tabular text-warning">{counts.warm}</p></Card>
        <Card className="p-3"><p className="text-2xs text-muted-foreground">Cold · &lt;50</p><p className="text-lg font-semibold tabular text-muted-foreground">{counts.cold}</p></Card>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex gap-1">
          {TIERS.map((t) => (
            <button key={t.id} onClick={() => setTier(t.id)} className={cn("rounded-lg px-2.5 py-1 text-xs font-medium transition-colors", tier === t.id ? "bg-secondary text-foreground" : "text-muted-foreground hover:bg-secondary/60")}>
              {t.label} <span className="text-2xs text-muted-foreground">{counts[t.id]}</span>
            </button>
          ))}
        </div>
        <div className="relative ml-auto min-w-[160px] flex-1 sm:max-w-xs">
          <Search size={15} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search leads…" value={q} onChange={(e) => setQ(e.target.value)} className="h-9 pl-8" />
        </div>
      </div>

      {shown.length === 0 ? (
        <Card className="p-8 text-center text-sm text-muted-foreground">No leads match.</Card>
      ) : (
        <div className="space-y-2">
          {shown.map((l, i) => (
            <Link key={l.id} href={`/leads/${l.id}`} className="group block">
              <Card className="p-3 transition-colors hover:border-electric/40">
                <div className="flex items-center gap-3">
                  <span className="w-5 shrink-0 text-center text-2xs text-muted-foreground">{i + 1}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{l.name || l.company || "—"}</p>
                    <p className="truncate text-2xs text-muted-foreground">{[l.company && l.name ? l.company : null, l.title].filter(Boolean).join(" · ") || l.email || "—"}</p>
                  </div>
                  <div className="flex w-40 items-center gap-2">
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-secondary">
                      <div className={cn("h-full rounded-full", barClass(l.score))} style={{ width: `${l.score}%` }} />
                    </div>
                    <span className="w-8 text-right text-sm font-semibold tabular">{l.score}</span>
                  </div>
                  <ArrowRight size={15} className="shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                </div>
                <div className="mt-2 flex flex-wrap gap-1 pl-8">
                  {l.factors.map((f, j) => (
                    <span key={j} className="rounded bg-secondary px-1.5 py-0.5 text-2xs text-muted-foreground">
                      {f.label} <span className="font-medium text-foreground">+{f.points}</span>
                    </span>
                  ))}
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
