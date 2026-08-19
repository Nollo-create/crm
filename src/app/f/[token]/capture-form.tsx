"use client";

import { useState } from "react";
import { Loader2, CheckCircle2, Send } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  token: string;
  title: string;
  description: string;
  requireCompany: boolean;
  successMessage: string;
  redirectUrl: string;
  embed: boolean;
}

const field = "w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-electric";

export function CaptureForm({ token, title, description, requireCompany, successMessage, redirectUrl, embed }: Props) {
  const [form, setForm] = useState({ name: "", email: "", company: "", phone: "", message: "", company_url: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  function set(k: keyof typeof form, v: string) {
    setForm((s) => ({ ...s, [k]: v }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!form.name.trim() && !form.email.trim()) {
      setError("Please enter your name or email.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(`/api/forms/${encodeURIComponent(token)}/submit`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        setError(data.error || "Something went wrong. Please try again.");
        setBusy(false);
        return;
      }
      if (redirectUrl) {
        window.location.href = redirectUrl;
        return;
      }
      setDone(true);
    } catch {
      setError("Network error. Please try again.");
      setBusy(false);
    }
  }

  const card = cn(
    "w-full max-w-md text-foreground",
    !embed && "rounded-2xl border border-border bg-card p-6 shadow-card"
  );

  if (done) {
    return (
      <div className={card}>
        <div className="flex flex-col items-center gap-3 py-6 text-center">
          <span className="grid h-12 w-12 place-items-center rounded-full bg-emerald/12 text-emerald"><CheckCircle2 size={26} /></span>
          <p className="text-sm font-medium">{successMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className={card}>
      {title && <h1 className="text-lg font-semibold tracking-tight">{title}</h1>}
      {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}

      <div className="mt-4 space-y-2.5">
        <input className={field} placeholder="Your name" value={form.name} onChange={(e) => set("name", e.target.value)} autoComplete="name" />
        <input className={field} type="email" placeholder="Email" value={form.email} onChange={(e) => set("email", e.target.value)} autoComplete="email" />
        <input className={field} placeholder={requireCompany ? "Company *" : "Company"} value={form.company} onChange={(e) => set("company", e.target.value)} autoComplete="organization" />
        <input className={field} placeholder="Phone" value={form.phone} onChange={(e) => set("phone", e.target.value)} autoComplete="tel" />
        <textarea className={cn(field, "min-h-[90px] resize-y")} placeholder="How can we help?" value={form.message} onChange={(e) => set("message", e.target.value)} />

        {/* Honeypot — hidden from real users, catches bots that fill every field. */}
        <input
          type="text"
          name="company_url"
          value={form.company_url}
          onChange={(e) => set("company_url", e.target.value)}
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          className="absolute left-[-9999px] h-0 w-0 opacity-0"
        />
      </div>

      {error && <p className="mt-3 text-xs text-danger">{error}</p>}

      <button
        type="submit"
        disabled={busy}
        className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-electric px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
      >
        {busy ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />} Submit
      </button>

      <p className="mt-3 text-center text-2xs text-muted-foreground">
        Powered by <span className="font-medium text-foreground">Sajtpress</span>
      </p>
    </form>
  );
}
