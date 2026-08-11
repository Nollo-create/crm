import "server-only";
import { writeAudit } from "@/lib/db";
import type { SessionUser } from "./session";

// Thin wrapper so actions can record an audit event in one line. Audit writes
// must never break the action they describe, so failures are swallowed.
export async function recordAudit(
  session: SessionUser,
  action: string,
  entity: string,
  entityId: number | null = null,
  summary = ""
): Promise<void> {
  try {
    await writeAudit({
      organizationId: session.organizationId,
      userId: session.userId,
      actorEmail: session.email,
      action,
      entity,
      entityId,
      summary,
    });
  } catch {
    /* audit is best-effort */
  }
}
