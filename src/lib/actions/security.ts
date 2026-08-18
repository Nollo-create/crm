"use server";

import { requireSession } from "@/lib/auth/session";
import { can } from "@/lib/auth/rbac";
import { securityOverview, listAuditLogs, type AuditRow } from "@/lib/db";
import { computeSecurityScore, type SecurityMetrics, type Finding } from "@/lib/crm/security-score";

// Security-relevant audit actions surfaced as a "recent events" feed.
const SECURITY_ACTIONS = new Set([
  "login_failed",
  "login_sso",
  "role_change",
  "status_change",
  "invite",
  "apikey_create",
  "apikey_revoke",
  "apikey_disable",
  "session_revoke",
  "session_revoke_all",
  "delete",
  "bulk_delete",
  "plan_change",
]);

export interface SecurityEvent {
  id: number;
  actorEmail: string;
  action: string;
  entity: string;
  ip: string;
  createdAt: string;
}

export interface SecurityOverview {
  score: number;
  grade: "strong" | "fair" | "at-risk";
  findings: Finding[];
  metrics: SecurityMetrics;
  recentEvents: SecurityEvent[];
}

/** Admin-only security posture: a real, explained score + measured metrics +
 *  a recent security-event feed. null when the caller can't manage members. */
export async function securityOverviewAction(): Promise<SecurityOverview | null> {
  const { organizationId, role } = await requireSession();
  if (!can(role, "member:manage")) return null;

  const [metrics, auditRows] = await Promise.all([
    securityOverview(organizationId).catch(() => null),
    listAuditLogs(organizationId, 100).catch(() => [] as AuditRow[]),
  ]);
  if (!metrics) return null;

  const { score, grade, findings } = computeSecurityScore(metrics);
  const recentEvents: SecurityEvent[] = auditRows
    .filter((r) => SECURITY_ACTIONS.has(r.action))
    .slice(0, 8)
    .map((r) => ({
      id: r.id,
      actorEmail: r.actor_email,
      action: r.action,
      entity: r.entity,
      ip: r.ip ?? "",
      createdAt: new Date(r.created_at).toISOString(),
    }));

  return { score, grade, findings, metrics, recentEvents };
}
