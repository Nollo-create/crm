"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BellRing, Check, Loader2, Webhook, Trash2, ShieldAlert } from "lucide-react";
import { acknowledgeAlertAction, acknowledgeAllAlertsAction, setSecurityWebhookAction, type SecurityAlert } from "@/lib/actions/security";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { timeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";

const SEV_DOT = { high: "bg-danger", medium: "bg-warning", low: "bg-electric" } as const;

export function ActiveAlerts({ alerts }: { alerts: SecurityAlert[] }) {
  const { toast } = useToast();
  const router = useRouter();
  const [busy, setBusy] = useState<number | "all" | null>(null);

  if (alerts.length === 0) return null;

  async function ack(id: number) {
    setBusy(id);
    const r = await acknowledgeAlertAction(id);
    setBusy(null);
    if (r.error) return toast(r.error, { tone: "error" });
    router.refresh();
  }
  async function ackAll() {
    setBusy("all");
    const r = await acknowledgeAllAlertsAction();
    setBusy(null);
    if (r.error) return toast(r.error, { tone: "error" });
    toast("All alerts acknowledged", { tone: "success" });
    router.refresh();
  }

  return (
    <Card className="border-danger/40 bg-danger/[0.03] p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="flex items-center gap-2 text-sm font-semibold text-danger">
          <ShieldAlert size={15} /> Active alerts
          <span className="rounded-full bg-danger/15 px-1.5 py-0.5 text-[10px] font-medium">{alerts.length}</span>
        </p>
        <Button size="sm" variant="ghost" onClick={ackAll} disabled={busy !== null}>
          {busy === "all" ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} Acknowledge all
        </Button>
      </div>
      <ul className="mt-2 space-y-1.5">
        {alerts.map((a) => (
          <li key={a.id} className="flex items-start justify-between gap-2 rounded-lg bg-background/60 px-2.5 py-2">
            <span className="flex min-w-0 items-start gap-2">
              <span className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", SEV_DOT[a.severity])} />
              <span className="min-w-0">
                <span className="text-sm font-medium">{a.message}</span>
                <span className="block text-2xs text-muted-foreground">
                  {a.actorEmail || "system"}{a.meta ? ` · ${a.meta}` : ""} · {timeAgo(a.createdAt)}
                </span>
              </span>
            </span>
            <button onClick={() => ack(a.id)} disabled={busy !== null} title="Acknowledge" className="grid h-7 w-7 shrink-0 place-items-center rounded text-muted-foreground hover:text-emerald">
              {busy === a.id ? <Loader2 size={13} className="animate-spin" /> : <Check size={14} />}
            </button>
          </li>
        ))}
      </ul>
    </Card>
  );
}

export function AlertWebhook({ initialUrl }: { initialUrl: string }) {
  const { toast } = useToast();
  const router = useRouter();
  const [url, setUrl] = useState(initialUrl);
  const [busy, setBusy] = useState(false);
  const configured = initialUrl.length > 0;

  async function save(next: string) {
    setBusy(true);
    const r = await setSecurityWebhookAction(next);
    setBusy(false);
    if (r.error) return toast(r.error, { tone: "error" });
    toast(next ? "Alert webhook saved" : "Alert webhook removed", { tone: "success" });
    router.refresh();
  }

  return (
    <Card className="p-4">
      <p className="flex items-center gap-2 text-sm font-semibold"><Webhook size={15} className="text-electric" /> Alert delivery</p>
      <p className="mt-0.5 text-2xs text-muted-foreground">
        Push high-severity alerts to an https endpoint (Slack, Discord, PagerDuty, an email gateway…). Left empty, alerts stay in-app only.
        {configured && <span className="text-emerald"> · Active</span>}
      </p>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <Input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://hooks.slack.com/services/…"
          className="min-w-[220px] flex-1"
          inputMode="url"
          autoComplete="off"
        />
        <Button size="sm" onClick={() => save(url.trim())} disabled={busy || url.trim() === initialUrl}>
          {busy ? <Loader2 size={14} className="animate-spin" /> : null} Save
        </Button>
        {configured && (
          <Button size="sm" variant="ghost" onClick={() => { setUrl(""); save(""); }} disabled={busy} className="text-danger hover:text-danger">
            <Trash2 size={14} /> Remove
          </Button>
        )}
      </div>
      <p className="mt-2 flex items-center gap-1 text-[10px] text-muted-foreground"><BellRing size={11} /> We POST a small JSON body and never follow redirects. Only public https hosts are allowed.</p>
    </Card>
  );
}
