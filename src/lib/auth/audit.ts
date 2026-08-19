import "server-only";
import { headers } from "next/headers";
import { writeAudit } from "@/lib/db";
import { clientIpFromHeaders } from "@/lib/net/client-ip";
import type { SessionUser } from "./session";

// Thin wrappers so actions can record an audit event in one line. Audit writes
// must never break the action they describe, so failures are swallowed.

/** Best-effort request context (IP + user agent) for an audit row. Returns empty
 *  strings outside a request scope rather than throwing. */
async function requestContext(): Promise<{ ip: string; userAgent: string }> {
  try {
    const h = await headers();
    const ip0 = clientIpFromHeaders(h);
    const ip = (ip0 === "unknown" ? "" : ip0).slice(0, 45);
    const userAgent = (h.get("user-agent") || "").slice(0, 255);
    return { ip, userAgent };
  } catch {
    return { ip: "", userAgent: "" };
  }
}

export async function recordAudit(
  session: SessionUser,
  action: string,
  entity: string,
  entityId: number | null = null,
  summary = ""
): Promise<void> {
  try {
    const ctx = await requestContext();
    await writeAudit({
      organizationId: session.organizationId,
      userId: session.userId,
      actorEmail: session.email,
      action,
      entity,
      entityId,
      summary,
      ip: ctx.ip,
      userAgent: ctx.userAgent,
    });
  } catch {
    /* audit is best-effort */
  }
}

/** For authentication events (login / logout / failed login) where there may be
 *  no established session yet. The caller supplies who + which org. */
export async function recordAuthEvent(e: {
  organizationId: number;
  userId: number | null;
  actorEmail: string;
  action: string;
  summary?: string;
}): Promise<void> {
  try {
    const ctx = await requestContext();
    await writeAudit({
      organizationId: e.organizationId,
      userId: e.userId,
      actorEmail: e.actorEmail,
      action: e.action,
      entity: "session",
      summary: e.summary ?? "",
      ip: ctx.ip,
      userAgent: ctx.userAgent,
    });
  } catch {
    /* audit is best-effort */
  }
}
