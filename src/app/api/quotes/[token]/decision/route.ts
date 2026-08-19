import { NextResponse } from "next/server";
import { recordQuoteDecision, createNotification, addActivity } from "@/lib/db";
import { quoteNumber } from "@/lib/crm/quotes";
import { checkRateLimit } from "@/lib/rate-limit";
import { clientIpFromHeaders } from "@/lib/net/client-ip";

// Public, unauthenticated quote accept/decline. The share token is the only
// credential (unguessable, one token -> one quote). Rate-limited per IP and the
// decision is idempotent, so a double-click or re-open can't flip an answer.
export const dynamic = "force-dynamic";

function json(body: unknown, status = 200): NextResponse {
  return NextResponse.json(body, { status, headers: { "cache-control": "no-store" } });
}

export async function POST(req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token: raw } = await params;
  const token = (raw || "").slice(0, 64);

  const ip = clientIpFromHeaders(req.headers);
  const rl = checkRateLimit(`quote:ip:${ip}`, { limit: 20, windowMs: 60_000, blockMs: 10 * 60_000 });
  if (!rl.ok) return json({ error: "Too many requests. Please try again later." }, 429);

  let body: Record<string, unknown> = {};
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    /* empty body */
  }
  const decision = String(body.decision || "");
  if (decision !== "accepted" && decision !== "declined") return json({ error: "Invalid decision." }, 400);
  const clientName = String(body.clientName || "").trim().slice(0, 190);

  const result = await recordQuoteDecision(token, decision, clientName).catch(() => null);
  if (!result) return json({ error: "This quote is not available." }, 404);

  // Notify the team + log to the company timeline, only on the first decision.
  if (!result.alreadyDecided) {
    const who = clientName ? ` by ${clientName}` : "";
    const label = decision === "accepted" ? "accepted" : "declined";
    await createNotification(result.organizationId, {
      type: decision === "accepted" ? "deal_won" : "quote",
      title: `Quote ${quoteNumber(result.quoteId)} ${label}${who}`,
      href: `/quotes/${result.quoteId}`,
    }).catch(() => {});
    await addActivity(result.organizationId, {
      companyId: result.companyId,
      type: "note",
      summary: `Quote ${quoteNumber(result.quoteId)} ${label}${who} via client link`,
    }).catch(() => {});
  }

  return json({ ok: true, status: result.status, alreadyDecided: result.alreadyDecided });
}
