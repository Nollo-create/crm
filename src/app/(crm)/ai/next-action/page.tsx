import Link from "next/link";
import { Handshake, Building2, FileText, Target, ArrowRight } from "lucide-react";
import { nextBestActionsAction } from "@/lib/actions/ai";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const KIND: Record<string, { icon: typeof Handshake; style: string }> = {
  deal: { icon: Handshake, style: "bg-warning/10 text-warning" },
  account: { icon: Building2, style: "bg-danger/10 text-danger" },
  quote: { icon: FileText, style: "bg-electric/10 text-electric" },
  lead: { icon: Target, style: "bg-emerald/10 text-emerald" },
};

export default async function NextActionPage() {
  const items = await nextBestActionsAction().catch(() => []);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Next best action</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">A prioritised worklist from your accounts&apos; signals.</p>
      </div>

      {items.length === 0 ? (
        <Card className="p-8 text-center text-sm text-muted-foreground">You&apos;re all caught up — no overdue deals, stale accounts, aging quotes or hot leads right now.</Card>
      ) : (
        <div className="space-y-2">
          {items.map((it, i) => {
            const k = KIND[it.kind] ?? KIND.lead;
            const Icon = k.icon;
            return (
              <Link key={i} href={it.href} className="group flex items-center gap-3 rounded-xl border border-border bg-card p-3 transition-colors hover:border-electric/40">
                <span className={cn("grid h-8 w-8 shrink-0 place-items-center rounded-full", k.style)}><Icon size={15} /></span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{it.title}</p>
                  <p className="truncate text-2xs text-muted-foreground">{it.subtitle}</p>
                </div>
                <ArrowRight size={15} className="shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
