"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MailOpen, Send, Percent, MailCheck, Info } from "lucide-react";
import { emailDashboardAction, type EmailDashboard } from "@/lib/actions/email";
import { Kpi } from "@/components/crm/charts";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { timeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";

const rate = (opened: number, sent: number) => (sent > 0 ? Math.round((opened / sent) * 100) : 0);

export function EmailReport() {
  const [data, setData] = useState<EmailDashboard | null>(null);

  useEffect(() => {
    emailDashboardAction().then(setData).catch(() => setData(null));
  }, []);

  if (!data) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-7 w-40" />
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3"><Skeleton className="h-20" /><Skeleton className="h-20" /><Skeleton className="h-20" /></div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const openRate30 = rate(data.opened.last30, data.sent.last30);

  return (
    <div className="max-w-3xl space-y-4">
      <div>
        <h1 className="flex items-center gap-2 text-xl font-semibold tracking-tight"><MailOpen size={18} className="text-electric" /> Email report</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">Sends and open rates from your team&apos;s tracked emails.</p>
      </div>

      {/* Headline — last 30 days */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        <Kpi label="Sent · 30d" value={String(data.sent.last30)} sub={`${data.sent.all} all-time`} />
        <Kpi label="Opened · 30d" value={String(data.opened.last30)} sub={`${data.opened.all} all-time`} />
        <Kpi label="Open rate · 30d" value={`${openRate30}%`} sub={`${rate(data.opened.all, data.sent.all)}% all-time`} tone={openRate30 >= 40 ? "text-emerald" : openRate30 >= 20 ? undefined : "text-muted-foreground"} />
      </div>

      {data.sent.all === 0 ? (
        <Card className="p-8 text-center text-sm text-muted-foreground">
          No tracked emails yet. Send one from a contact, deal, or company with <strong>Track opens</strong> on, and it&apos;ll show up here.
        </Card>
      ) : (
        <>
          {/* By rep */}
          {data.byRep.length > 1 && (
            <Card className="overflow-hidden p-0">
              <p className="border-b border-border px-4 py-2.5 text-sm font-semibold">By sender</p>
              <div className="divide-y divide-border">
                {data.byRep.map((r) => (
                  <div key={r.rep} className="flex items-center gap-3 px-4 py-2.5 text-sm">
                    <MailCheck size={14} className="shrink-0 text-muted-foreground" />
                    <span className="min-w-0 flex-1 truncate">{r.rep || "—"}</span>
                    <span className="shrink-0 text-2xs text-muted-foreground">{r.sent} sent · {r.opened} opened</span>
                    <Badge tone={rate(r.opened, r.sent) >= 40 ? "emerald" : "neutral"}>{rate(r.opened, r.sent)}%</Badge>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Recent sends */}
          <Card className="overflow-hidden p-0">
            <p className="border-b border-border px-4 py-2.5 text-sm font-semibold">Recent sends</p>
            <div className="divide-y divide-border">
              {data.recent.map((e) => (
                <div key={e.id} className="flex items-center gap-3 px-4 py-2.5">
                  <span className={cn("grid h-8 w-8 shrink-0 place-items-center rounded-full", e.openedAt ? "bg-emerald/12 text-emerald" : "bg-secondary text-muted-foreground")}>
                    {e.openedAt ? <MailOpen size={15} /> : <Send size={14} />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{e.subject || "(no subject)"}</p>
                    <p className="truncate text-2xs text-muted-foreground">
                      to {e.to}
                      {e.companyId && e.companyName && <> · <Link href={`/companies/${e.companyId}`} className="text-electric hover:underline">{e.companyName}</Link></>}
                      {" · "}{e.sentBy} · {timeAgo(e.sentAt)}
                    </p>
                  </div>
                  {e.openedAt ? (
                    <Badge tone="emerald">Opened{e.openCount > 1 ? ` ×${e.openCount}` : ""}</Badge>
                  ) : (
                    <span className="shrink-0 text-2xs text-muted-foreground">Not yet</span>
                  )}
                </div>
              ))}
            </div>
          </Card>
        </>
      )}

      <p className="flex items-start gap-1.5 text-[10px] text-muted-foreground">
        <Info size={12} className="mt-0.5 shrink-0" />
        Opens are a signal, not proof — Gmail&apos;s image proxy and Apple Mail&apos;s privacy protection can register an open the recipient never made. A lack of opens is usually more telling than a single open.
      </p>
    </div>
  );
}
