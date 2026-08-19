"use server";

import { revalidatePath } from "next/cache";
import { requireSession, guardWrite } from "@/lib/auth/session";
import { recordAudit } from "@/lib/auth/audit";
import { isValidMonth, monthBounds } from "@/lib/crm/goals";
import { commissionCents, percentToBp, bpToPercent } from "@/lib/crm/commissions";
import {
  listUsers,
  wonByOwner,
  listCommissionRates,
  upsertCommissionRate,
  listCommissionPayouts,
  recordCommissionPayout,
  deleteCommissionPayout,
} from "@/lib/db";

export interface CommissionRep {
  userId: number;
  name: string;
  ratePercent: number;
  revenue: number;
  earnedCents: number;
  paid: boolean;
  paidCents: number;
  paidAt: string | null;
}
export interface CommissionBoard {
  period: string;
  defaultRatePercent: number;
  reps: CommissionRep[];
  totals: { paidCents: number; pendingCents: number; totalCents: number };
}

function currentMonth(): string {
  return new Date().toISOString().slice(0, 7);
}

export async function commissionsBoardAction(periodMonth?: string): Promise<CommissionBoard> {
  const { organizationId } = await requireSession();
  const period = periodMonth && isValidMonth(periodMonth) ? periodMonth : currentMonth();
  const { start, end } = monthBounds(period);

  const [users, won, rates, payouts] = await Promise.all([
    listUsers(organizationId).catch(() => []),
    wonByOwner(organizationId, start, end).catch(() => []),
    listCommissionRates(organizationId).catch(() => []),
    listCommissionPayouts(organizationId, period).catch(() => []),
  ]);

  const rateBpOf = (id: number): number | null => {
    const r = rates.find((x) => x.owner_user_id === id);
    return r ? Number(r.rate_bp) : null;
  };
  const defaultBp = rateBpOf(0) ?? 0;
  const wonMap = new Map(won.map((w) => [Number(w.owner_user_id), Number(w.revenue)]));
  const payoutMap = new Map(payouts.map((p) => [Number(p.owner_user_id), p]));

  const reps: CommissionRep[] = users
    .filter((u) => u.status === "active")
    .map((u) => {
      const bp = rateBpOf(u.id) ?? defaultBp;
      const revenue = wonMap.get(u.id) ?? 0;
      const earnedCents = commissionCents(revenue, bp);
      const payout = payoutMap.get(u.id);
      return {
        userId: u.id,
        name: u.name || u.email,
        ratePercent: bpToPercent(bp),
        revenue,
        earnedCents,
        paid: !!payout,
        paidCents: payout ? Number(payout.amount_cents) : 0,
        paidAt: payout ? new Date(payout.paid_at).toISOString() : null,
      };
    });

  const paidCents = reps.reduce((s, r) => s + (r.paid ? r.paidCents : 0), 0);
  const pendingCents = reps.reduce((s, r) => s + (r.paid ? 0 : r.earnedCents), 0);
  return { period, defaultRatePercent: bpToPercent(defaultBp), reps, totals: { paidCents, pendingCents, totalCents: paidCents + pendingCents } };
}

export async function setCommissionRateAction(ownerUserId: number, percent: number): Promise<{ error?: string }> {
  const g = await guardWrite();
  if ("error" in g) return { error: g.error };
  const { organizationId } = g.session;
  const owner = Math.max(0, Math.floor(Number(ownerUserId) || 0));
  if (owner > 0) {
    const users = await listUsers(organizationId).catch(() => []);
    if (!users.some((u) => u.id === owner)) return { error: "Unknown team member." };
  }
  const bp = percentToBp(percent);
  if (bp > 1_000_000) return { error: "Rate is too high." };
  await upsertCommissionRate(organizationId, owner, bp);
  await recordAudit(g.session, "commission_rate_set", "commission", owner, `${bpToPercent(bp)}%`);
  revalidatePath("/commissions");
  return {};
}

/** Mark a rep's commission for a month as paid, snapshotting the amount computed
 *  server-side (never trusting a client-supplied figure). */
export async function markCommissionPaidAction(ownerUserId: number, periodMonth: string): Promise<{ error?: string }> {
  const g = await guardWrite();
  if ("error" in g) return { error: g.error };
  const { organizationId } = g.session;
  if (!isValidMonth(periodMonth)) return { error: "Invalid month." };
  const owner = Math.floor(Number(ownerUserId) || 0);
  if (owner <= 0) return { error: "Pick a team member." };

  const { start, end } = monthBounds(periodMonth);
  const [won, rates] = await Promise.all([
    wonByOwner(organizationId, start, end).catch(() => []),
    listCommissionRates(organizationId).catch(() => []),
  ]);
  const rateBpOf = (id: number): number | null => {
    const r = rates.find((x) => x.owner_user_id === id);
    return r ? Number(r.rate_bp) : null;
  };
  const bp = rateBpOf(owner) ?? rateBpOf(0) ?? 0;
  const revenue = Number(won.find((w) => Number(w.owner_user_id) === owner)?.revenue ?? 0);
  const amountCents = commissionCents(revenue, bp);

  await recordCommissionPayout(organizationId, { ownerUserId: owner, periodMonth, amountCents, paidBy: g.session.email });
  await recordAudit(g.session, "commission_paid", "commission", owner, `${periodMonth} · €${(amountCents / 100).toFixed(2)}`);
  revalidatePath("/commissions");
  return {};
}

export async function revertCommissionAction(ownerUserId: number, periodMonth: string): Promise<{ error?: string }> {
  const g = await guardWrite();
  if ("error" in g) return { error: g.error };
  if (!isValidMonth(periodMonth)) return { error: "Invalid month." };
  const owner = Math.floor(Number(ownerUserId) || 0);
  if (owner <= 0) return { error: "Pick a team member." };
  await deleteCommissionPayout(g.session.organizationId, owner, periodMonth);
  await recordAudit(g.session, "commission_reverted", "commission", owner, periodMonth);
  revalidatePath("/commissions");
  return {};
}
