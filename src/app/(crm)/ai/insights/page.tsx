import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getAnalytics } from "@/lib/analytics";
import { Card } from "@/components/ui/card";
import { eur } from "@/lib/format";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

type Tone = "good" | "warn" | "neutral";
const dot = (t: Tone) => (t === "good" ? "bg-emerald" : t === "warn" ? "bg-danger" : "bg-electric");

interface Insight {
  title: string;
  detail: string;
  tone: Tone;
  href?: string;
}

export default async function InsightsPage() {
  const a = await getAnalytics();
  const closed = a.deals.wonCount + a.deals.lostCount;
  const topStage = [...a.deals.byStage].filter((s) => s.stage !== "won" && s.stage !== "lost").sort((x, y) => y.value - x.value)[0];
  const quoteAccept = a.quotes.total ? Math.round((a.quotes.accepted / a.quotes.total) * 100) : 0;
  const topSource = [...a.leads.bySource].sort((x, y) => y.n - x.n)[0];

  const insights: Insight[] = [
    {
      title: `Win rate ${a.deals.winRate}%`,
      detail: closed ? `${a.deals.wonCount} won vs ${a.deals.lostCount} lost across closed deals.` : "No closed deals yet.",
      tone: !closed ? "neutral" : a.deals.winRate >= 50 ? "good" : a.deals.winRate < 30 ? "warn" : "neutral",
      href: "/analytics/conversion",
    },
    {
      title: `${eur(a.deals.open)} open pipeline`,
      detail: `${a.deals.openCount} open deals · weighted ${eur(a.deals.weighted)} · avg ${eur(a.deals.avgOpen)}.`,
      tone: "neutral",
      href: "/deals",
    },
    {
      title: a.companies.atRisk > 0 ? `${a.companies.atRisk} customer${a.companies.atRisk === 1 ? "" : "s"} at risk` : "No customers at risk",
      detail: `${a.companies.customers} customers · ${eur(a.companies.arr)} recurring value.`,
      tone: a.companies.atRisk > 0 ? "warn" : "good",
      href: "/customers",
    },
    {
      title: `Lead conversion ${a.leads.conversionRate}%`,
      detail: `${a.leads.converted} of ${a.leads.total} leads converted.`,
      tone: a.leads.total === 0 ? "neutral" : a.leads.conversionRate >= 20 ? "good" : "neutral",
      href: "/leads",
    },
    {
      title: a.activities.last30 === 0 ? "No activity in 30 days" : `${a.activities.last30} touches in 30 days`,
      detail: a.activities.last30 === 0 ? "Log calls, emails and meetings to keep accounts warm." : "Recent engagement across your accounts.",
      tone: a.activities.last30 === 0 ? "warn" : "neutral",
      href: "/activities",
    },
    ...(a.quotes.total > 0
      ? [{
          title: `Quote acceptance ${quoteAccept}%`,
          detail: `${a.quotes.accepted} of ${a.quotes.total} quotes accepted.`,
          tone: (quoteAccept >= 40 ? "good" : quoteAccept < 20 ? "warn" : "neutral") as Tone,
          href: "/quotes",
        }]
      : []),
    ...(topSource && topSource.n > 0
      ? [{ title: `Top lead source: ${topSource.key || "unknown"}`, detail: `${topSource.n} lead${topSource.n === 1 ? "" : "s"} from this source — double down on what works.`, tone: "neutral" as Tone, href: "/leads" }]
      : []),
    ...(topStage && topStage.value > 0
      ? [{ title: `Most value in "${topStage.label}"`, detail: `${eur(topStage.value)} across ${topStage.count} deal${topStage.count === 1 ? "" : "s"} — where to focus.`, tone: "neutral" as Tone, href: `/deals?stage=${topStage.stage}` }]
      : []),
  ];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Sales insights</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">What your numbers are telling you.</p>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        {insights.map((it, i) => {
          const body = (
            <>
              <span className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", dot(it.tone))} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{it.title}</p>
                <p className="mt-0.5 text-2xs text-muted-foreground">{it.detail}</p>
              </div>
              {it.href && <ArrowRight size={14} className="mt-0.5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />}
            </>
          );
          return it.href ? (
            <Link key={i} href={it.href}><Card className="group flex items-start gap-3 p-3 transition-colors hover:border-electric/40">{body}</Card></Link>
          ) : (
            <Card key={i} className="flex items-start gap-3 p-3">{body}</Card>
          );
        })}
      </div>
      <p className="text-2xs text-muted-foreground">Rule-based insights over your CRM data. Deeper AI analysis arrives with the Sajtpress connection.</p>
    </div>
  );
}
