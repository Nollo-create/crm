"use client";

import { useEffect, useState } from "react";
import { ShieldCheck } from "lucide-react";
import { listAuditLogsAction, type AuditEvent } from "@/lib/actions/audit";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { timeAgo } from "@/lib/format";

const ACTION_LABEL: Record<string, string> = {
  create: "created",
  delete: "deleted",
  bulk_delete: "bulk-deleted",
  invite: "invited",
  role_change: "changed the role of",
  status_change: "changed the status of",
};

function phrase(e: AuditEvent): string {
  const verb = ACTION_LABEL[e.action] ?? e.action;
  return `${verb} ${e.entity}`;
}

export function AuditViewer() {
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listAuditLogsAction()
      .then(setEvents)
      .catch(() => setEvents([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="flex items-center gap-2 text-xl font-semibold tracking-tight">
          <ShieldCheck size={18} className="text-electric" /> Audit log
        </h1>
        <p className="mt-0.5 text-sm text-muted-foreground">Recent changes across your workspace.</p>
      </div>

      <Card className="p-0">
        {loading ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-4 w-full" />
            ))}
          </div>
        ) : events.length === 0 ? (
          <p className="px-4 py-12 text-center text-sm text-muted-foreground">No activity recorded yet.</p>
        ) : (
          <ul className="divide-y divide-border">
            {events.map((e) => (
              <li key={e.id} className="flex items-start justify-between gap-3 px-4 py-2.5 text-sm">
                <div className="min-w-0">
                  <p>
                    <span className="font-medium">{e.actorEmail || "system"}</span>{" "}
                    <span className="text-muted-foreground">{phrase(e)}</span>
                  </p>
                  {e.summary && <p className="truncate text-2xs text-muted-foreground">{e.summary}</p>}
                </div>
                <span className="shrink-0 text-2xs text-muted-foreground">{timeAgo(e.createdAt)}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
