"use client";

import { useState } from "react";
import { Siren, LogOut, Plug, Sparkles, Workflow, Loader2 } from "lucide-react";
import { setEmergencyFlagAction, forceLogoutOrgAction, type EmergencyStatus } from "@/lib/actions/emergency";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

type FlagKey = "api" | "ai" | "automations";

const SWITCHES: { key: FlagKey; icon: typeof Plug; label: string; on: string; off: string }[] = [
  { key: "api", icon: Plug, label: "API access", on: "All API keys are frozen — every request is rejected until you resume.", off: "API keys work normally." },
  { key: "ai", icon: Sparkles, label: "AI features", on: "AI generation is paused for the whole workspace.", off: "AI features run normally." },
  { key: "automations", icon: Workflow, label: "Automations", on: "Scheduled automations won't run until resumed.", off: "Automations run on schedule." },
];

export function EmergencyControls({ initial }: { initial: EmergencyStatus }) {
  const { toast } = useToast();
  const [flags, setFlags] = useState({ api: initial.apiFrozen, ai: initial.aiPaused, automations: initial.automationsPaused });
  const [busy, setBusy] = useState<FlagKey | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);

  async function toggle(key: FlagKey) {
    const next = !flags[key];
    if (typeof window !== "undefined" && next && !window.confirm(`Turn OFF ${SWITCHES.find((s) => s.key === key)!.label.toLowerCase()} for the whole workspace?`)) return;
    setBusy(key);
    setFlags((f) => ({ ...f, [key]: next })); // optimistic
    const r = await setEmergencyFlagAction(key, next);
    setBusy(null);
    if (r.error) {
      setFlags((f) => ({ ...f, [key]: !next })); // revert
      return toast(r.error, { tone: "error" });
    }
    toast(next ? "Turned off" : "Resumed", { tone: "success" });
  }

  async function forceLogout() {
    if (typeof window !== "undefined" && !window.confirm("Sign out every other device across the whole workspace? Everyone will have to sign in again.")) return;
    setLoggingOut(true);
    const r = await forceLogoutOrgAction();
    setLoggingOut(false);
    if (r.error) return toast(r.error, { tone: "error" });
    toast(r.count > 0 ? `Signed out ${r.count} session${r.count === 1 ? "" : "s"}` : "No other sessions", { tone: "success" });
  }

  return (
    <div className="max-w-2xl space-y-4">
      <div>
        <h1 className="flex items-center gap-2 text-xl font-semibold tracking-tight"><Siren size={18} className="text-danger" /> Emergency controls</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">Owner-only incident response. Each switch is enforced on the server, not just hidden here.</p>
      </div>

      {/* Force sign-out */}
      <Card className="flex flex-wrap items-center justify-between gap-3 p-4">
        <div className="flex items-start gap-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-danger/10 text-danger"><LogOut size={16} /></span>
          <div>
            <p className="text-sm font-medium">Sign out everyone</p>
            <p className="mt-0.5 text-2xs text-muted-foreground">Revoke all other sessions ({initial.activeSessions} active now). Your current device stays signed in.</p>
          </div>
        </div>
        <Button size="sm" variant="outline" onClick={forceLogout} disabled={loggingOut} className="text-danger hover:text-danger">
          {loggingOut ? <Loader2 size={14} className="animate-spin" /> : <LogOut size={14} />} Sign out all
        </Button>
      </Card>

      {/* Kill switches */}
      <div className="space-y-2">
        {SWITCHES.map((s) => {
          const on = flags[s.key]; // "on" here means the feature is FROZEN/paused
          const Icon = s.icon;
          return (
            <Card key={s.key} className={cn("flex items-center gap-3 p-4", on && "border-danger/40 bg-danger/[0.03]")}>
              <span className={cn("grid h-9 w-9 shrink-0 place-items-center rounded-full", on ? "bg-danger/10 text-danger" : "bg-secondary text-muted-foreground")}><Icon size={16} /></span>
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-2 text-sm font-medium">
                  {s.label}
                  {on && <span className="rounded-full bg-danger/12 px-1.5 py-0.5 text-[10px] font-medium text-danger">{s.key === "api" ? "Frozen" : "Paused"}</span>}
                </p>
                <p className="mt-0.5 text-2xs text-muted-foreground">{on ? s.on : s.off}</p>
              </div>
              <Button
                size="sm"
                variant={on ? "default" : "outline"}
                onClick={() => toggle(s.key)}
                disabled={busy === s.key}
                className={cn("shrink-0", !on && "text-danger hover:text-danger")}
              >
                {busy === s.key ? <Loader2 size={14} className="animate-spin" /> : null}
                {on ? "Resume" : s.key === "api" ? "Freeze" : "Pause"}
              </Button>
            </Card>
          );
        })}
      </div>

      <p className="text-2xs text-muted-foreground">Every change here is written to the audit log. Freezing/pausing takes effect immediately for new requests.</p>
    </div>
  );
}
