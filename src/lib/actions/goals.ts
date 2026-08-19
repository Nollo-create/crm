"use server";

import { revalidatePath } from "next/cache";
import { requireSession, guardWrite } from "@/lib/auth/session";
import { recordAudit } from "@/lib/auth/audit";
import { isGoalMetric, isValidMonth, monthBounds } from "@/lib/crm/goals";
import { listUsers, listGoals, upsertGoal, wonByOwner, newLeadsByOwner } from "@/lib/db";

export interface MetricGoal {
  target: number;
  actual: number;
}
export interface RepRow {
  userId: number;
  name: string;
  revenue: MetricGoal;
  dealsWon: MetricGoal;
  newLeads: MetricGoal;
}
export interface GoalsBoard {
  period: string;
  team: { revenue: MetricGoal; dealsWon: MetricGoal; newLeads: MetricGoal };
  reps: RepRow[];
  unassigned: { revenue: number; dealsWon: number; newLeads: number };
}

function currentMonth(): string {
  return new Date().toISOString().slice(0, 7);
}

export async function goalsBoardAction(periodMonth?: string): Promise<GoalsBoard> {
  const { organizationId } = await requireSession();
  const period = periodMonth && isValidMonth(periodMonth) ? periodMonth : currentMonth();
  const { start, end } = monthBounds(period);

  const [users, goals, won, leads] = await Promise.all([
    listUsers(organizationId).catch(() => []),
    listGoals(organizationId, period).catch(() => []),
    wonByOwner(organizationId, start, end).catch(() => []),
    newLeadsByOwner(organizationId, start, end).catch(() => []),
  ]);

  const goalOf = (ownerId: number, metric: string): number => Number(goals.find((g) => g.owner_user_id === ownerId && g.metric === metric)?.target_amount ?? 0);
  const wonMap = new Map(won.map((w) => [Number(w.owner_user_id), { rev: Number(w.revenue), deals: Number(w.deals) }]));
  const leadMap = new Map(leads.map((l) => [Number(l.owner_user_id), Number(l.leads)]));
  const revActual = (id: number) => wonMap.get(id)?.rev ?? 0;
  const dealActual = (id: number) => wonMap.get(id)?.deals ?? 0;
  const leadActual = (id: number) => leadMap.get(id) ?? 0;

  const reps: RepRow[] = users
    .filter((u) => u.status === "active")
    .map((u) => ({
      userId: u.id,
      name: u.name || u.email,
      revenue: { target: goalOf(u.id, "revenue"), actual: revActual(u.id) },
      dealsWon: { target: goalOf(u.id, "deals_won"), actual: dealActual(u.id) },
      newLeads: { target: goalOf(u.id, "new_leads"), actual: leadActual(u.id) },
    }));

  // Team actuals are the full sums across every owner (assigned + unassigned).
  const teamRev = won.reduce((s, w) => s + Number(w.revenue), 0);
  const teamDeals = won.reduce((s, w) => s + Number(w.deals), 0);
  const teamLeads = leads.reduce((s, l) => s + Number(l.leads), 0);

  return {
    period,
    team: {
      revenue: { target: goalOf(0, "revenue"), actual: teamRev },
      dealsWon: { target: goalOf(0, "deals_won"), actual: teamDeals },
      newLeads: { target: goalOf(0, "new_leads"), actual: teamLeads },
    },
    reps,
    unassigned: { revenue: revActual(0), dealsWon: dealActual(0), newLeads: leadActual(0) },
  };
}

export async function setGoalAction(input: { ownerUserId: number; metric: string; periodMonth: string; target: number }): Promise<{ error?: string }> {
  const g = await guardWrite();
  if ("error" in g) return { error: g.error };
  const { organizationId } = g.session;
  if (!isGoalMetric(input.metric)) return { error: "Unknown metric." };
  if (!isValidMonth(input.periodMonth)) return { error: "Invalid month." };
  const target = Math.max(0, Math.round(Number(input.target) || 0));
  const ownerUserId = Math.max(0, Math.floor(Number(input.ownerUserId) || 0));
  if (ownerUserId > 0) {
    const users = await listUsers(organizationId).catch(() => []);
    if (!users.some((u) => u.id === ownerUserId)) return { error: "Unknown team member." };
  }
  await upsertGoal(organizationId, { ownerUserId, metric: input.metric, periodMonth: input.periodMonth, target, createdBy: g.session.email });
  await recordAudit(g.session, "goal_set", "goal", ownerUserId, `${input.metric} ${input.periodMonth} = ${target}`);
  revalidatePath("/goals");
  return {};
}
