"use client";

import { useState } from "react";
import { Loader2, KeyRound } from "lucide-react";
import { changePasswordAction } from "@/lib/actions/account";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";

export function PasswordCard() {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [cur, setCur] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);

  function reset() {
    setCur("");
    setNext("");
    setConfirm("");
    setOpen(false);
  }

  async function submit() {
    if (next !== confirm) return toast("The new passwords don't match.", { tone: "error" });
    setBusy(true);
    const r = await changePasswordAction({ current: cur, next });
    setBusy(false);
    if (r.error) return toast(r.error, { tone: "error" });
    toast("Password changed — other devices signed out.", { tone: "success" });
    reset();
  }

  return (
    <Card className="space-y-3 p-4">
      <div className="flex items-center justify-between">
        <p className="flex items-center gap-2 text-sm font-semibold"><KeyRound size={15} className="text-muted-foreground" /> Password</p>
        {!open && <Button size="sm" variant="outline" onClick={() => setOpen(true)}>Change</Button>}
      </div>
      {open && (
        <div className="space-y-2">
          <Input type="password" placeholder="Current password" value={cur} onChange={(e) => setCur(e.target.value)} autoComplete="current-password" autoFocus />
          <Input type="password" placeholder="New password (min 8)" value={next} onChange={(e) => setNext(e.target.value)} autoComplete="new-password" />
          <Input type="password" placeholder="Confirm new password" value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" />
          <p className="text-2xs text-muted-foreground">Changing your password signs out your other devices.</p>
          <div className="flex justify-end gap-2">
            <Button size="sm" variant="ghost" onClick={reset}>Cancel</Button>
            <Button size="sm" onClick={submit} disabled={busy || !cur || next.length < 8 || !confirm}>
              {busy ? <Loader2 size={14} className="animate-spin" /> : null} Update password
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
