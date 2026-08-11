"use server";

import { requireSession } from "@/lib/auth/session";
import { nbaOverdueDeals, nbaAgingQuotes, nbaHotLeads, nbaStaleAccounts } from "@/lib/db";
import { quoteNumber } from "@/lib/crm/quotes";

// Honest notifications: real, actionable signals derived from the CRM's own data
// (the same nba* helpers the Next-Best-Action page uses) — overdue deals, aging
// sent quotes, new high-intent leads, and accounts going quiet. No fabricated feed.

export type NotificationKind = "deal" | "quote" | "lead" | "account";

export interface Notification {
  id: string;
  kind: NotificationKind;
  title: string;
  sub: string;
  href: string;
}

export async function notificationsAction(): Promise<{ items: Notification[]; count: number }> {
  const { organizationId } = await requireSession();
  const [deals, quotes, leads, accounts] = await Promise.all([
    nbaOverdueDeals(organizationId, 5).catch(() => []),
    nbaAgingQuotes(organizationId, 7, 5).catch(() => []),
    nbaHotLeads(organizationId, 70, 5).catch(() => []),
    nbaStaleAccounts(organizationId, 30, 5).catch(() => []),
  ]);

  const items: Notification[] = [];
  for (const d of deals) items.push({ id: `deal-${d.id}`, kind: "deal", title: `Deal overdue — ${d.title}`, sub: `${d.companyName} · ${d.days}d past close`, href: `/companies/${d.companyId}` });
  for (const q of quotes) items.push({ id: `quote-${q.id}`, kind: "quote", title: `Chase ${quoteNumber(q.id)}`, sub: `${q.companyName} · sent ${q.days}d ago`, href: `/quotes/${q.id}` });
  for (const l of leads) items.push({ id: `lead-${l.id}`, kind: "lead", title: `Hot lead — ${l.name || l.company}`, sub: `score ${l.score}`, href: `/leads/${l.id}` });
  for (const a of accounts) items.push({ id: `acct-${a.id}`, kind: "account", title: `${a.name} has gone quiet`, sub: a.lastDays != null ? `no activity in ${a.lastDays}d` : "no activity logged", href: `/companies/${a.id}` });

  return { items, count: items.length };
}
