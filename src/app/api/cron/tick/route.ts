import { NextResponse, type NextRequest } from "next/server";
import { timingSafeEqual } from "crypto";
import { distinctAutomationOrgs } from "@/lib/db";
import { runAutomationsForOrg } from "@/lib/automation-runner";

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
  const provided = req.headers.get("x-cron-secret") ?? req.nextUrl.searchParams.get("secret") ?? "";
  if (!secretOk(provided)) return new NextResponse("unauthorized", { status: 401 });

  const orgs = await distinctAutomationOrgs().catch(() => []);
  let created = 0;
  for (const org of orgs.slice(0, 100)) {
    const results = await runAutomationsForOrg(org).catch(() => []);
    created += results.reduce((s, x) => s + x.created, 0);
  }
  return NextResponse.json({ ok: true, orgs: orgs.length, created });
}

export const GET = run;
export const POST = run;
