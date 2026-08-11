# Sajtpress CRM — Technical Blueprint

An **AI B2B Sales Operating System**, a separate product in the Sajtpress
ecosystem at `crm.sajtpress.rs`, built to connect to the AI Agents webapp yet run
standalone. This is the architecture the build follows, phase by phase. Legend:
**✅ built (Etapa 1)** · **◻ planned/soon**.

## 1. System architecture
Independent Next.js app, **API-first**, talking to the rest of the ecosystem only
through HTTP contracts + a shared service secret — never by reaching into another
app's database or code. The connect/standalone switch (`SAJTPRESS_INTEGRATION`)
means every cross-app call degrades to a safe no-op, so the CRM is sellable on its
own. Three planes: **data** (own MySQL) · **app/API** (Next server actions + route
handlers) · **integration** (`src/lib/sajtpress.ts` client + future webhooks).

## 2. Technology stack
Next.js 15 (App Router) · React 19 · TypeScript (strict) · Tailwind v3 · MySQL
(`mysql2`) · cPanel + Phusion Passenger (build-locally → commit `.next` → pull +
restart). Vitest for the pure logic. Same stack as the webapp → maximal reuse.

## 3. Database schema
Prefix every table `crm_`. Own database, no cross-app joins.
- ✅ `crm_companies`, `crm_contacts`, `crm_deals`, `crm_activities`
- ◻ `crm_organizations`, `crm_users`, `crm_teams`, `crm_roles`, `crm_permissions`
  (multi-tenant + RBAC — **the critical next foundation**)
- ◻ `crm_leads`, `crm_pipelines`, `crm_pipeline_stages`, `crm_tasks`, `crm_emails`,
  `crm_email_threads`, `crm_products`, `crm_quotes`, `crm_quote_items`,
  `crm_customers`, `crm_tags` + join tables, `crm_automations`,
  `crm_automation_steps`, `crm_notifications`, `crm_documents`, `crm_notes`,
  `crm_ai_insights`, `crm_ai_scores`, `crm_audit_logs`
Self-healing schema (`CREATE IF NOT EXISTS`, memoised) — additive migrations only.
**Every row will carry `organization_id`** once multi-tenancy lands; add it before
real data so no backfill is needed.

## 4. Entity relationships
`Organization 1─* Users/Teams/Companies/Pipelines/Products/Automations` ·
`Company 1─* Contacts/Deals/Activities/Tasks/Quotes/Documents/Notes` ·
`Deal *─1 Company`, `Deal *─1 Pipeline`, `Deal 1─* QuoteItems (via Quote)` ·
`Lead ↦ Company/Contact` on qualification · `Activity/Task/Email ↦ any of
Company/Contact/Lead/Deal`. No FK crosses the app boundary.

## 5. API architecture
Two surfaces:
- **Internal (in-app):** React Server Actions (`src/lib/actions/*`) — typed, the UI's
  data layer. ✅ companies/contacts/deals/activities/dashboard/board.
- **External (route handlers under `/api`):** ◻ REST for the Crawl/Sales agents +
  future partners — `POST /api/v1/leads:import`, `GET/POST /api/v1/companies`,
  `/deals`, `/pipeline`, `POST /api/ai/*`. Auth by bearer service token, tenant
  scoped, versioned, rate-limited. Contract with the webapp: `GET /api/internal/ping`,
  `POST /api/internal/ai-context` (already stubbed in `sajtpress.ts`).

## 6. Authentication architecture ◻ (immediate priority)
Own email+password/session model (own `crm_users`), **plus** the Sajtpress SSO
bridge layered on top: shared cookie on `Domain=.sajtpress.rs`, webapp as identity
provider. Session in an httpOnly cookie; passwords hashed (argon2/bcrypt); 2FA later.
Keeping its own auth is what preserves standalone-sellability.

## 7. Multi-tenant architecture ◻ (immediate priority)
`organization_id` on every tenant-owned row; **every query filtered by the caller's
org** at the data layer (a single `withOrg()` helper, never optional). Users belong
to an org; cross-org access is impossible by construction. Add this **before** any
real customer data.

## 8. Frontend architecture ✅ (shell) / ◻ (rest)
Sidebar sales-workspace shell (grouped nav, `soon` badges = the product map) ·
server components for reads, client islands for interaction · tables + Kanban +
timelines + drawers/modals · ◻ command bar (⌘K), saved views, smart filters, bulk
actions, responsive/mobile priority screens. Design: dense, professional, minimal —
not consumer-flashy.

## 9. AI architecture ◻
The CRM does **not** embed AI — it **orchestrates** the webapp's agents via the
integration API, and reads the shared **AI Intelligence** brain for context/rules.
Planned: lead scoring (heuristic ✅ in `pipeline.ts`; AI ◻), company/website
analysis (Crawl Agent), next-best-action, email assistant (draft→review→approve→send,
never silent send), churn/upsell, an AI Sales command center over CRM data. All AI
that acts externally requires explicit approval.

## 10. Automation architecture ◻
Trigger → conditions → actions, stored as `crm_automations` + `crm_automation_steps`,
executed by a **background runner on the cron seam** (the webapp's `/api/cron/tick`
pattern) — one bounded slice per tick (no worker on this host). Triggers: lead
created, deal stage change, no-reply timers. Actions: assign, task, notify, AI email.

## 11. Integration architecture ◻
An **integration layer**, never hard-coded into business logic: Sajtpress agents
(Crawl/Sales) push leads via the import API with **duplicate detection**
(domain/name/email/phone); email (Gmail/Outlook/SMTP); calendar; Stripe (billing);
outbound webhooks; a public REST API for Zapier/Make.

## 12. Project structure
```
src/
  app/(crm)/…            route group → Shell; dashboard, companies, pipeline (✅) + soon
  app/api/…              route handlers (health ✅; internal/v1 ◻)
  lib/crm/               pure domain (pipeline ✅, scoring ✅) + nav
  lib/db.ts              schema + CRUD (own MySQL)
  lib/actions/*          server actions (data layer)
  lib/sajtpress.ts       webapp integration client (graceful-degrade)
  lib/config.ts          integration on/off switch
  components/crm, ui/    shell + primitives
```

## 13. MVP definition
Smallest production-ready slice = **Etapa 1 (✅) + auth + multi-tenant + tenant
isolation**. Etapa 1 already gives Companies · Contacts · Deals · Pipeline board ·
Activities/timeline · Dashboard (weighted pipeline, win rate) · lead score. It is
**not yet production-ready** only because it lacks auth/tenancy — that is the very
next work, before any real data.

## 14. Development phases (mapped to the master spec)
- **Phase 1 — Foundation:** auth, orgs, users, RBAC, companies✅, contacts✅, leads,
  deals✅, pipeline✅, activities✅, tasks, dashboard✅. *(Etapa 1 = the data slice; auth/
  tenancy/RBAC/tasks remain.)*
- **Phase 2 — Sales:** email, quotes, products, customers, import/export, filters,
  notifications, global search, bulk actions.
- **Phase 3 — AI:** lead scoring, company analysis, next-best-action, email + sales
  assistants, insights (via the Sajtpress agents + brain).
- **Phase 4 — Automation:** workflows, follow-ups, lead routing, notifications.
- **Phase 5 — Sajtpress integration:** Crawl/Sales agents, shared account/billing/AI.
- **Phase 6 — Advanced B2B:** account health, churn, upsell/cross-sell, forecasting,
  advanced analytics.

## 15. Security architecture
Session auth (httpOnly, SameSite), RBAC + tenant isolation at the data layer,
encrypted credentials (AES-GCM, keys in env), audit log (`crm_audit_logs`), input
validation, rate limiting, parameterised SQL (✅), CSRF/XSS hygiene, no secrets to
the browser, service-token internal API. **Until auth ships, keep the app private
(cPanel Directory Privacy) and load no real data.**

## 16. Scalability strategy
Assume 100k+ companies / 1M+ activities per tenant: server-side pagination +
filtering, indexed queries, no unbounded client loads, caching where safe, and
background jobs (cron seam) for imports/exports/AI/automation/reports.

## 17. Testing strategy
Pure logic unit-tested with Vitest (pipeline math ✅, scoring ✅, dedup, permission
checks); the DB/AI/network layers verified in the browser + honest "not exercised"
notes, mirroring the webapp's test-scope rule. Gate every phase on tsc + tests +
build before shipping.

---
**Status:** Etapa 1 shipped (Companies/Contacts/Deals/Pipeline/Activities/Dashboard).
**Next (highest priority):** authentication + multi-tenant + RBAC — the foundation
that makes the CRM safe for real customer data.
