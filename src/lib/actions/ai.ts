"use server";

import { requireSession } from "@/lib/auth/session";
import { aiComplete } from "@/lib/sajtpress";
import { getAnalytics } from "@/lib/analytics";
import { getCompanyAction, getDealAction } from "@/lib/actions/crm";
import { nbaStaleAccounts, nbaOverdueDeals, nbaHotLeads, nbaAgingQuotes } from "@/lib/db";
import { quoteNumber } from "@/lib/crm/quotes";
import { eur } from "@/lib/format";
import {
  ANALYSIS_FOCUS,
  isAnalysisFocus,
  isOutreachTone,
  isOutreachLength,
  isOutreachChannel,
  TONE_WORD,
  type AnalysisFocus,
  type OutreachTone,
  type OutreachLength,
  type OutreachChannel,
} from "@/lib/crm/ai-options";

export interface AiOut {
  text: string;
  enabled: boolean;
  error?: string;
}

// -------- Next best action (heuristic worklist)

export interface NbaItem {
  kind: "deal" | "account" | "quote" | "lead";
  title: string;
  subtitle: string;
  href: string;
  priority: number;
}

export async function nextBestActionsAction(): Promise<NbaItem[]> {
  const { organizationId: org } = await requireSession();
  const [stale, overdue, hot, quotes] = await Promise.all([
    nbaStaleAccounts(org, 30, 5).catch(() => []),
    nbaOverdueDeals(org, 5).catch(() => []),
    nbaHotLeads(org, 60, 5).catch(() => []),
    nbaAgingQuotes(org, 7, 5).catch(() => []),
  ]);
  const items: NbaItem[] = [];
  for (const d of overdue) items.push({ kind: "deal", title: `Follow up: ${d.title}`, subtitle: `${d.companyName} · ${d.days}d overdue`, href: `/companies/${d.companyId}`, priority: 100 + d.days });
  for (const s of stale) items.push({ kind: "account", title: `Re-engage ${s.name}`, subtitle: s.lastDays == null ? "No activity logged" : `${s.lastDays}d since last touch`, href: `/companies/${s.id}`, priority: 80 + (s.lastDays ?? 90) });
  for (const q of quotes) items.push({ kind: "quote", title: `Chase ${quoteNumber(q.id)}`, subtitle: `${q.companyName} · sent ${q.days}d ago`, href: `/quotes/${q.id}`, priority: 70 + q.days });
  for (const l of hot) items.push({ kind: "lead", title: `Work lead ${l.name || l.company}`, subtitle: `Score ${l.score}${l.company && l.name ? ` · ${l.company}` : ""}`, href: "/leads", priority: 60 + l.score / 10 });
  return items.sort((a, b) => b.priority - a.priority).slice(0, 15);
}

// -------- Generative (via the platform LLM)

async function snapshot(): Promise<string> {
  const a = await getAnalytics();
  return [
    `Open pipeline: ${eur(a.deals.open)} (${a.deals.openCount} deals), weighted ${eur(a.deals.weighted)}.`,
    `Won: ${eur(a.deals.won)}. Win rate: ${a.deals.winRate}%.`,
    `Customers: ${a.companies.customers}, at risk: ${a.companies.atRisk}, recurring value ${eur(a.companies.arr)}.`,
    `Leads: ${a.leads.total} (${a.leads.conversionRate}% converted). Activity last 30d: ${a.activities.last30}.`,
    `Deals by stage: ${a.deals.byStage.filter((s) => s.count > 0).map((s) => `${s.label} ${s.count}`).join(", ") || "none"}.`,
  ].join("\n");
}

export interface ChatTurn {
  role: "user" | "assistant";
  text: string;
}

export async function aiAssistantAction(question: string, history: ChatTurn[] = []): Promise<AiOut> {
  await requireSession();
  const q = question.trim();
  if (!q) return { text: "", enabled: true };
  const ctx = await snapshot().catch(() => "");
  // Keep the last few turns for follow-up continuity ("and which of those…").
  const priorTurns = (history || [])
    .slice(-6)
    .map((t) => `${t.role === "user" ? "User" : "Assistant"}: ${String(t.text || "").slice(0, 1000)}`)
    .join("\n");
  const prior = priorTurns ? `Conversation so far:\n${priorTurns}\n\n` : "";
  return aiComplete({
    system: "You are a concise B2B sales assistant inside the Sajtpress CRM. Use the workspace snapshot to ground your answer; be practical and brief. If the user asks a follow-up, use the conversation so far for context. If numbers aren't in the snapshot, say you don't have them rather than guessing.",
    prompt: `Workspace snapshot:\n${ctx}\n\n${prior}Question: ${q}`,
    maxTokens: 700,
  });
}

export async function companyAnalysisAction(companyId: number, focus: AnalysisFocus = "general"): Promise<AiOut> {
  await requireSession();
  const detail = await getCompanyAction(companyId);
  if (!detail) return { text: "", enabled: true, error: "Company not found." };
  const c = detail.company;
  const ctx = [
    `Company: ${c.name}`,
    `Industry: ${c.industry || "-"} · City: ${c.city || "-"} · Employees: ${c.employees ?? "-"} · Website: ${c.website || "-"}`,
    `Status: ${c.status} · Annual value: ${eur(c.annualValue)} · Contacts: ${detail.contacts.length}`,
    `Open pipeline: ${eur(detail.summary.open)} (weighted ${eur(detail.summary.weighted)})`,
    `Deals: ${detail.deals.map((d) => `${d.title} [${d.stage}, ${eur(d.value)}]`).join("; ") || "none"}`,
    `Recent activity: ${detail.activities.slice(0, 5).map((a) => `${a.type}: ${a.summary}`).join("; ") || "none"}`,
  ].join("\n");
  const focusLine = ANALYSIS_FOCUS[isAnalysisFocus(focus) ? focus : "general"];
  return aiComplete({
    system: `You are a B2B account strategist. ${focusLine} Reply in plain text with those short sections. Be concrete; base it only on the data given.`,
    prompt: ctx,
    maxTokens: 900,
  });
}

export async function dealInsightAction(dealId: number): Promise<AiOut> {
  await requireSession();
  const detail = await getDealAction(dealId);
  if (!detail) return { text: "", enabled: true, error: "Deal not found." };
  const d = detail.deal;
  const ctx = [
    `Deal: ${d.title}`,
    `Company: ${d.companyName} · Value: ${eur(d.value)} · Stage: ${d.stage} · Probability: ${d.probability ?? "-"}%`,
    `Expected close: ${d.expectedClose ?? "-"} · Owner: ${d.owner || "-"} · Primary contact: ${d.contactName ?? "-"}`,
    d.notes ? `Notes: ${d.notes}` : "",
    `Recent activity: ${detail.activities.slice(0, 6).map((a) => `${a.type}: ${a.summary}`).join("; ") || "none"}`,
  ].filter(Boolean).join("\n");
  return aiComplete({
    system: "You are a B2B deal coach. Analyse this single deal and reply in plain text with short sections: Momentum (one line), Risks (2 bullets), Next best move (one line). Be concrete and base it only on the data given.",
    prompt: ctx,
    maxTokens: 700,
  });
}

export async function outreachDraftAction(input: {
  companyId: number;
  contactId?: number;
  goal?: string;
  tone?: OutreachTone;
  length?: OutreachLength;
  channel?: OutreachChannel;
}): Promise<AiOut> {
  await requireSession();
  const detail = await getCompanyAction(input.companyId);
  if (!detail) return { text: "", enabled: true, error: "Company not found." };
  const c = detail.company;
  const contact = (input.contactId ? detail.contacts.find((ct) => ct.id === input.contactId) : null) ?? detail.contacts[0];
  const goal = (input.goal ?? "").trim() || "book a short intro call";
  const tone = isOutreachTone(input.tone ?? "") ? (input.tone as OutreachTone) : "warm";
  const length = isOutreachLength(input.length ?? "") ? (input.length as OutreachLength) : "standard";
  const channel = isOutreachChannel(input.channel ?? "") ? (input.channel as OutreachChannel) : "email";

  const ctx = [
    `Recipient: ${contact ? `${contact.name}${contact.role ? `, ${contact.role}` : ""}` : "the main contact"} at ${c.name} (${c.industry || "business"}, ${c.city || "unknown location"}).`,
    `Goal of the message: ${goal}.`,
    detail.summary.open > 0 ? `We have ${eur(detail.summary.open)} of open pipeline with them.` : "",
  ].filter(Boolean).join("\n");

  const format =
    channel === "linkedin"
      ? `Write a ${TONE_WORD[tone]} LinkedIn connection/DM message (no subject line, under 60 words, ${length === "short" ? "2-3" : "3-4"} sentences).`
      : `Write a ${TONE_WORD[tone]} B2B outreach email: a Subject line, then a ${length === "short" ? "3-4" : "4-6"} sentence body.`;

  return aiComplete({
    system: `You draft ${TONE_WORD[tone]} B2B outreach. ${format} Reply in plain text. Use the given details — never leave placeholders like [Name]. This is a DRAFT for the rep to review and send manually; do not claim it was sent.`,
    prompt: ctx,
    maxTokens: 500,
  });
}
