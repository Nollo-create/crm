import { Plug, CheckCircle2, XCircle, Circle } from "lucide-react";
import { requireSession } from "@/lib/auth/session";
import { can } from "@/lib/auth/rbac";
import { integrationStatusAction } from "@/lib/actions/settings";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

function Row({ label, ok, value }: { label: string; ok: boolean | null; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 py-2 text-sm">
      <span className="flex items-center gap-2">
        {ok === null ? <Circle size={14} className="text-muted-foreground/50" /> : ok ? <CheckCircle2 size={14} className="text-emerald" /> : <XCircle size={14} className="text-danger" />}
        {label}
      </span>
      <span className="text-muted-foreground">{value}</span>
    </div>
  );
}

export default async function IntegrationsPage() {
  const session = await requireSession();
  if (!can(session.role, "member:manage")) {
    return (
      <div className="mx-auto max-w-md py-16 text-center">
        <p className="text-sm text-muted-foreground">You don&apos;t have access to integrations.</p>
      </div>
    );
  }

  const s = await integrationStatusAction();

  return (
    <div className="max-w-xl space-y-4">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Integrations</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">Connection to the Sajtpress platform.</p>
      </div>

      <Card className="p-4">
        <div className="flex items-center justify-between">
          <p className="flex items-center gap-2 text-sm font-semibold">
            <Plug size={15} className="text-electric" /> Sajtpress platform
          </p>
          <Badge tone={s.connected ? "emerald" : "neutral"}>{s.connected ? "Connected" : "Standalone"}</Badge>
        </div>
        <div className="mt-3 divide-y divide-border">
          <Row label="Webapp URL" ok={s.webappUrl ? true : null} value={s.webappUrl || "not set"} />
          <Row label="Service secret" ok={s.hasSecret} value={s.hasSecret ? "configured" : "missing"} />
          <Row label="Reachable" ok={s.connected ? s.reachable : null} value={s.connected ? (s.reachable ? "yes" : "no response") : "—"} />
          <Row label="Single sign-on" ok={s.ssoEnabled ? true : null} value={s.ssoEnabled ? "enabled" : "off"} />
          <Row label="Shared cookie domain" ok={s.cookieDomain ? true : null} value={s.cookieDomain || "—"} />
        </div>
        {!s.connected && (
          <p className="mt-3 text-2xs text-muted-foreground">
            Running standalone. Set <code className="text-foreground">SAJTPRESS_INTEGRATION=on</code>, <code className="text-foreground">WEBAPP_INTERNAL_URL</code> and <code className="text-foreground">INTERNAL_API_SECRET</code> to connect the shared brain and enable Sajtpress sign-in.
          </p>
        )}
      </Card>

      <Card className="p-4">
        <p className="flex items-center gap-2 text-sm font-semibold">
          <Plug size={15} className="text-electric" /> Scheduled jobs
        </p>
        <div className="mt-3 divide-y divide-border">
          <Row label="Cron seam" ok={s.cronConfigured} value={s.cronConfigured ? "configured" : "not configured"} />
        </div>
        <p className="mt-3 text-2xs text-muted-foreground">
          {s.cronConfigured
            ? "Automations and follow-ups run on schedule. You can still trigger them manually anytime."
            : <>Set <code className="text-foreground">CRON_SECRET</code> and point a cron job at <code className="text-foreground">/api/cron/tick</code> so automations run on their own. Until then, use “Run now”.</>}
        </p>
      </Card>

      <p className="text-2xs text-muted-foreground">
        Email, calendar, Stripe and outbound webhooks are on the roadmap and appear here once available.
      </p>
    </div>
  );
}
