"use client";

import { useEffect, useState } from "react";
import { Zap, RefreshCw, Loader2 } from "lucide-react";
import { listAutomationRunsAction, type AutomationRunItem } from "@/lib/actions/automation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { timeAgo } from "@/lib/format";

export default function AutomationLogPage() {
  const [rows, setRows] = useState<AutomationRunItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    listAutomationRunsAction()
      .then((r) => !cancelled && setRows(r))
      .catch(() => !cancelled && setRows([]))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Activity log</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">Every automation run and how many tasks it created.</p>
        </div>
        <Button size="sm" variant="outline" onClick={() => setReloadKey((k) => k + 1)} disabled={loading}>
          {loading ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />} Refresh
        </Button>
      </div>

      {loading ? (
        <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-14 w-full rounded-xl" />)}</div>
      ) : rows.length === 0 ? (
        <Card className="p-8 text-center text-sm text-muted-foreground">No runs yet. Automations log here once they run — trigger one with “Run now” on any automation page.</Card>
      ) : (
        <div className="space-y-2">
          {rows.map((r) => (
            <Card key={r.id} className="flex items-center gap-3 p-3">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-emerald/15 text-emerald"><Zap size={15} /></span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{r.name}</p>
                <p className="truncate text-2xs text-muted-foreground">{r.summary}</p>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-sm font-semibold">{r.created}</p>
                <p className="text-2xs text-muted-foreground">{timeAgo(r.ranAt)}</p>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
