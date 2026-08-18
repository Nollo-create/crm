"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ShieldCheck } from "lucide-react";
import { loginAction, verifyLoginMfaAction } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  // Second step (only for 2FA accounts).
  const [mfa, setMfa] = useState(false);
  const [code, setCode] = useState("");

  function done() {
    router.push("/");
    router.refresh();
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const res = await loginAction({ email, password });
    setBusy(false);
    if (res.error) return setError(res.error);
    if (res.mfaRequired) {
      setMfa(true);
      return;
    }
    done();
  }

  async function submitMfa(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const res = await verifyLoginMfaAction({ code });
    setBusy(false);
    if (res.error) return setError(res.error);
    done();
  }

  if (mfa) {
    return (
      <form onSubmit={submitMfa} className="space-y-3">
        <div className="flex items-center gap-2 rounded-lg border border-border bg-secondary/40 px-3 py-2 text-2xs text-muted-foreground">
          <ShieldCheck size={14} className="text-electric" /> Enter the 6-digit code from your authenticator app (or a recovery code).
        </div>
        <Input
          inputMode="text"
          autoComplete="one-time-code"
          placeholder="123 456"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          autoFocus
          required
        />
        {error && <p className="text-sm text-danger">{error}</p>}
        <Button type="submit" className="w-full" disabled={busy || !code.trim()}>
          {busy && <Loader2 size={15} className="animate-spin" />} Verify
        </Button>
        <button type="button" onClick={() => { setMfa(false); setCode(""); setError(""); setPassword(""); }} className="w-full text-center text-2xs text-muted-foreground hover:text-foreground">
          Back to sign in
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <Input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required />
      <Input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required />
      {error && <p className="text-sm text-danger">{error}</p>}
      <Button type="submit" className="w-full" disabled={busy || !email || !password}>
        {busy && <Loader2 size={15} className="animate-spin" />} Sign in
      </Button>
    </form>
  );
}
