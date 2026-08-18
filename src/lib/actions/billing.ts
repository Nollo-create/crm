"use server";

import { revalidatePath } from "next/cache";
import { getOrganization, updateOrgPlan, updateBillingInfo, getUsageCounts } from "@/lib/db";
import { requireSession } from "@/lib/auth/session";
import { can } from "@/lib/auth/rbac";
import { enforceAdminMfa } from "@/lib/auth/mfa-policy";
import { recordAudit } from "@/lib/auth/audit";
import {
  PLANS,
  RESOURCES,
  getPlan,
  isPlanKey,
  usageStatus,
  DEFAULT_PLAN_KEY,
  type Plan,
  type BillingResource,
  type UsageStatus,
} from "@/lib/crm/billing";

export interface UsageLine {
  resource: BillingResource;
  label: string;
  used: number;
  limit: number;
  status: UsageStatus;
}

export interface BillingDetails {
  email: string;
  name: string;
  address: string;
  taxId: string;
}

export interface BillingData {
  planKey: string;
  plan: Plan;
  plans: Plan[];
  usage: UsageLine[];
  billing: BillingDetails;
  canManage: boolean;
  /** Honest: automated charging/invoicing needs a payment provider, not wired yet. */
  paymentsConnected: boolean;
}

export async function getBillingAction(): Promise<BillingData | null> {
  const session = await requireSession();
  const org = await getOrganization(session.organizationId).catch(() => null);
  if (!org) return null;

  const planKey = isPlanKey(org.plan) ? org.plan : DEFAULT_PLAN_KEY;
  const plan = getPlan(planKey) ?? getPlan(DEFAULT_PLAN_KEY)!;

  const counts = await getUsageCounts(session.organizationId).catch(() => ({ users: 0, companies: 0, contacts: 0, deals: 0 }));
  const usage: UsageLine[] = RESOURCES.map((r) => {
    const used = counts[r.key];
    const limit = plan.limits[r.key];
    return { resource: r.key, label: r.label, used, limit, status: usageStatus(used, limit) };
  });

  return {
    planKey,
    plan,
    plans: PLANS,
    usage,
    billing: {
      email: org.billing_email ?? "",
      name: org.billing_name ?? "",
      address: org.billing_address ?? "",
      taxId: org.tax_id ?? "",
    },
    canManage: can(session.role, "org:manage"),
    paymentsConnected: false,
  };
}

export async function setPlanAction(planKey: string): Promise<{ error?: string }> {
  const session = await requireSession();
  if (!can(session.role, "org:manage")) return { error: "Only an owner can change the plan." };
  const mfaErr = await enforceAdminMfa(session);
  if (mfaErr) return { error: mfaErr };
  if (!isPlanKey(planKey)) return { error: "Unknown plan." };
  await updateOrgPlan(session.organizationId, planKey);
  await recordAudit(session, "plan_change", "organization", session.organizationId, `plan set to ${planKey}`);
  revalidatePath("/settings/billing");
  return {};
}

export async function updateBillingInfoAction(input: {
  email?: string;
  name?: string;
  address?: string;
  taxId?: string;
}): Promise<{ error?: string }> {
  const session = await requireSession();
  if (!can(session.role, "org:manage")) return { error: "Only an owner can change billing details." };
  const mfaErr = await enforceAdminMfa(session);
  if (mfaErr) return { error: mfaErr };
  const email = (input.email ?? "").trim();
  if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return { error: "Enter a valid billing email." };
  await updateBillingInfo(session.organizationId, {
    billingEmail: email,
    billingName: (input.name ?? "").trim(),
    billingAddress: (input.address ?? "").trim(),
    taxId: (input.taxId ?? "").trim(),
  });
  await recordAudit(session, "billing_update", "organization", session.organizationId, "billing details updated");
  revalidatePath("/settings/billing");
  return {};
}
