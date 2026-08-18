import { nextBestActionsAction } from "@/lib/actions/ai";
import { NbaList } from "@/components/crm/nba-list";
import { Card } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function NextActionPage() {
  const items = await nextBestActionsAction().catch(() => []);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Next best action</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">A prioritised worklist from your accounts&apos; signals. Log any item straight to your tasks.</p>
      </div>

      {items.length === 0 ? (
        <Card className="p-8 text-center text-sm text-muted-foreground">You&apos;re all caught up — no overdue deals, stale accounts, aging quotes or hot leads right now.</Card>
      ) : (
        <NbaList items={items} />
      )}
    </div>
  );
}
