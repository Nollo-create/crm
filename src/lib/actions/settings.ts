"use server";

import { revalidatePath } from "next/cache";
import { getOrganization, updateOrganization, countOrgUsers } from "@/lib/db";
import { requireSession } from "@/lib/auth/session";
import { can } from "@/lib/auth/rbac";
import { integration, isConnected } from "@/lib/config";
import { webappReachable } from "@/lib/sajtpress";
import { getPlan, DEFAULT_PLAN_KEY } from "@/lib/crm/billing";

const ROLE_LABEL: Record<string, string> = { owner: "Owner", admin: "Admin", member: "Member" };

// -------- organization

export interface OrgSettings {
  name: string;
  slug: string;
  createdAt: string;
  userCount: number;
  canManage: boolean;
  planName: string;
  roleName: string;
}

export async function orgSettingsAction(): Promise<OrgSettings | null> {
  const session = await requireSession();
  const org = await getOrganization(session.organizationId).catch(() => null);
  if (!org) return null;
  const userCount = await countOrgUsers(session.organizationId).catch(() => 0);
  const plan = getPlan(org.plan || DEFAULT_PLAN_KEY) ?? getPlan(DEFAULT_PLAN_KEY);
  return {
    name: org.name,
    slug: org.slug,
    createdAt: new Date(org.created_at).toISOString(),
    userCount,
    canManage: can(session.role, "org:manage"),
    planName: plan?.name ?? "Pro",
    roleName: ROLE_LABEL[session.role] ?? session.role,
  };
}

function slugify(s: string): string {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 120) || "org";
}

export async function updateOrgAction(input: { name: string; slug?: string }): Promise<{ error?: string }> {
  const session = await requireSession();
  if (!can(session.role, "org:manage")) return { error: "Only an owner can manage the organization." };
  const name = input.name.trim();
  if (!name) return { error: "The organization needs a name." };
  const slug = slugify(input.slug?.trim() || name);
  try {
    await updateOrganization(session.organizationId, name, slug);
  } catch {
    return { error: "That workspace URL (slug) is already taken." };
  }
  revalidatePath("/settings/org");
  return {};
}

// -------- integration status (no secrets ever returned)

export interface IntegrationStatus {
  connected: boolean;
  ssoEnabled: boolean;
  webappUrl: string;
  cookieDomain: string;
  hasSecret: boolean;
  reachable: boolean;
}

export async function integrationStatusAction(): Promise<IntegrationStatus> {
  await requireSession();
  const connected = isConnected(integration);
  const reachable = connected ? await webappReachable().catch(() => false) : false;
  return {
    connected,
    ssoEnabled: connected,
    webappUrl: integration.webappUrl,
    cookieDomain: integration.cookieDomain,
    hasSecret: integration.secret !== "",
    reachable,
  };
}
