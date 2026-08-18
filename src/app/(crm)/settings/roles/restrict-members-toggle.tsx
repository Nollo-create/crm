"use client";

import { useState } from "react";
import { Lock, Loader2 } from "lucide-react";
import { setRestrictMembersAction } from "@/lib/actions/access-policy";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

/** Owner-only. Flips the org's record-level scoping. Enforced server-side in
 *  every lead/deal list, get and write path — this switch only sets the flag. */
export function RestrictMembersToggle({ initialOn }: { initialOn: boolean }) {
  const { toast } = useToast();
  const [on, setOn] = useState(initialOn);
  const [busy, setBusy] = useState(false);

  async function toggle() {
    const next = !on;
    if (typeof window !== "undefined" && next && !window.confirm("Restrict members to their own records? Each member will only see leads and deals they own or that are unassigned. Owners, admins and viewers still see everything.")) return;
    setBusy(true);
    setOn(next); // optimistic
    const r = await setRestrictMembersAction(next);
    setBusy(false);
    if (r.error) {
      setOn(!next); // revert
      return toast(r.error, { tone: "error" });
    }
    toast(next ? "Members are now restricted to their own records" : "Members can see all records again", { tone: "success" });
  }

  return (
    <Card className={cn("flex items-center gap-3 p-4", on && "border-electric/40 bg-electric/[0.03]")}>
      <span className={cn("grid h-9 w-9 shrink-0 place-items-center rounded-full", on ? "bg-electric/10 text-electric" : "bg-secondary text-muted-foreground")}><Lock size={16} /></span>
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-2 text-sm font-medium">
          Restrict members to their own records
          {on && <span className="rounded-full bg-electric/12 px-1.5 py-0.5 text-[10px] font-medium text-electric">On</span>}
        </p>
        <p className="mt-0.5 text-2xs text-muted-foreground">
          {on
            ? "Members only see leads and deals they own or that are unassigned. Owners, admins and viewers are unaffected."
            : "Members can see every lead and deal in the workspace. Turn on to scope them to their own."}
        </p>
      </div>
      <Button size="sm" variant={on ? "default" : "outline"} onClick={toggle} disabled={busy} className="shrink-0">
        {busy ? <Loader2 size={14} className="animate-spin" /> : null}
        {on ? "Turn off" : "Turn on"}
      </Button>
    </Card>
  );
}
