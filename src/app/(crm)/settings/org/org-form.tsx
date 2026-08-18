"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2, CreditCard, Users2, ShieldCheck, CalendarDays } from "lucide-react";
import { updateOrgAction, type OrgSettings } from "@/lib/actions/settings";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { timeAgo } from "@/lib/format";

export function OrgForm({ data }: { data: OrgSettings }) {
  const { toast } = useToast();
  const [name, setName] = useState(data.name);
  const [slug, setSlug] = useState(data.slug);
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true);
    const r = await updateOrgAction({ name, slug });
    setBusy(false);
    if (r.error) toast(r.error, { tone: "error" });
    else toast("Organization updated", { tone: "success" });
  }

  return (
    <div className="max-w-xl space-y-4">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Organization</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">Your workspace details.</p>
      </div>

      {/* Overview */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Link href="/settings/billing" className="group rounded-lg border border-border bg-card px-3 py-2.5 transition-colors hover:border-electric/40">
          <p className="flex items-center gap-1 text-2xs uppercase tracking-wide text-muted-foreground"><CreditCard size={11} /> Plan</p>
          <p className="mt-0.5 text-sm font-semibold">{data.planName}</p>
        </Link>
        <Link href="/settings/users" className="group rounded-lg border border-border bg-card px-3 py-2.5 transition-colors hover:border-electric/40">
          <p className="flex items-center gap-1 text-2xs uppercase tracking-wide text-muted-foreground"><Users2 size={11} /> Members</p>
          <p className="mt-0.5 text-sm font-semibold tabular">{data.userCount}</p>
        </Link>
        <div className="rounded-lg border border-border bg-card px-3 py-2.5">
          <p className="flex items-center gap-1 text-2xs uppercase tracking-wide text-muted-foreground"><ShieldCheck size={11} /> Your role</p>
          <p className="mt-0.5 text-sm font-semibold">{data.roleName}</p>
        </div>
        <div className="rounded-lg border border-border bg-card px-3 py-2.5">
          <p className="flex items-center gap-1 text-2xs uppercase tracking-wide text-muted-foreground"><CalendarDays size={11} /> Created</p>
          <p className="mt-0.5 text-sm font-semibold">{timeAgo(data.createdAt)}</p>
        </div>
      </div>

      <Card className="space-y-3 p-4">
        <label className="block text-2xs uppercase tracking-wide text-muted-foreground">
          Name
          <Input value={name} onChange={(e) => setName(e.target.value)} disabled={!data.canManage} className="mt-1" />
        </label>
        <label className="block text-2xs uppercase tracking-wide text-muted-foreground">
          Workspace URL (slug)
          <Input value={slug} onChange={(e) => setSlug(e.target.value)} disabled={!data.canManage} className="mt-1" />
        </label>
        {!data.canManage && <p className="text-2xs text-muted-foreground">Only an owner can change these.</p>}
        <div className="flex items-center justify-between border-t border-border pt-3">
          <span className="text-2xs text-muted-foreground">
            {data.userCount} member{data.userCount === 1 ? "" : "s"} · created {timeAgo(data.createdAt)}
          </span>
          {data.canManage && (
            <Button size="sm" onClick={save} disabled={busy || !name.trim()}>
              {busy ? <Loader2 size={14} className="animate-spin" /> : null} Save
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}
