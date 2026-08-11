import { NextResponse } from "next/server";
import { integration, isConnected } from "@/lib/config";
import { dbHealth } from "@/lib/db";
import { webappReachable } from "@/lib/sajtpress";

export const dynamic = "force-dynamic";

export async function GET() {
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
