"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Mail, Loader2, Send, X, ShieldAlert } from "lucide-react";
import { sendEmailAction, emailComposeStatusAction } from "@/lib/actions/email";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";

/** Inline email composer. Sends via the org mailbox and logs the send on the
 *  contact/deal timeline. Server enforces member+ and validation; this is UX. */
export function EmailComposer({
  to: initialTo,
  contactId,
  companyId,
  dealId,
  onClose,
  onSent,
}: {
  to: string;
  contactId?: number | null;
  companyId?: number | null;
  dealId?: number | null;
  onClose: () => void;
  onSent?: () => void;
}) {
  const { toast } = useToast();
  const [status, setStatus] = useState<{ available: boolean; from: string } | null>(null);
  const [to, setTo] = useState(initialTo);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    emailComposeStatusAction().then(setStatus).catch(() => setStatus({ available: false, from: "" }));
  }, []);

  async function send() {
    setBusy(true);
    const r = await sendEmailAction({ to, subject, body, contactId, companyId, dealId });
    setBusy(false);
    if (r.error) return toast(r.error, { tone: "error" });
    toast(`Email sent to ${to}`, { tone: "success" });
    onSent?.();
    onClose();
  }

  return (
    <Card className="space-y-3 border-electric/30 p-4">
      <div className="flex items-center justify-between">
        <p className="flex items-center gap-2 text-sm font-semibold">
          <Mail size={15} className="text-electric" /> New email
          {status?.from && <span className="text-2xs font-normal text-muted-foreground">from {status.from}</span>}
        </p>
        <button onClick={onClose} className="grid h-7 w-7 place-items-center rounded text-muted-foreground hover:text-foreground"><X size={15} /></button>
      </div>

      {status && !status.available ? (
        <div className="flex items-start gap-2 rounded-lg border border-warning/40 bg-warning/5 p-3 text-2xs text-muted-foreground">
          <ShieldAlert size={14} className="mt-0.5 shrink-0 text-warning" />
          <span>No active mailbox yet. An owner can connect one in <Link href="/settings/email" className="text-electric hover:underline">Settings → Email</Link>.</span>
        </div>
      ) : (
        <>
          <label className="block text-2xs uppercase tracking-wide text-muted-foreground">
            To
            <Input type="email" value={to} onChange={(e) => setTo(e.target.value)} placeholder="name@company.com" className="mt-1" autoComplete="off" />
          </label>
          <label className="block text-2xs uppercase tracking-wide text-muted-foreground">
            Subject
            <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Subject" className="mt-1" />
          </label>
          <label className="block text-2xs uppercase tracking-wide text-muted-foreground">
            Message
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={7}
              placeholder="Write your message…"
              className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-electric"
            />
          </label>
          <div className="flex items-center justify-between gap-2">
            <p className="text-[10px] text-muted-foreground">Replies come back to you. The send is logged to the timeline.</p>
            <Button size="sm" onClick={send} disabled={busy || !to.trim() || !subject.trim() || !body.trim() || (status !== null && !status.available)}>
              {busy ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />} Send
            </Button>
          </div>
        </>
      )}
    </Card>
  );
}
