"use client";

import { useState } from "react";
import { Mail, Loader2, Send, ShieldAlert, CheckCircle2 } from "lucide-react";
import { saveEmailSettingsAction, sendTestEmailAction, type EmailSettingsView } from "@/lib/actions/email";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";

export function EmailForm({ data }: { data: EmailSettingsView }) {
  const { toast } = useToast();
  const [host, setHost] = useState(data.host);
  const [port, setPort] = useState(String(data.port || 587));
  const [secure, setSecure] = useState(data.secure);
  const [username, setUsername] = useState(data.username);
  const [password, setPassword] = useState("");
  const [fromName, setFromName] = useState(data.fromName);
  const [fromEmail, setFromEmail] = useState(data.fromEmail);
  const [enabled, setEnabled] = useState(data.enabled);
  const [busy, setBusy] = useState(false);

  const [testTo, setTestTo] = useState(data.fromEmail);
  const [testing, setTesting] = useState(false);
  const [hasPassword, setHasPassword] = useState(data.hasPassword);

  async function save() {
    setBusy(true);
    const r = await saveEmailSettingsAction({ host, port: Number(port), secure, username, password, fromName, fromEmail, enabled });
    setBusy(false);
    if (r.error) return toast(r.error, { tone: "error" });
    if (password) setHasPassword(true);
    setPassword("");
    toast("Mailbox saved", { tone: "success" });
  }

  async function sendTest() {
    setTesting(true);
    const r = await sendTestEmailAction(testTo);
    setTesting(false);
    if (r.error) return toast(r.error, { tone: "error" });
    toast(`Test email sent to ${testTo}`, { tone: "success" });
  }

  return (
    <div className="max-w-xl space-y-4">
      <div>
        <h1 className="flex items-center gap-2 text-xl font-semibold tracking-tight"><Mail size={18} className="text-electric" /> Email</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">Connect a mailbox so your team can send and log email from the CRM.</p>
      </div>

      {!data.cryptoConfigured && (
        <Card className="flex items-start gap-2 border-warning/40 bg-warning/5 p-3 text-2xs text-muted-foreground">
          <ShieldAlert size={14} className="mt-0.5 shrink-0 text-warning" />
          <span>Set <code className="text-foreground">MFA_ENCRYPTION_KEY</code> in the server environment first — it encrypts the mailbox password at rest. Without it you can save every field except the password.</span>
        </Card>
      )}

      <Card className="space-y-3 p-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-2xs uppercase tracking-wide text-muted-foreground">
            From name
            <Input value={fromName} onChange={(e) => setFromName(e.target.value)} placeholder="Acme Sales" className="mt-1" />
          </label>
          <label className="text-2xs uppercase tracking-wide text-muted-foreground">
            From address
            <Input type="email" value={fromEmail} onChange={(e) => setFromEmail(e.target.value)} placeholder="sales@acme.com" className="mt-1" autoComplete="off" />
          </label>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <label className="text-2xs uppercase tracking-wide text-muted-foreground sm:col-span-2">
            SMTP host
            <Input value={host} onChange={(e) => setHost(e.target.value)} placeholder="smtp.gmail.com" className="mt-1" autoComplete="off" />
          </label>
          <label className="text-2xs uppercase tracking-wide text-muted-foreground">
            Port
            <Input inputMode="numeric" value={port} onChange={(e) => setPort(e.target.value.replace(/[^0-9]/g, ""))} placeholder="587" className="mt-1" />
          </label>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-2xs uppercase tracking-wide text-muted-foreground">
            Username
            <Input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="sales@acme.com" className="mt-1" autoComplete="off" />
          </label>
          <label className="text-2xs uppercase tracking-wide text-muted-foreground">
            Password {hasPassword && <span className="text-emerald normal-case">· saved</span>}
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder={hasPassword ? "Leave blank to keep current" : "App password"} className="mt-1" autoComplete="new-password" disabled={!data.cryptoConfigured} />
          </label>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <label className="flex cursor-pointer items-center gap-1.5 text-2xs text-muted-foreground">
            <input type="checkbox" checked={secure} onChange={(e) => setSecure(e.target.checked)} className="h-3.5 w-3.5 accent-electric" />
            Use implicit TLS (port 465). Leave off for STARTTLS (587).
          </label>
        </div>
        <div className="flex flex-wrap items-center gap-4 border-t border-border pt-3">
          <label className="flex cursor-pointer items-center gap-1.5 text-sm">
            <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} className="h-4 w-4 accent-electric" />
            <span className="flex items-center gap-1">{enabled && <CheckCircle2 size={13} className="text-emerald" />} Mailbox active — the team can send from it</span>
          </label>
          <div className="ml-auto">
            <Button size="sm" onClick={save} disabled={busy || !host || !fromEmail}>{busy ? <Loader2 size={14} className="animate-spin" /> : null} Save</Button>
          </div>
        </div>
      </Card>

      <Card className="space-y-2 p-4">
        <p className="text-sm font-semibold">Send a test</p>
        <p className="text-2xs text-muted-foreground">Confirm the mailbox works before your team relies on it. Save your changes first.</p>
        <div className="flex flex-wrap items-end gap-2">
          <label className="min-w-[200px] flex-1 text-2xs uppercase tracking-wide text-muted-foreground">
            Send test to
            <Input type="email" value={testTo} onChange={(e) => setTestTo(e.target.value)} placeholder="you@acme.com" className="mt-1" autoComplete="off" />
          </label>
          <Button size="sm" variant="outline" onClick={sendTest} disabled={testing || !testTo}>{testing ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />} Send test</Button>
        </div>
      </Card>

      <p className="text-2xs text-muted-foreground">
        Common setups — <strong>Gmail/Workspace:</strong> <code>smtp.gmail.com</code>, port 587, TLS off, with an <em>app password</em> (not your login).
        <strong> Microsoft 365:</strong> <code>smtp.office365.com</code>, port 587, TLS off. <strong>Your host:</strong> the outgoing (SMTP) server from your email provider.
      </p>
    </div>
  );
}
