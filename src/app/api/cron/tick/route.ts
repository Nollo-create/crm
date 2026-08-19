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
  // Prefer the header (not logged). The ?secret= query fallback is kept so an
  // existing scheduler keeps working, but it's DEPRECATED — the secret ends up in
  // proxy/access logs. Switch to `-H "x-cron-secret: <secret>"` and it can be
  // dropped entirely (audit SEC-17).
  const headerSecret = req.headers.get("x-cron-secret");
  const querySecret = req.nextUrl.searchParams.get("secret");
  const provided = headerSecret ?? querySecret ?? "";
  if (!secretOk(provided)) return new NextResponse("unauthorized", { status: 401 });
  if (!headerSecret && querySecret) {
    console.warn("[cron] CRON_SECRET was sent via the ?secret= query string — it is logged by the proxy. Move it to the x-cron-secret header (SEC-17).");
  }

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
