"use client";

import { useEffect, useMemo, useState } from "react";
import { ShieldCheck, Search } from "lucide-react";
import { listAuditLogsAction, type AuditEvent } from "@/lib/actions/audit";
import { Card } from "@/components/ui/card";
import { Input, Select } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { timeAgo } from "@/lib/format";

const ACTION_LABEL: Record<string, string> = {
  create: "created",
  delete: "deleted",
  bulk_delete: "bulk-deleted",
  bulk_update: "bulk-updated",
  import: "imported",
  invite: "invited",
  role_change: "changed the role of",
  status_change: "changed the status of",
  apikey_create: "created",
  apikey_enable: "enabled",
  apikey_disable: "disabled",
  apikey_revoke: "revoked",
  plan_change: "changed",
  billing_update: "updated",
  login: "signed in",
  login_sso: "signed in via SSO",
  login_failed: "failed to sign in",
  logout: "signed out",
  setup: "set up the workspace",
  session_revoke: "revoked a",
  session_revoke_all: "revoked other",
};

const verb = (action: string) => ACTION_LABEL[action] ?? action.replace(/_/g, " ");

function phrase(e: AuditEvent): string {
  const noun = e.entity ? ` ${e.entity.replace(/_/g, " ")}` : "";
  return `${verb(e.action)}${noun}`;
}

export function AuditViewer() {
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [action, setAction] = useState("all");
  const [actor, setActor] = useState("all");
  const [q, setQ] = useState("");

  useEffect(() => {
    listAuditLogsAction()
      .then(setEvents)
      .catch(() => setEvents([]))
      .finally(() => setLoading(false));
  }, []);

  const actions = useMemo(() => Array.from(new Set(events.map((e) => e.action))).sort(), [events]);
  const actors = useMemo(() => Array.from(new Set(events.map((e) => e.actorEmail).filter(Boolean))).sort(), [events]);

  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return events.filter(
      (e) =>
        (action === "all" || e.action === action) &&
        (actor === "all" || e.actorEmail === actor) &&
        (!needle || [e.actorEmail, e.entity, e.summary, e.action, e.ip].some((v) => v?.toLowerCase().includes(needle)))
    );
  }, [events, action, actor, q]);

  const distinctActors = useMemo(() => new Set(shown.map((e) => e.actorEmail).filter(Boolean)).size, [shown]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="flex items-center gap-2 text-xl font-semibold tracking-tight">
          <ShieldCheck size={18} className="text-electric" /> Audit log
        </h1>
        <p className="mt-0.5 text-sm text-muted-foreground">Recent changes across your workspace.</p>
      </div>

      {!loading && events.length > 0 && (
        <>
          <div className="grid grid-cols-3 gap-2">
            <Card className="p-3"><p className="text-2xs text-muted-foreground">Events shown</p><p className="text-lg font-semibold tabular">{shown.length}</p></Card>
            <Card className="p-3"><p className="text-2xs text-muted-foreground">People</p><p className="text-lg font-semibold tabular">{distinctActors}</p></Card>
            <Card className="p-3"><p className="text-2xs text-muted-foreground">Most recent</p><p className="text-sm font-semibold">{timeAgo(events[0].createdAt)}</p></Card>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-[160px] flex-1 sm:max-w-xs">
              <Search size={15} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search events…" value={q} onChange={(e) => setQ(e.target.value)} className="h-9 pl-8" />
            </div>
            <Select value={action} onChange={(e) => setAction(e.target.value)} className="h-9 w-auto text-xs">
              <option value="all">All actions</option>
              {actions.map((a) => <option key={a} value={a}>{verb(a)}</option>)}
            </Select>
            <Select value={actor} onChange={(e) => setActor(e.target.value)} className="h-9 w-auto text-xs">
              <option value="all">Everyone</option>
              {actors.map((a) => <option key={a} value={a}>{a}</option>)}
            </Select>
          </div>
        </>
      )}

      <Card className="p-0">
        {loading ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-4 w-full" />
            ))}
          </div>
        ) : events.length === 0 ? (
          <p className="px-4 py-12 text-center text-sm text-muted-foreground">No activity recorded yet.</p>
        ) : shown.length === 0 ? (
          <p className="px-4 py-12 text-center text-sm text-muted-foreground">No events match these filters.</p>
        ) : (
          <ul className="divide-y divide-border">
            {shown.map((e) => (
              <li key={e.id} className="flex items-start justify-between gap-3 px-4 py-2.5 text-sm">
                <div className="min-w-0">
                  <p>
                    <span className="font-medium">{e.actorEmail || "system"}</span>{" "}
                    <span className={e.action === "login_failed" ? "text-danger" : "text-muted-foreground"}>{phrase(e)}</span>
                  </p>
                  <p className="truncate text-2xs text-muted-foreground">
                    {[e.summary, e.ip && `IP ${e.ip}`].filter(Boolean).join(" · ")}
                  </p>
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
