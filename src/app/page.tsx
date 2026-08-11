import { Database, Link2, ShieldCheck } from "lucide-react";
import { integration, isConnected } from "@/lib/config";
import { dbHealth } from "@/lib/db";
import { webappReachable } from "@/lib/sajtpress";
import { cn } from "@/lib/utils";

// Rendered per request so the live status reflects the real DB / webapp state.
export const dynamic = "force-dynamic";

function StatusRow({ ok, label, detail, Icon }: { ok: boolean; label: string; detail: string; Icon: typeof Database }) {
  return (
    <div className="glass flex items-start gap-3 rounded-lg p-4">
      <span className={cn("mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg", ok ? "bg-emerald/10 text-emerald" : "bg-warning/10 text-warning")}>
        <Icon size={16} />
      </span>
      <div className="min-w-0">
        <p className="flex items-center gap-2 text-sm font-medium">
          {label}
          <span className={cn("rounded px-1.5 py-0.5 text-[11px] font-semibold", ok ? "bg-emerald/10 text-emerald" : "bg-warning/10 text-warning")}>
            {ok ? "OK" : "—"}
          </span>
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground">{detail}</p>
      </div>
    </div>
  );
}

export default async function Home() {
  const connected = isConnected(integration);
  const [db, webapp] = await Promise.all([
    dbHealth().catch(() => false),
    connected ? webappReachable().catch(() => false) : Promise.resolve(false),
  ]);

  return (
    <main className="mx-auto grid min-h-screen max-w-2xl place-items-center p-6">
      <div className="w-full space-y-6">
        <div>
          <p className="text-2xl font-semibold">
            Sajt<span className="text-electric">press</span> CMS
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Scaffold is live. Mode:{" "}
            <span className={cn("font-medium", connected ? "text-emerald" : "text-foreground")}>
              {connected ? "connected to Sajtpress" : "standalone"}
            </span>
            .
          </p>
        </div>

        <div className="space-y-2">
          <StatusRow
            ok={db}
            label="CMS database"
            detail={process.env.DB_NAME ? `Connected to ${process.env.DB_NAME}.` : "Set DB_* env vars to connect the CMS's own database."}
            Icon={Database}
          />
          <StatusRow
            ok={connected}
            label="Sajtpress integration"
            detail={
              integration.enabled
                ? connected
                  ? `On — talking to ${integration.webappUrl}.`
                  : "Flag on, but WEBAPP_INTERNAL_URL / INTERNAL_API_SECRET are missing."
                : "Off — running standalone. Set SAJTPRESS_INTEGRATION=on to connect."
            }
            Icon={Link2}
          />
          <StatusRow
            ok={webapp}
            label="Webapp reachable"
            detail={
              !connected
                ? "Integration is off."
                : webapp
                  ? "The internal API answered."
                  : "No answer yet — the webapp's /api/internal endpoints aren't live, or the secret doesn't match."
            }
            Icon={ShieldCheck}
          />
        </div>

        <p className="text-[11px] text-muted-foreground">
          Build v{process.env.NEXT_PUBLIC_APP_VERSION ?? "0"} · this is the empty scaffold — CMS features come next.
        </p>
      </div>
    </main>
  );
}
