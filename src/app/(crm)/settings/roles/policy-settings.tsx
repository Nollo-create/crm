"use client";

import { useState } from "react";
import { Lock, ShieldCheck, Loader2, X } from "lucide-react";
import {
  setRestrictMembersAction,
  setRequireAdminMfaAction,
  type PolicyStatus,
} from "@/lib/actions/access-policy";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

type PolicyKey = "restrict" | "mfa";

/** Owner-only org security policies. Each change is a step-up action: we ask for
 *  the owner's authenticator code (or password) inline before applying. The
 *  server re-verifies — this prompt is the UX, not the boundary. */
export function PolicySettings({ initial }: { initial: PolicyStatus }) {
  const { toast } = useToast();
  const [restrict, setRestrict] = useState(initial.restrictMembers);
  const [mfa, setMfa] = useState(initial.requireAdminMfa);
  const [open, setOpen] = useState<PolicyKey | null>(null); // which prompt is showing
  const [credential, setCredential] = useState("");
  const [busy, setBusy] = useState(false);

  const askCode = initial.stepUp === "code";
  const state = { restrict, mfa };
  const targetOn = open ? !state[open] : false;

  function begin(key: PolicyKey) {
    if (key === "mfa" && !mfa && !initial.selfHasMfa) {
      return toast("Turn on two-factor for your own account first (Account Security).", { tone: "error" });
    }
    setOpen(key);
    setCredential("");
  }

  async function confirm() {
    if (!open) return;
    setBusy(true);
    const next = !state[open];
    const r = open === "restrict" ? await setRestrictMembersAction(next, credential) : await setRequireAdminMfaAction(next, credential);
    setBusy(false);
    if (r.error) return toast(r.error, { tone: "error" });
    if (open === "restrict") setRestrict(next);
    else setMfa(next);
    setOpen(null);
    setCredential("");
    toast("Policy updated", { tone: "success" });
  }

  const rows: { key: PolicyKey; icon: typeof Lock; on: boolean; label: string; onDesc: string; offDesc: string }[] = [
    {
      key: "restrict",
      icon: Lock,
      on: restrict,
      label: "Restrict members to their own records",
      onDesc: "Members only see leads and deals they own or that are unassigned. Owners, admins and viewers are unaffected.",
      offDesc: "Members can see every lead and deal in the workspace. Turn on to scope them to their own.",
    },
    {
      key: "mfa",
      icon: ShieldCheck,
      on: mfa,
      label: "Require two-factor for admins",
      onDesc: "Every admin and owner must have two-factor on to manage the organization. Enforced on every settings write.",
      offDesc: "Admins can manage the organization without two-factor. Turn on to require it.",
    },
  ];

  return (
    <div className="space-y-2">
      {rows.map((row) => {
        const Icon = row.icon;
        const promptHere = open === row.key;
        return (
          <Card key={row.key} className={cn("p-4", row.on && "border-electric/40 bg-electric/[0.03]")}>
            <div className="flex items-center gap-3">
              <span className={cn("grid h-9 w-9 shrink-0 place-items-center rounded-full", row.on ? "bg-electric/10 text-electric" : "bg-secondary text-muted-foreground")}><Icon size={16} /></span>
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-2 text-sm font-medium">
                  {row.label}
                  {row.on && <span className="rounded-full bg-electric/12 px-1.5 py-0.5 text-[10px] font-medium text-electric">On</span>}
                </p>
                <p className="mt-0.5 text-2xs text-muted-foreground">{row.on ? row.onDesc : row.offDesc}</p>
              </div>
              {!promptHere && (
                <Button size="sm" variant={row.on ? "default" : "outline"} onClick={() => begin(row.key)} className="shrink-0">
                  {row.on ? "Turn off" : "Turn on"}
                </Button>
              )}
            </div>

            {promptHere && (
              <div className="mt-3 flex flex-wrap items-end gap-2 border-t border-border pt-3">
                <label className="min-w-[180px] flex-1 text-2xs uppercase tracking-wide text-muted-foreground">
                  {askCode ? "Authenticator code" : "Your password"} — confirm to {targetOn ? "turn on" : "turn off"}
                  <Input
                    type={askCode ? "text" : "password"}
                    inputMode={askCode ? "numeric" : undefined}
                    autoFocus
                    value={credential}
                    onChange={(e) => setCredential(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && credential && !busy && confirm()}
                    placeholder={askCode ? "6-digit code" : "Confirm it's you"}
                    className="mt-1"
                    autoComplete={askCode ? "one-time-code" : "current-password"}
                  />
                </label>
                <Button size="sm" onClick={confirm} disabled={busy || !credential} className="shrink-0">
                  {busy ? <Loader2 size={14} className="animate-spin" /> : null} Confirm
                </Button>
                <Button size="sm" variant="ghost" onClick={() => { setOpen(null); setCredential(""); }} disabled={busy} className="shrink-0">
                  <X size={14} /> Cancel
                </Button>
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}
