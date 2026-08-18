import { leadsPageAction } from "@/lib/actions/leads";
import { leadScoreBreakdown } from "@/lib/crm/pipeline";
import { Card } from "@/components/ui/card";
import { LeadScoreList, type ScoredLead } from "@/components/crm/lead-score-list";

export const dynamic = "force-dynamic";

export default async function LeadScoringPage() {
  const res = await leadsPageAction({ sortKey: "score", sortDir: -1, page: 1, pageSize: 50 }).catch(() => ({ rows: [], total: 0, page: 1, pageCount: 1 }));

  const leads: ScoredLead[] = res.rows.map((l) => ({
    id: l.id,
    name: l.name || "",
    company: l.company || "",
    title: l.title || "",
    email: l.email || "",
    score: l.score,
    factors: leadScoreBreakdown({ hasWebsite: !!l.website, employees: l.employees, industryMatch: l.industryMatch, annualValue: l.annualValue }).factors,
  }));

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Lead scoring</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">Leads ranked by fit score, with the reasons behind each one.</p>
      </div>

      {leads.length === 0 ? (
        <Card className="p-8 text-center text-sm text-muted-foreground">No leads to score yet — add leads to see them ranked here.</Card>
      ) : (
        <LeadScoreList leads={leads} />
      )}
      <p className="text-2xs text-muted-foreground">Scores are a transparent heuristic (website, size, industry fit, value). AI-refined scoring arrives with the Sajtpress connection.</p>
    </div>
  );
}
