import { NextResponse, type NextRequest } from "next/server";
import { timingSafeEqual } from "crypto";
import { distinctAutomationOrgs } from "@/lib/db";
import { runAutomationsForOrg } from "@/lib/automation-runner";
import { processDueScheduledEmails } from "@/lib/email/scheduled-runner";
import { processDueSequenceSteps } from "@/lib/email/sequence-runner";

// The automation runner's cron seam. A scheduler (cPanel cron job, or the
// webapp's cron) hits this every few minutes with the shared CRON_SECRET, and it
// runs a bounded slice of automation work per org. Fail-safe: 503 until
// CRON_SECRET is configured, 401 on a bad secret.

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function secretOk(provided: string): boolean {
  const secret = process.env.CRON_SECRET ?? "";
  if (!secret || provided.length !== secret.length) return false;
  try {
    return timingSafeEqual(Buffer.from(provided), Buffer.from(secret));
  } catch {
    return false;
  }
}

async function run(req: NextRequest) {
  if (!process.env.CRON_SECRET) return NextResponse.json({ ok: false, error: "cron not configured" }, { status: 503 });
  // Header only (audit SEC-17). The secret must ride in the x-cron-secret header,
  // never the URL query, so it can't leak into proxy/access logs.
  const provided = req.headers.get("x-cron-secret") ?? "";
  if (!secretOk(provided)) return new NextResponse("unauthorized", { status: 401 });

  const orgs = await distinctAutomationOrgs().catch(() => []);
  let created = 0;
  for (const org of orgs.slice(0, 100)) {
    const results = await runAutomationsForOrg(org).catch(() => []);
    created += results.reduce((s, x) => s + x.created, 0);
  }
  // Deliver any "send later" emails whose time has come.
  const email = await processDueScheduledEmails().catch(() => ({ sent: 0, failed: 0 }));
  // Advance follow-up sequences whose next step is due.
  const seq = await processDueSequenceSteps().catch(() => ({ sent: 0, stopped: 0, completed: 0 }));
  return NextResponse.json({ ok: true, orgs: orgs.length, created, emailsSent: email.sent, emailsFailed: email.failed, seqSent: seq.sent, seqStopped: seq.stopped, seqCompleted: seq.completed });
}

export const GET = run;
export const POST = run;
