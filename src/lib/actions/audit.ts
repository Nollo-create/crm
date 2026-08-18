"use server";

import { listAuditLogs, type AuditRow } from "@/lib/db";
import { requireSession } from "@/lib/auth/session";
import { can } from "@/lib/auth/rbac";

export interface AuditEvent {
  id: number;
  actorEmail: string;
  action: string;
  entity: string;
  entityId: number | null;
  summary: string;
  ip: string;
  createdAt: string;
}

export async function listAuditLogsAction(): Promise<AuditEvent[]> {
  const { organizationId, role } = await requireSession();
  if (!can(role, "member:manage")) return [];
  const rows = await listAuditLogs(organizationId, 100);
  return rows.map((r: AuditRow) => ({
    id: r.id,
    actorEmail: r.actor_email,
    action: r.action,
    entity: r.entity,
    entityId: r.entity_id,
    summary: r.summary,
    ip: r.ip ?? "",
    createdAt: new Date(r.created_at).toISOString(),
  }));
}
