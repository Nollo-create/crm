"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Check, CreditCard, Info, TrendingUp } from "lucide-react";
import { setPlanAction, updateBillingInfoAction, type BillingData } from "@/lib/actions/billing";
import { RESOURCES, formatLimit, type UsageState } from "@/lib/crm/billing";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

const BAR: Record<UsageState, string> = { ok: "bg-electric", warn: "bg-amber-500", over: "bg-danger" };
const TEXT: Record<UsageState, string> = { ok: "text-muted-foreground", warn: "text-amber-500", over: "text-danger" };

export function BillingManager({ data }: { data: BillingData }) {
  const { toast } = useToast();
  const router = useRouter();
  const [switching, setSwitching] = useState<string | null>(null);

  // billing details form
  const [name, setName] = useState(data.billing.name);
  const [email, setEmail] = useState(data.billing.email);
  const [address, setAddress] = useState(data.billing.address);
  const [taxId, setTaxId] = useState(data.billing.taxId);
  const [savingInfo, setSavingInfo] = useState(false);

  async function switchPlan(key: string) {
    if (key === data.planKey) return;
    setSwitching(key);
    const r = await setPlanAction(key);
    setSwitching(null);
    if (r.error) return toast(r.error, { tone: "error" });
    toast("Plan updated", { tone: "success" });
    router.refresh();
  }

  async function saveInfo() {
    setSavingInfo(true);
    const r = await updateBillingInfoAction({ name, email, address, taxId });
    setSavingInfo(false);
    if (r.error) return toast(r.error, { tone: "error" });
    toast("Billing details saved", { tone: "success" });
  }

  const priceLabel = data.plan.priceEur === 0 ? "Free" : `€${data.plan.priceEur}/mo`;

  return (
    <div className="max-w-4xl space-y-4">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Billing &amp; usage</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">Your plan, how much of it you&apos;re using, and billing details.</p>
      </div>

      {/* Current plan + usage */}
      <Card className="space-y-4 p-4">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <p className="text-2xs uppercase tracking-wide text-muted-foreground">Current plan</p>
            <p className="mt-0.5 text-lg font-semibold">
              {data.plan.name} <span className="text-sm font-normal text-muted-foreground">· {priceLabel}</span>
            </p>
            <p className="text-2xs text-muted-foreground">{data.plan.tagline}</p>
          </div>
          <span className="inline-flex items-center gap-1 rounded-full bg-royal/12 px-2.5 py-1 text-2xs font-medium text-royal">
            <TrendingUp size={12} /> {data.plan.key === "business" ? "Top tier" : "Room to grow"}
          </span>
        </div>

        <div className="space-y-2.5 border-t border-border pt-3">
          {data.usage.map((u) => (
            <div key={u.resource}>
              <div className="flex items-center justify-between text-2xs">
                <span className="text-muted-foreground">{u.label}</span>
                <span className={cn("font-medium tabular", TEXT[u.status.state])}>
                  {u.used.toLocaleString("en-US")}
                  <span className="text-muted-foreground"> / {formatLimit(u.limit)}</span>
                </span>
              </div>
              <div className="mt-1 h-2 overflow-hidden rounded-full bg-secondary">
                <div
                  className={cn("h-full rounded-full transition-all", u.status.unlimited ? "bg-emerald/40" : BAR[u.status.state])}
                  style={{ width: u.status.unlimited ? "100%" : `${Math.max(2, u.status.pct)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
        {data.usage.some((u) => u.status.state === "over") && (
          <p className="text-2xs text-danger">You&apos;ve passed a plan limit. Limits are advisory today — upgrade to raise them.</p>
        )}
      </Card>

      {/* Plans */}
      <div>
        <p className="mb-2 text-sm font-semibold">Plans</p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {data.plans.map((p) => {
            const current = p.key === data.planKey;
            return (
              <Card key={p.key} className={cn("flex flex-col p-3.5", p.highlight && "ring-1 ring-electric/40", current && "border-electric")}>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold">{p.name}</p>
                  {current && <span className="rounded-full bg-electric/12 px-2 py-0.5 text-[10px] font-medium text-electric">Current</span>}
                </div>
                <p className="mt-1 text-lg font-semibold tabular">
                  {p.priceEur === 0 ? "Free" : <>€{p.priceEur}<span className="text-2xs font-normal text-muted-foreground">/mo</span></>}
                </p>
                <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">{p.tagline}</p>
                <ul className="mt-2.5 space-y-1 border-t border-border pt-2.5">
                  {RESOURCES.map((r) => (
                    <li key={r.key} className="flex items-center justify-between text-[11px]">
                      <span className="text-muted-foreground">{r.label}</span>
                      <span className="font-medium tabular">{formatLimit(p.limits[r.key])}</span>
                    </li>
                  ))}
                </ul>
                <ul className="mt-2.5 flex-1 space-y-1">
                  {p.features.map((f) => (
                    <li key={f} className="flex gap-1.5 text-[11px] leading-snug">
                      <Check size={12} className="mt-0.5 shrink-0 text-emerald" /> <span>{f}</span>
                    </li>
                  ))}
                </ul>
                {data.canManage ? (
                  <Button
                    size="sm"
                    variant={current ? "outline" : "default"}
                    className="mt-3 w-full"
                    disabled={current || switching !== null}
                    onClick={() => switchPlan(p.key)}
                  >
                    {switching === p.key ? <Loader2 size={14} className="animate-spin" /> : null}
                    {current ? "Current plan" : `Switch to ${p.name}`}
                  </Button>
                ) : (
                  <div className="mt-3 text-center text-[10px] text-muted-foreground">{current ? "Current plan" : ""}</div>
                )}
              </Card>
            );
          })}
        </div>
        {data.canManage && (
          <p className="mt-2 flex items-center gap-1.5 text-2xs text-muted-foreground">
            <Info size={12} /> Selecting a plan sets your tier. No card is charged — automated billing isn&apos;t connected yet.
          </p>
        )}
      </div>

      {/* Billing details */}
      <Card className="space-y-3 p-4">
        <div>
          <p className="text-sm font-semibold">Billing details</p>
          <p className="text-2xs text-muted-foreground">Used on invoices once billing is connected.</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-2xs uppercase tracking-wide text-muted-foreground">
            Company / legal name
            <Input value={name} onChange={(e) => setName(e.target.value)} disabled={!data.canManage} className="mt-1" placeholder="Acme d.o.o." />
          </label>
          <label className="block text-2xs uppercase tracking-wide text-muted-foreground">
            Billing email
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} disabled={!data.canManage} className="mt-1" placeholder="billing@acme.rs" />
          </label>
          <label className="block text-2xs uppercase tracking-wide text-muted-foreground">
            Tax ID / PIB
            <Input value={taxId} onChange={(e) => setTaxId(e.target.value)} disabled={!data.canManage} className="mt-1" placeholder="100000000" />
          </label>
          <label className="block text-2xs uppercase tracking-wide text-muted-foreground">
            Address
            <Input value={address} onChange={(e) => setAddress(e.target.value)} disabled={!data.canManage} className="mt-1" placeholder="Street 1, 11000 Belgrade" />
          </label>
        </div>
        {data.canManage ? (
          <div className="flex justify-end border-t border-border pt-3">
            <Button size="sm" onClick={saveInfo} disabled={savingInfo}>
              {savingInfo ? <Loader2 size={14} className="animate-spin" /> : null} Save details
            </Button>
          </div>
        ) : (
          <p className="border-t border-border pt-3 text-2xs text-muted-foreground">Only an owner can change billing details.</p>
        )}
      </Card>

      {/* Payment method — honest not-connected state */}
      <Card className="flex items-start gap-3 p-4">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-secondary text-muted-foreground"><CreditCard size={16} /></span>
        <div className="min-w-0">
          <p className="text-sm font-semibold">Payment method &amp; invoices</p>
          <p className="mt-0.5 text-2xs leading-relaxed text-muted-foreground">
            Automated card payments and invoice history need a payment provider (Stripe/Paddle), which isn&apos;t connected yet. No cards are
            stored or charged from here. Until then, plan changes are recorded for your account and invoicing is handled manually.
          </p>
        </div>
      </Card>
    </div>
  );
}
