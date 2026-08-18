import { NextResponse } from "next/server";
import { integration, isConnected } from "@/lib/config";
import { dbHealth } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { webappReachable } from "@/lib/sajtpress";

export const dynamic = "force-dynamic";

// Anonymous callers (uptime monitors) get a bare liveness signal. Version, DB
// state and integration wiring are only disclosed to a signed-in user — they're
// useful recon otherwise.
export async function GET() {
  const session = await getSession().catch(() => null);
  if (!session) return NextResponse.json({ ok: true });

  const connected = isConnected(integration);
  const [db, webapp] = await Promise.all([
    dbHealth().catch(() => false),
    connected ? webappReachable().catch(() => false) : Promise.resolve(false),
  ]);
  return NextResponse.json({
    ok: true,
    app: "sajtpress-cms",
    version: process.env.NEXT_PUBLIC_APP_VERSION ?? "0",
    db,
    integration: { enabled: integration.enabled, connected, webapp },
  });
}
