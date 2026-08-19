"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ShieldCheck, Eye, EyeOff, Check, ArrowLeft } from "lucide-react";
import { loginAction, verifyLoginMfaAction } from "@/lib/actions/auth";
import { cn } from "@/lib/utils";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const inputBase =
  "h-11 w-full rounded-xl border bg-white/[0.04] px-3.5 text-sm text-white placeholder-slate-500 outline-none transition-all focus:bg-white/[0.06] focus:ring-2";

function fieldClass(err?: string) {
  return cn(inputBase, err ? "border-danger/60 focus:border-danger focus:ring-danger/25" : "border-white/10 focus:border-electric focus:ring-electric/30");
}

export function LoginForm({ startMfa = false }: { startMfa?: boolean }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState("");
  const [errs, setErrs] = useState<{ email?: string; password?: string }>({});
  const [busy, setBusy] = useState(false);

  const [mfa, setMfa] = useState(startMfa);
  const [code, setCode] = useState("");
  const [forgot, setForgot] = useState(false);

  function done() {
    router.push("/");
    router.refresh();
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const next: { email?: string; password?: string } = {};
    if (!EMAIL_RE.test(email.trim())) next.email = "Enter a valid email address.";
    if (!password) next.password = "Enter your password.";
    setErrs(next);
    if (next.email || next.password) return;

    setBusy(true);
    setError("");
    const res = await loginAction({ email, password, remember });
    setBusy(false);
    if (res.error) return setError(res.error);
    if (res.mfaRequired) return setMfa(true);
    done();
  }

  async function submitMfa(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const res = await verifyLoginMfaAction({ code, remember });
    setBusy(false);
    if (res.error) return setError(res.error);
    done();
  }

  if (mfa) {
    return (
      <form onSubmit={submitMfa} className="space-y-4">
        <div className="flex items-start gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-xs text-slate-300">
          <ShieldCheck size={15} className="mt-0.5 shrink-0 text-electric" /> Enter the 6-digit code from your authenticator app (or a recovery code).
        </div>
        <input
          inputMode="text"
          autoComplete="one-time-code"
          placeholder="123 456"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          autoFocus
          required
          className={cn(fieldClass(), "text-center text-lg tracking-[0.3em]")}
          aria-label="Authentication code"
        />
        {error && <p className="text-sm text-[#ffa3b6]">{error}</p>}
        <SubmitButton busy={busy} disabled={!code.trim()} label="Verify" busyLabel="Verifying…" />
        <button
          type="button"
          onClick={() => { setMfa(false); setCode(""); setError(""); setPassword(""); }}
          className="flex w-full items-center justify-center gap-1.5 text-xs text-slate-400 transition-colors hover:text-white"
        >
          <ArrowLeft size={13} /> Back to sign in
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      <div>
        <label className="mb-1.5 block text-xs font-medium text-slate-300" htmlFor="email">Email address</label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="you@company.com"
          value={email}
          onChange={(e) => { setEmail(e.target.value); if (errs.email) setErrs((s) => ({ ...s, email: undefined })); }}
          aria-invalid={!!errs.email}
          className={fieldClass(errs.email)}
        />
        {errs.email && <p className="mt-1.5 text-xs text-[#ffa3b6]">{errs.email}</p>}
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-medium text-slate-300" htmlFor="password">Password</label>
        <div className="relative">
          <input
            id="password"
            type={showPw ? "text" : "password"}
            autoComplete="current-password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => { setPassword(e.target.value); if (errs.password) setErrs((s) => ({ ...s, password: undefined })); }}
            aria-invalid={!!errs.password}
            className={cn(fieldClass(errs.password), "pr-11")}
          />
          <button
            type="button"
            onClick={() => setShowPw((v) => !v)}
            aria-label={showPw ? "Hide password" : "Show password"}
            className="absolute right-1 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-lg text-slate-400 transition-colors hover:text-white"
          >
            {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
        {errs.password && <p className="mt-1.5 text-xs text-[#ffa3b6]">{errs.password}</p>}
      </div>

      <div className="flex items-center justify-between">
        <label className="flex cursor-pointer select-none items-center gap-2 text-xs text-slate-300">
          <button
            type="button"
            role="checkbox"
            aria-checked={remember}
            onClick={() => setRemember((v) => !v)}
            className={cn(
              "grid h-4 w-4 place-items-center rounded border transition-colors",
              remember ? "border-electric bg-electric text-white" : "border-white/25 bg-white/[0.04]"
            )}
          >
            {remember && <Check size={11} strokeWidth={3} />}
          </button>
          Remember me
        </label>
        <button type="button" onClick={() => setForgot((v) => !v)} className="text-xs text-slate-400 transition-colors hover:text-electric">
          Forgot password?
        </button>
      </div>

      {forgot && (
        <p className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-slate-400">
          Password resets are handled by your administrator — reach out to them to get a new one.
        </p>
      )}

      {error && <p className="text-sm text-[#ffa3b6]">{error}</p>}

      <SubmitButton busy={busy} disabled={!email || !password} label="Sign in" busyLabel="Signing in…" />
    </form>
  );
}

function SubmitButton({ busy, disabled, label, busyLabel }: { busy: boolean; disabled: boolean; label: string; busyLabel: string }) {
  return (
    <button
      type="submit"
      disabled={busy || disabled}
      className="group relative flex h-11 w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-electric to-royal text-sm font-semibold text-white shadow-[0_10px_30px_-8px_rgba(79,140,255,0.6)] transition-all hover:shadow-[0_14px_38px_-8px_rgba(124,92,255,0.75)] hover:brightness-110 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none"
    >
      {busy ? (
        <><Loader2 size={16} className="animate-spin" /> {busyLabel}</>
      ) : (
        label
      )}
    </button>
  );
}
