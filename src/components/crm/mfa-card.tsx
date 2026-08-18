"use client";

import { useEffect, useState } from "react";
import { ShieldCheck, ShieldAlert, Loader2, Copy, Check, KeyRound } from "lucide-react";
import { mfaStatusAction, beginMfaEnrollAction, confirmMfaEnrollAction, disableMfaAction, regenerateRecoveryCodesAction, type MfaStatus } from "@/lib/actions/mfa";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";

function RecoveryCodes({ codes, onDone }: { codes: string[]; onDone: () => void }) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(codes.join("\n"));
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast("Copy failed — select them manually", { tone: "error" });
    }
  }
  return (
    <div className="space-y-3 rounded-lg border border-emerald/40 bg-emerald/5 p-3">
      <p className="flex items-center gap-1.5 text-sm font-semibold text-emerald"><KeyRound size={15} /> Recovery codes</p>
      <p className="text-2xs text-muted-foreground">Save these somewhere safe. Each works once if you lose your authenticator. They won&apos;t be shown again.</p>
      <div className="grid grid-cols-2 gap-1.5 font-mono text-xs">
        {codes.map((c) => <span key={c} className="rounded bg-background px-2 py-1 text-center">{c}</span>)}
      </div>
      <div className="flex justify-between">
        <Button size="sm" variant="outline" onClick={copy}>{copied ? <Check size={14} className="text-emerald" /> : <Copy size={14} />} {copied ? "Copied" : "Copy all"}</Button>
        <Button size="sm" onClick={onDone}>I&apos;ve saved them</Button>
      </div>
    </div>
  );
}

export function MfaCard() {
  const { toast } = useToast();
  const [status, setStatus] = useState<MfaStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  // enrollment
  const [enroll, setEnroll] = useState<{ secret: string; formatted: string; otpauth: string } | null>(null);
  const [code, setCode] = useState("");
  const [newCodes, setNewCodes] = useState<string[] | null>(null);
  const [copiedSecret, setCopiedSecret] = useState(false);

  // manage (enabled)
  const [pending, setPending] = useState<null | "disable" | "regen">(null);
  const [manageCode, setManageCode] = useState("");

  function load() {
    setLoading(true);
    mfaStatusAction().then(setStatus).catch(() => setStatus(null)).finally(() => setLoading(false));
  }
  useEffect(() => { load(); }, []);

  function resetEnroll() {
    setEnroll(null);
    setCode("");
  }

  async function begin() {
    setBusy(true);
    const r = await beginMfaEnrollAction();
    setBusy(false);
    if (r.error) return toast(r.error, { tone: "error" });
    setEnroll({ secret: r.secret!, formatted: r.formatted!, otpauth: r.otpauth! });
  }

  async function confirm() {
    setBusy(true);
    const r = await confirmMfaEnrollAction(code);
    setBusy(false);
    if (r.error) return toast(r.error, { tone: "error" });
    setEnroll(null);
    setCode("");
    setNewCodes(r.recoveryCodes ?? []);
    load();
  }

  async function runManage() {
    if (!pending) return;
    setBusy(true);
    const r = pending === "disable" ? await disableMfaAction(manageCode) : await regenerateRecoveryCodesAction(manageCode);
    setBusy(false);
    if (r.error) return toast(r.error, { tone: "error" });
    setPending(null);
    setManageCode("");
    if (pending === "disable") {
      toast("Two-factor disabled", { tone: "success" });
    } else {
      setNewCodes((r as { recoveryCodes?: string[] }).recoveryCodes ?? []);
    }
    load();
  }

  async function copySecret() {
    if (!enroll) return;
    try {
      await navigator.clipboard.writeText(enroll.secret);
      setCopiedSecret(true);
      setTimeout(() => setCopiedSecret(false), 1500);
    } catch {
      /* ignore */
    }
  }

  const title = (
    <p className="flex items-center gap-2 text-sm font-semibold">
      <ShieldCheck size={15} className={status?.enabled ? "text-emerald" : "text-muted-foreground"} /> Two-factor authentication
    </p>
  );

  if (loading) {
    return <Card className="p-4"><div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 size={14} className="animate-spin" /> Loading…</div></Card>;
  }

  // Server can't do MFA (no encryption key) — honest, no fake control.
  if (status && !status.configured) {
    return (
      <Card className="space-y-1.5 p-4">
        {title}
        <p className="flex items-center gap-1.5 text-2xs text-warning"><ShieldAlert size={13} /> Not available on this server yet.</p>
        <p className="text-2xs text-muted-foreground">An owner needs to set <code className="text-foreground">MFA_ENCRYPTION_KEY</code> in the server environment to enable authenticator-based two-factor.</p>
      </Card>
    );
  }

  // Just generated a fresh set of recovery codes (enroll or regenerate).
  if (newCodes) {
    return <Card className="space-y-3 p-4">{title}<RecoveryCodes codes={newCodes} onDone={() => setNewCodes(null)} /></Card>;
  }

  // Mid-enrollment.
  if (enroll) {
    return (
      <Card className="space-y-3 p-4">
        {title}
        <p className="text-2xs text-muted-foreground">Add this account to an authenticator app (Google Authenticator, 1Password, Authy…), then enter the 6-digit code it shows.</p>
        <div className="space-y-1">
          <p className="text-2xs uppercase tracking-wide text-muted-foreground">Setup key (type it into the app)</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 overflow-x-auto rounded-lg border border-border bg-background px-3 py-2 font-mono text-sm tracking-wider">{enroll.formatted}</code>
            <Button size="sm" variant="outline" onClick={copySecret}>{copiedSecret ? <Check size={14} className="text-emerald" /> : <Copy size={14} />}</Button>
          </div>
          <p className="break-all text-[10px] text-muted-foreground">Or open: {enroll.otpauth}</p>
        </div>
        <div className="flex items-end gap-2">
          <label className="flex-1 text-2xs uppercase tracking-wide text-muted-foreground">
            6-digit code
            <Input value={code} onChange={(e) => setCode(e.target.value)} inputMode="numeric" placeholder="123456" className="mt-1" autoFocus />
          </label>
          <Button size="sm" onClick={confirm} disabled={busy || code.trim().length < 6}>{busy ? <Loader2 size={14} className="animate-spin" /> : null} Turn on</Button>
        </div>
        <button onClick={resetEnroll} className="text-2xs text-muted-foreground hover:text-foreground">Cancel</button>
      </Card>
    );
  }

  // Enabled — manage.
  if (status?.enabled) {
    return (
      <Card className="space-y-3 p-4">
        {title}
        <p className="flex items-center gap-1.5 text-2xs text-emerald"><Check size={13} /> On — your account asks for a code at sign-in. {status.recoveryRemaining} recovery code{status.recoveryRemaining === 1 ? "" : "s"} left.</p>
        {pending ? (
          <div className="space-y-2 rounded-lg border border-border p-3">
            <p className="text-2xs text-muted-foreground">{pending === "disable" ? "Enter a current code to turn two-factor off." : "Enter a current code to generate new recovery codes."}</p>
            <div className="flex items-end gap-2">
              <Input value={manageCode} onChange={(e) => setManageCode(e.target.value)} placeholder="Code or recovery code" className="flex-1" autoFocus />
              <Button size="sm" variant={pending === "disable" ? "outline" : "default"} onClick={runManage} disabled={busy || !manageCode.trim()}>{busy ? <Loader2 size={14} className="animate-spin" /> : null} Confirm</Button>
            </div>
            <button onClick={() => { setPending(null); setManageCode(""); }} className="text-2xs text-muted-foreground hover:text-foreground">Cancel</button>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={() => setPending("regen")}>Regenerate recovery codes</Button>
            <Button size="sm" variant="outline" onClick={() => setPending("disable")} className="text-danger hover:text-danger">Disable</Button>
          </div>
        )}
      </Card>
    );
  }

  // Disabled — offer setup.
  return (
    <Card className="space-y-2 p-4">
      {title}
      <p className="text-2xs text-muted-foreground">Add a second step at sign-in with an authenticator app. Strongly recommended for admins.</p>
      <Button size="sm" onClick={begin} disabled={busy}>{busy ? <Loader2 size={14} className="animate-spin" /> : <ShieldCheck size={14} />} Set up two-factor</Button>
    </Card>
  );
}
