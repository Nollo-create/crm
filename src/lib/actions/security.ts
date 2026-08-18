"use server";

import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth/session";
import { can } from "@/lib/auth/rbac";
import {
  securityOverview,
  listAuditLogs,
  listSecurityAlerts,
  acknowledgeSecurityAlert,
  acknowledgeAllSecurityAlerts,
  getOrgSecurityWebhook,
  setOrgSecurityWebhook,
  type AuditRow,
  type SecurityAlertRow,
} from "@/lib/db";
import { recordAudit } from "@/lib/auth/audit";
import { isSafeWebhookUrl } from "@/lib/crm/webhook-url";
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
  "password_change",
  "mfa_enable",
  "mfa_disable",
  "force_logout_all",
  "emergency_api_on",
  "emergency_ai_on",
  "emergency_automations_on",
  "require_admin_mfa_on",
  "require_admin_mfa_off",
  "restrict_members_on",
  "restrict_members_off",
  "alert_webhook_set",
  "alert_webhook_clear",
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

export interface SecurityAlert {
  id: number;
  type: string;
  severity: "low" | "medium" | "high";
  message: string;
  actorEmail: string;
  meta: string;
  createdAt: string;
}

export interface SecurityOverview {
  score: number;
  grade: "strong" | "fair" | "at-risk";
  findings: Finding[];
  metrics: SecurityMetrics;
  recentEvents: SecurityEvent[];
  activeAlerts: SecurityAlert[];
  /** Owner-only: the configured outbound alert webhook ("" = off). */
  webhookUrl: string;
  canManageOrg: boolean;
}

function toAlert(r: SecurityAlertRow): SecurityAlert {
  const sev = r.severity === "high" || r.severity === "low" ? r.severity : "medium";
  return { id: r.id, type: r.type, severity: sev, message: r.message, actorEmail: r.actor_email, meta: r.meta, createdAt: new Date(r.created_at).toISOString() };
}

/** Admin-only security posture: a real, explained score + measured metrics +
 *  a recent security-event feed. null when the caller can't manage members. */
export async function securityOverviewAction(): Promise<SecurityOverview | null> {
  const { organizationId, role } = await requireSession();
  if (!can(role, "member:manage")) return null;
  const canManageOrg = can(role, "org:manage");

  const [metrics, auditRows, alertRows, webhookUrl] = await Promise.all([
    securityOverview(organizationId).catch(() => null),
    listAuditLogs(organizationId, 100).catch(() => [] as AuditRow[]),
    listSecurityAlerts(organizationId, { onlyActive: true, limit: 20 }).catch(() => [] as SecurityAlertRow[]),
    canManageOrg ? getOrgSecurityWebhook(organizationId).catch(() => "") : Promise.resolve(""),
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

  return { score, grade, findings, metrics, recentEvents, activeAlerts: alertRows.map(toAlert), webhookUrl, canManageOrg };
}

/** Acknowledge (clear) one active security alert. member:manage. */
export async function acknowledgeAlertAction(id: number): Promise<{ error?: string }> {
  const session = await requireSession();
  if (!can(session.role, "member:manage")) return { error: "You don't have permission." };
  await acknowledgeSecurityAlert(session.organizationId, id, session.email);
  revalidatePath("/settings/security-overview");
  return {};
}

/** Acknowledge every active alert at once. member:manage. */
export async function acknowledgeAllAlertsAction(): Promise<{ error?: string }> {
  const session = await requireSession();
  if (!can(session.role, "member:manage")) return { error: "You don't have permission." };
  await acknowledgeAllSecurityAlerts(session.organizationId, session.email);
  revalidatePath("/settings/security-overview");
  return {};
}

/** Set or clear the outbound alert webhook. Owner-only; https + public host only
 *  (SSRF-guarded). Passing an empty string turns delivery off. */
export async function setSecurityWebhookAction(url: string): Promise<{ error?: string }> {
  const session = await requireSession();
  if (!can(session.role, "org:manage")) return { error: "Only an owner can change this." };
  const trimmed = (url || "").trim();
  if (trimmed) {
    const check = isSafeWebhookUrl(trimmed);
    if (!check.ok) return { error: check.reason };
  }
  await setOrgSecurityWebhook(session.organizationId, trimmed);
  await recordAudit(session, trimmed ? "alert_webhook_set" : "alert_webhook_clear", "organization", session.organizationId);
  revalidatePath("/settings/security-overview");
  return {};
}
