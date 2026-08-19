"use server";

// One client request per export instead of ~20: each action loops the existing
// page action server-side (in-process DB queries, no network round-trips) and
// returns the full CSV grid. Looping the page action — not a hand-written query —
// preserves the same record-level visibility (ownerScope) as the list itself.
// getSession is React-cached, so the repeated requireSession in the loop is one
// lookup for the whole request.

import { leadsPageAction } from "./leads";
import { dealsPageAction } from "./crm";
import { quotesPageAction } from "./quotes";
import { invoicesPageAction } from "./invoices";

type Grid = (string | number)[][];
const MAX_PAGES = 25; // 25 * 100 = up to 2,500 rows per export

export async function exportLeadsAction(f: { q?: string; status?: string; source?: string; sortKey: string; sortDir: 1 | -1 }): Promise<Grid> {
  const out: Grid = [["Lead", "Company", "Title", "Email", "Phone", "Source", "Score", "Status"]];
  for (let p = 1; p <= MAX_PAGES; p++) {
    const res = await leadsPageAction({ q: f.q, status: f.status, source: f.source, sortKey: f.sortKey, sortDir: f.sortDir, page: p, pageSize: 100 });
    for (const l of res.rows) out.push([l.name, l.company, l.title, l.email, l.phone, l.source, l.score, l.status]);
    if (res.rows.length === 0 || p >= res.pageCount) break;
  }
  return out;
}

export async function exportDealsAction(f: { q?: string; stage?: string; sortKey: string; sortDir: 1 | -1 }): Promise<Grid> {
  const out: Grid = [["Deal", "Company", "Stage", "Value (EUR)", "Owner", "Expected close"]];
  for (let p = 1; p <= MAX_PAGES; p++) {
    const res = await dealsPageAction({ q: f.q, stage: f.stage, sortKey: f.sortKey, sortDir: f.sortDir, page: p, pageSize: 100 });
    for (const d of res.rows) out.push([d.title, d.companyName, d.stage, d.value, d.owner, d.expectedClose ?? ""]);
    if (res.rows.length === 0 || p >= res.pageCount) break;
  }
  return out;
}

export async function exportQuotesAction(f: { q?: string; status?: string; sortKey: string; sortDir: 1 | -1 }): Promise<Grid> {
  const out: Grid = [["Quote", "Company", "Status", "Total (EUR)", "Valid until"]];
  for (let p = 1; p <= MAX_PAGES; p++) {
    const res = await quotesPageAction({ q: f.q, status: f.status, sortKey: f.sortKey, sortDir: f.sortDir, page: p, pageSize: 100 });
    for (const qt of res.rows) out.push([qt.number, qt.companyName, qt.status, qt.total.toFixed(2), qt.validUntil ?? ""]);
    if (res.rows.length === 0 || p >= res.pageCount) break;
  }
  return out;
}

export async function exportInvoicesAction(f: { q?: string; status?: string; sortKey: string; sortDir: 1 | -1 }): Promise<Grid> {
  const out: Grid = [["Invoice", "Company", "Status", "Total (EUR)", "Issue date", "Due date", "Overdue"]];
  for (let p = 1; p <= MAX_PAGES; p++) {
    const res = await invoicesPageAction({ q: f.q, status: f.status, sortKey: f.sortKey, sortDir: f.sortDir, page: p, pageSize: 100 });
    for (const inv of res.rows) out.push([inv.number, inv.companyName, inv.status, inv.total.toFixed(2), inv.issueDate ?? "", inv.dueDate ?? "", inv.overdue ? "yes" : ""]);
    if (res.rows.length === 0 || p >= res.pageCount) break;
  }
  return out;
}
