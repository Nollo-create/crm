"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Clock, X, Loader2, CheckCircle2, AlertTriangle } from "lucide-react";
import { listScheduledEmailsAction, cancelScheduledEmailAction, type ScheduledEmailView } from "@/lib/actions/email";
import { Card } from "@/components/ui/card";
import { Badge, type Tone } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { useCanWrite } from "@/components/crm/role-context";

const STATUS: Record<string, { label: string; tone: Tone }> = {
  pending: { label: "Scheduled", tone: "electric" },
  sent: { label: "Sent", tone: "emerald" },
  failed: { label: "Failed", tone: "danger" },
  canceled: { label: "Canceled", tone: "neutral" },
};

export function ScheduledEmails() {
  const { toast } = useToast();
  const canWrite = useCanWrite();
  const [items, setItems] = useState<ScheduledEmailView[] | null>(null);
  const [busy, setBusy] = useState<number | null>(null);

  function load() {
    listScheduledEmailsAction().then(setItems).catch(() => setItems([]));
  }
  useEffect(() => { load(); }, []);

  async function cancel(id: number) {
    setBusy(id);
    const r = await cancelScheduledEmailAction(id);
    setBusy(null);
    if (r.error) return toast(r.error, { tone: "error" });
    load();
  }

  const when = (iso: string) => new Date(iso).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });

  return (
    <div className="max-w-2xl space-y-4">
      <div>
        <h1 className="flex items-center gap-2 text-xl font-semibold tracking-tight"><Clock size={18} className="text-electric" /> Scheduled emails</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">Emails queued to send later. The system sends them at their time.</p>
      </div>

      {items === null ? (
        <div className="space-y-2">{[0, 1].map((i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
      ) : items.length === 0 ? (
        <Card className="p-8 text-center text-sm text-muted-foreground">Nothing scheduled. Use <strong>Send later</strong> in any email composer to queue one.</Card>
      ) : (
        <div className="space-y-2">
          {items.map((e) => {
            const st = STATUS[e.status] ?? STATUS.pending;
            return (
              <Card key={e.id} className="flex items-center gap-3 p-3">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-secondary text-muted-foreground">
                  {e.status === "sent" ? <CheckCircle2 size={15} className="text-emerald" /> : e.status === "failed" ? <AlertTriangle size={15} className="text-danger" /> : <Clock size={15} />}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{e.subject || "(no subject)"}</p>
                  <p className="truncate text-2xs text-muted-foreground">
                    to {e.to}
                    {e.companyId && <> · <Link href={`/companies/${e.companyId}`} className="text-electric hover:underline">account</Link></>}
                    {" · "}{e.status === "pending" ? `sends ${when(e.sendAt)}` : `for ${when(e.sendAt)}`}
                    {e.error && <span className="text-danger"> · {e.error}</span>}
                  </p>
                </div>
                <Badge tone={st.tone}>{st.label}</Badge>
                {e.status === "pending" && canWrite && (
                  <button onClick={() => cancel(e.id)} disabled={busy === e.id} title="Cancel" className="grid h-7 w-7 shrink-0 place-items-center rounded text-muted-foreground hover:text-danger">
                    {busy === e.id ? <Loader2 size={13} className="animate-spin" /> : <X size={15} />}
                  </button>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
