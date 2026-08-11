import { getAnalytics } from "@/lib/analytics";
import { Card } from "@/components/ui/card";
import { eur } from "@/lib/format";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

type Tone = "good" | "warn" | "neutral";
const dot = (t: Tone) => (t === "good" ? "bg-emerald" : t === "warn" ? "bg-danger" : "bg-electric");

export default async function InsightsPage() {
  const a = await getAnalytics();
  const closed = a.deals.wonCount + a.deals.lostCount;
  const topStage = [...a.deals.byStage].filter((s) => s.stage !== "won" && s.stage !== "lost").sort((x, y) => y.value - x.value)[0];

  const insights: { title: string; detail: string; tone: Tone }[] = [
    {
      title: `Win rate ${a.deals.winRate}%`,
      detail: closed ? `${a.deals.wonCount} won vs ${a.deals.lostCount} lost across closed deals.` : "No closed deals yet.",
      tone: !closed ? "neutral" : a.deals.winRate >= 50 ? "good" : a.deals.winRate < 30 ? "warn" : "neutral",
    },
    {
      title: `${eur(a.deals.open)} open pipeline`,
      detail: `${a.deals.openCount} open deals · weighted ${eur(a.deals.weighted)} · avg ${eur(a.deals.avgOpen)}.`,
      tone: "neutral",
    },
    {
      title: a.companies.atRisk > 0 ? `${a.companies.atRisk} customer${a.companies.atRisk === 1 ? "" : "s"} at risk` : "No customers at risk",
      detail: `${a.companies.customers} customers · ${eur(a.companies.arr)} recurring value.`,
      tone: a.companies.atRisk > 0 ? "warn" : "good",
    },
    {
      title: `Lead conversion ${a.leads.conversionRate}%`,
      detail: `${a.leads.converted} of ${a.leads.total} leads converted.`,
      tone: a.leads.total === 0 ? "neutral" : a.leads.conversionRate >= 20 ? "good" : "neutral",
    },
    {
      title: a.activities.last30 === 0 ? "No activity in 30 days" : `${a.activities.last30} touches in 30 days`,
      detail: a.activities.last30 === 0 ? "Log calls, emails and meetings to keep accounts warm." : "Recent engagement across your accounts.",
      tone: a.activities.last30 === 0 ? "warn" : "neutral",
    },
    ...(topStage && topStage.value > 0
      ? [{ title: `Most value in "${topStage.label}"`, detail: `${eur(topStage.value)} across ${topStage.count} deal${topStage.count === 1 ? "" : "s"} — where to focus.`, tone: "neutral" as Tone }]
      : []),
  ];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Sales insights</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">What your numbers are telling you.</p>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        {insights.map((it, i) => (
          <Card key={i} className="flex items-start gap-3 p-3">
            <span className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", dot(it.tone))} />
            <div className="min-w-0">
              <p className="text-sm font-medium">{it.title}</p>
              <p className="mt-0.5 text-2xs text-muted-foreground">{it.detail}</p>
            </div>
          </Card>
        ))}
      </div>
      <p className="text-2xs text-muted-foreground">Rule-based insights over your CRM data. Deeper AI analysis arrives with the Sajtpress connection.</p>
    </div>
  );
}
