"use server";

import { revalidatePath } from "next/cache";
import { requireSession, getCurrentSessionId } from "@/lib/auth/session";
import { listSessionsForUser, revokeSessionById, revokeOtherSessions } from "@/lib/db";
import { recordAudit } from "@/lib/auth/audit";
import { describeUserAgent } from "@/lib/crm/user-agent";

export interface SessionView {
  id: number;
  device: string;
  deviceType: "Mobile" | "Tablet" | "Desktop";
  ip: string;
  current: boolean;
  createdAt: string;
  lastUsedAt: string | null;
}

/** The current user's own active sessions (devices). Never exposes token hashes. */
export async function listSessionsAction(): Promise<SessionView[]> {
  const session = await requireSession();
  const [rows, currentId] = await Promise.all([listSessionsForUser(session.userId), getCurrentSessionId()]);
  return rows.map((r) => {
    const info = describeUserAgent(r.user_agent);
    return {
      id: r.id,
      device: info.label,
      deviceType: info.deviceType,
      ip: r.ip || "—",
      current: r.id === currentId,
      createdAt: new Date(r.created_at).toISOString(),
      lastUsedAt: r.last_used_at ? new Date(r.last_used_at).toISOString() : null,
    };
  });
}

/** Revoke one of the user's own sessions. Refuses the current one (use logout). */
export async function revokeSessionAction(id: number): Promise<{ error?: string }> {
  const session = await requireSession();
  const currentId = await getCurrentSessionId();
  if (id === currentId) return { error: "That's this session — use Sign out instead." };
  await revokeSessionById(session.userId, id);
  await recordAudit(session, "session_revoke", "session", id);
  revalidatePath("/settings/sessions");
  return {};
}

/** Log out of every other device — keeps the current session. */
export async function revokeOtherSessionsAction(): Promise<{ count: number; error?: string }> {
  const session = await requireSession();
  const currentId = await getCurrentSessionId();
  if (!currentId) return { count: 0, error: "Session not found." };
  const count = await revokeOtherSessions(session.userId, currentId);
  await recordAudit(session, "session_revoke_all", "session", null, `${count} other session${count === 1 ? "" : "s"}`);
  revalidatePath("/settings/sessions");
  return { count };
}
