"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { setupAction } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function SetupForm() {
  const router = useRouter();
  const [form, setForm] = useState({ orgName: "", name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [k]: e.target.value });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const res = await setupAction(form);
    if (res.error) {
      setError(res.error);
      setBusy(false);
      return;
    }
    router.push("/");
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <Input placeholder="Organization name" value={form.orgName} onChange={set("orgName")} required />
      <Input placeholder="Your name" value={form.name} onChange={set("name")} autoComplete="name" />
      <Input type="email" placeholder="Email" value={form.email} onChange={set("email")} autoComplete="email" required />
      <Input type="password" placeholder="Password (min 8 characters)" value={form.password} onChange={set("password")} autoComplete="new-password" required />
      {error && <p className="text-sm text-danger">{error}</p>}
      <Button type="submit" className="w-full" disabled={busy || !form.orgName || !form.email || form.password.length < 8}>
        {busy && <Loader2 size={15} className="animate-spin" />} Create workspace
      </Button>
    </form>
  );
}
