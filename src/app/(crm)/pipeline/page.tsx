"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { boardAction, updateDealStageAction, type BoardDeal } from "@/lib/actions/crm";
import { STAGES, weightedValue, type StageId } from "@/lib/crm/pipeline";
import { Select } from "@/components/ui/input";
import { eur } from "@/lib/format";

export default function PipelinePage() {
  const [deals, setDeals] = useState<BoardDeal[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setDeals(await boardAction().catch(() => []));
    setLoading(false);
  }
  useEffect(() => {
    void load();
  }, []);

  const byStage = useMemo(() => {
    const m = new Map<StageId, BoardDeal[]>(STAGES.map((s) => [s.id, []]));
    for (const d of deals) m.get(d.stage)?.push(d);
    return m;
  }, [deals]);

  async function move(id: string | number, stage: string) {
    await updateDealStageAction(Number(id), stage);
    void load();
  }

  if (loading) return <div className="grid min-h-[50vh] place-items-center"><Loader2 className="animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Pipeline</h1>
      {deals.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border py-12 text-center text-sm text-muted-foreground">
          No deals yet — add one from a company.
        </p>
      ) : (
        <div className="flex gap-3 overflow-x-auto pb-3">
          {STAGES.map((s) => {
            const list = byStage.get(s.id) ?? [];
            const sum = list.reduce((t, d) => t + d.value, 0);
            return (
              <div key={s.id} className="w-64 shrink-0">
                <div className="flex items-center justify-between px-1 pb-2">
                  <p className="text-xs font-semibold">{s.label}</p>
                  <span className="text-[11px] text-muted-foreground">{list.length} · {eur(sum)}</span>
                </div>
                <div className="space-y-2">
                  {list.map((d) => (
                    <div key={d.id} className="glass rounded-xl p-2.5">
                      <p className="truncate text-sm font-medium">{d.title}</p>
                      <Link href={`/companies/${d.companyId}`} className="truncate text-[11px] text-muted-foreground hover:text-electric">
                        {d.companyName}
                      </Link>
                      <div className="mt-1.5 flex items-center justify-between text-xs">
                        <span className="font-semibold">{eur(d.value)}</span>
                        <span className="text-muted-foreground">≈ {eur(weightedValue(d))}</span>
                      </div>
                      <Select value={d.stage} onChange={(e) => move(d.id, e.target.value)} className="mt-2 h-7 w-full text-[11px]">
                        {STAGES.map((st) => <option key={st.id} value={st.id}>{st.label}</option>)}
                      </Select>
                    </div>
                  ))}
                  {list.length === 0 && <p className="px-1 text-[11px] text-muted-foreground">—</p>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
