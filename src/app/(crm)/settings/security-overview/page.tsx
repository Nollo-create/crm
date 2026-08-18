import Link from "next/link";
import { ShieldCheck, CheckCircle2, Clock, ArrowRight, AlertTriangle } from "lucide-react";
import { securityOverviewAction, type SecurityEvent } from "@/lib/actions/security";
import { Kpi } from "@/components/crm/charts";
import { Card } from "@/components/ui/card";
import { timeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const GRADE = {
  strong: { label: "Strong", ring: "text-emerald", bar: "bg-emerald" },
  fair: { label: "Fair", ring: "text-warning", bar: "bg-warning" },
  "at-risk": { label: "At risk", ring: "text-danger", bar: "bg-danger" },
} as const;

const SEV = { high: "bg-danger", medium: "bg-warning", low: "bg-electric" } as const;

// Real shipped controls (honest — each maps to code in the app), plus what's next.
const CONTROLS: { label: string; on: boolean; note: string }[] = [
  { label: "HTTPS + HSTS", on: true, note: "Enforced in production" },
  { label: "Content-Security-Policy", on: true, note: "Per-request nonce" },
  { label: "Security headers", on: true, note: "nosniff, frame-deny, referrer, permissions" },
  { label: "Sign-in rate limiting", on: true, note: "Per-IP and per-account" },
  { label: "Audit logging", on: true, note: "With IP + user agent" },
  { label: "Sessions hashed at rest", on: true, note: "Only the SHA-256 is stored" },
  { label: "Two-factor authentication", on: true, note: "Authenticator app + recovery codes" },
];

const ACTION_LABEL: Record<string, string> = {
  login_failed: "Failed sign-in",
  login_sso: "SSO sign-in",
  role_change: "Role changed",
  status_change: "Status changed",
  invite: "User invited",
  apikey_create: "API key created",
  apikey_revoke: "API key revoked",
  apikey_disable: "API key disabled",
  session_revoke: "Session revoked",
  session_revoke_all: "Signed out other sessions",
  mfa_enable: "Two-factor enabled",
  mfa_disable: "Two-factor disabled",
  delete: "Record deleted",
  bulk_delete: "Bulk delete",
  plan_change: "Plan changed",
};
const eventLabel = (e: SecurityEvent) => ACTION_LABEL[e.action] ?? e.action.replace(/_/g, " ");

export default async function SecurityOverviewPage() {
  const data = await securityOverviewAction();

  if (!data) {
    return (
      <div className="mx-auto max-w-md py-16 text-center">
        <p className="text-sm text-muted-foreground">You don&apos;t have access to the security overview.</p>
      </div>
    );
  }

  const g = GRADE[data.grade];

  return (
    <div className="max-w-3xl space-y-4">
      <div>
        <h1 className="flex items-center gap-2 text-xl font-semibold tracking-tight">
          <ShieldCheck size={18} className="text-electric" /> Security overview
        </h1>
        <p className="mt-0.5 text-sm text-muted-foreground">Your workspace&apos;s security posture, measured from real controls.</p>
      </div>

      {/* Score */}
      <Card className="flex flex-wrap items-center gap-5 p-4">
        <div className="flex items-baseline gap-1">
          <span className={cn("text-4xl font-bold tabular", g.ring)}>{data.score}</span>
          <span className="text-lg text-muted-foreground">/ 100</span>
        </div>
        <div className="min-w-[160px] flex-1">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">{g.label}</span>
            <span className="text-2xs text-muted-foreground">{data.findings.length === 0 ? "No issues found" : `${data.findings.length} to review`}</span>
          </div>
          <div className="mt-1 h-2 overflow-hidden rounded-full bg-secondary">
            <div className={cn("h-full rounded-full transition-all", g.bar)} style={{ width: `${data.score}%` }} />
          </div>
        </div>
      </Card>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Kpi label="Active sessions" value={String(data.metrics.activeSessions)} sub={data.metrics.staleSessions > 0 ? `${data.metrics.staleSessions} stale` : undefined} />
        <Kpi label="Failed sign-ins 24h" value={String(data.metrics.failedLogins24h)} tone={data.metrics.failedLogins24h >= 3 ? "text-danger" : undefined} />
        <Kpi label="Users" value={String(data.metrics.users)} sub={`${data.metrics.admins} admin${data.metrics.admins === 1 ? "" : "s"}`} />
        <Kpi label="API keys" value={String(data.metrics.apiKeysEnabled)} sub={data.metrics.apiKeysIdle > 0 ? `${data.metrics.apiKeysIdle} idle` : "enabled"} />
      </div>

      {/* Findings */}
      <div>
        <p className="mb-2 text-sm font-semibold">What to fix</p>
        {data.findings.length === 0 ? (
          <Card className="flex items-center gap-2 p-4 text-sm text-muted-foreground">
            <CheckCircle2 size={16} className="text-emerald" /> No security issues detected right now.
          </Card>
        ) : (
          <div className="space-y-2">
            {data.findings.map((f, i) => (
              <Card key={i} className="flex items-start gap-3 p-3">
                <span className={cn("mt-1 h-2 w-2 shrink-0 rounded-full", SEV[f.severity])} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{f.title}</p>
                  <p className="mt-0.5 text-2xs text-muted-foreground">{f.detail}</p>
                </div>
                {f.href && (
                  <Link href={f.href} className="inline-flex shrink-0 items-center gap-1 text-2xs font-medium text-electric hover:underline">
                    Fix <ArrowRight size={12} />
                  </Link>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Controls + recent events */}
      <div className="grid gap-3 lg:grid-cols-2">
        <Card className="p-4">
          <p className="text-sm font-semibold">Controls in place</p>
          <ul className="mt-2 space-y-1.5">
            {CONTROLS.map((c) => (
              <li key={c.label} className="flex items-start gap-2 text-2xs">
                {c.on ? <CheckCircle2 size={14} className="mt-0.5 shrink-0 text-emerald" /> : <Clock size={14} className="mt-0.5 shrink-0 text-warning" />}
                <span className="flex-1"><span className="text-foreground">{c.label}</span> <span className="text-muted-foreground">— {c.note}</span></span>
              </li>
            ))}
          </ul>
        </Card>

        <Card className="p-4">
          <p className="text-sm font-semibold">Recent security events</p>
          {data.recentEvents.length === 0 ? (
            <p className="mt-3 text-2xs text-muted-foreground">Nothing notable recently.</p>
          ) : (
            <ul className="mt-2 space-y-1.5">
              {data.recentEvents.map((e) => (
                <li key={e.id} className="flex items-start justify-between gap-2 text-2xs">
                  <span className="min-w-0">
                    <span className={cn("font-medium", e.action === "login_failed" ? "text-danger" : "text-foreground")}>{eventLabel(e)}</span>
                    <span className="text-muted-foreground"> · {e.actorEmail || "system"}{e.ip ? ` · ${e.ip}` : ""}</span>
                  </span>
                  <span className="shrink-0 text-muted-foreground">{timeAgo(e.createdAt)}</span>
                </li>
              ))}
            </ul>
          )}
          <Link href="/settings/security" className="mt-3 inline-flex items-center gap-1 text-2xs font-medium text-electric hover:underline">
            Full audit log <ArrowRight size={12} />
          </Link>
        </Card>
      </div>

      {data.grade === "at-risk" && (
        <p className="flex items-center gap-1.5 text-2xs text-danger"><AlertTriangle size={12} /> Address the high-severity items above to raise your score.</p>
      )}
    </div>
  );
}
