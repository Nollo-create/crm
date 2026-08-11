import { leadsPageAction } from "@/lib/actions/leads";
import { leadScoreBreakdown } from "@/lib/crm/pipeline";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const barClass = (sc: number) => (sc >= 75 ? "bg-emerald" : sc >= 50 ? "bg-warning" : "bg-muted-foreground");

export default async function LeadScoringPage() {
  const res = await leadsPageAction({ sortKey: "score", sortDir: -1, page: 1, pageSize: 20 }).catch(() => ({ rows: [], total: 0, page: 1, pageCount: 1 }));

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Lead scoring</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">Leads ranked by fit score, with the reasons behind each one.</p>
      </div>

      {res.rows.length === 0 ? (
        <Card className="p-8 text-center text-sm text-muted-foreground">No leads to score yet — add leads to see them ranked here.</Card>
      ) : (
        <div className="space-y-2">
          {res.rows.map((l, i) => {
            const b = leadScoreBreakdown({ hasWebsite: !!l.website, employees: l.employees, industryMatch: l.industryMatch, annualValue: l.annualValue });
            return (
              <Card key={l.id} className="p-3">
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
                </div>
                <div className="mt-2 flex flex-wrap gap-1 pl-8">
                  {b.factors.map((f, j) => (
                    <span key={j} className="rounded bg-secondary px-1.5 py-0.5 text-2xs text-muted-foreground">
                      {f.label} <span className="font-medium text-foreground">+{f.points}</span>
                    </span>
                  ))}
                </div>
              </Card>
            );
          })}
        </div>
      )}
      <p className="text-2xs text-muted-foreground">Scores are a transparent heuristic (website, size, industry fit, value). AI-refined scoring arrives with the Sajtpress connection.</p>
    </div>
  );
}
