# Sajtpress CRM — Security

This document records the security architecture, where each control lives, how
it's verified, the deployment requirements, and — honestly — what is **not** yet
covered. It is a living verification report, not a compliance claim. The CRM is
**not** "100% secure"; it implements measurable controls and states its residual
risks.

Principle throughout: **never trust the client.** Every permission and tenant
boundary is enforced **server-side**. Hidden buttons and disabled inputs are UX,
never authorization.

## Defense in depth

```
HTTPS/TLS → security headers + CSP → auth (session/MFA) → RBAC → tenant isolation
→ input validation → parameterized DB → app-level encryption → audit log →
emergency controls
```

No single layer is load-bearing on its own.

## Controls — what, where, how verified

| Control | Where | Verified by |
|---|---|---|
| **Tenant isolation** | Every `db.ts` query is `organization_id`-scoped; every action derives org from the **session**, never client input | Code review; org threading is tsc-enforced |
| **Password auth** | `lib/auth/password.ts` — scrypt (Node built-in; deliberately no native dep for cPanel). Timing-uniform login via a dummy hash; generic errors; `status='active'` enforced in SQL | `password.test.ts`; login flow reviewed |
| **Two-factor (TOTP)** | `lib/auth/totp.ts` (RFC 6238), seed encrypted at rest (`lib/auth/crypto.ts`, AES-256-GCM), recovery codes (single-use hashes), login challenge step | `totp.test.ts` (RFC vectors), `crypto.test.ts` (round-trip + tamper) |
| **Sessions** | `lib/auth/session.ts` — DB-backed opaque token, cookie `httpOnly`+`Secure`(prod)+`SameSite=Lax`; only the SHA-256 is stored; status re-checked each request | `tokens.test.ts`; reviewed |
| **RBAC** | `lib/auth/rbac.ts` rank model (owner > admin > member > viewer) + `can()`, enforced per action. Every mutating action is gated by `guardWrite()` (`record:write`); admin actions by `can()`. **Viewer** is fully read-only — server-blocked on all writes, with the write UI hidden client-side too | `rbac.test.ts`, `user-admin.test.ts` |
| **Input validation** | `lib/crm/validate.ts` (pure, tested) — length/format/range/enum checks at the action boundary before any query; cleaned values merged, never blind-spread | `validate.test.ts` |
| **Rate limiting** | `lib/rate-limit.ts` (in-memory, injectable clock): login (per-IP + per-email), setup, MFA enroll/verify, password change, API-key creation, and the public API (`/api/v1`: per-key + per-IP, `429` + `Retry-After`) | `rate-limit.test.ts` |
| **Security headers** | `next.config.mjs` `headers()` — HSTS, `X-Content-Type-Options`, `X-Frame-Options: DENY`, `Referrer-Policy`, `Permissions-Policy` | curl `-I` on responses |
| **CSP** | `middleware.ts` — per-request nonce, `strict-dynamic`; next-themes nonce threaded via the root layout | Browser: all scripts nonced, no violations |
| **SSRF guard** | `lib/crm/internal-url.ts` — the one outbound seam (`sajtpress.ts`) only reaches the configured origin on `/api/internal/*`; `redirect:"error"` | `internal-url.test.ts` |
| **SQL injection** | Parameterized queries everywhere; sort builders are allowlist-based | `company-query`/`deal-query`/etc. tests |
| **Audit log** | `crm_audit_logs` (+ IP + user agent) via `recordAudit`/`recordAuthEvent`; viewer with filters | Reviewed; events verified in the feed |
| **Security score** | `lib/crm/security-score.ts` — real, measured, explained (admins-without-MFA is the heaviest factor) | `security-score.test.ts` |
| **Emergency controls** | `actions/emergency.ts` — force sign-out, freeze API, pause AI, pause automations; enforced at each seam (`api/auth`, AI actions, automation runner) | Reviewed; owner-gated + audited |

## Authentication & session lifecycle

1. Password verified (scrypt, timing-uniform).
2. If the account has 2FA on, a short-lived DB-backed **challenge** is issued
   (cookie holds a random token; DB holds its hash). No session yet.
3. The TOTP (or a recovery) code is verified; only then is the real session
   minted. Accounts **without** 2FA skip step 2/3 entirely — that path is
   unchanged from before MFA existed.
4. Sessions are visible and revocable per device (`/settings/sessions`);
   "log out other sessions" and the org-wide force sign-out both exist.

## Roles & access

Four org-wide roles in a rank model (`lib/auth/rbac.ts`): **owner** > **admin** >
**member** > **viewer**. Reads require `viewer`; creating/editing any record
requires `record:write` (member and up); deletes and user/billing/org management
require admin/owner.

- **Enforcement is server-side.** `guardWrite()` gates every mutating action
  (create/update/delete/bulk/convert/import/run across companies, contacts,
  leads, deals, activities, tasks, quotes, products, tags, automations); `can()`
  gates the admin actions. A read-only viewer is refused by construction —
  missing a gate would let a viewer write, never let a lower role escalate.
- **Viewer is complete.** It is blocked on every write path server-side, and the
  write UI is also hidden client-side (`RoleProvider` + `useCanWrite()`, from the
  session role) so a viewer never sees a control they can't use. Hiding the UI is
  UX only — the server checks are the boundary.

## Data protection

- **Secrets at rest:** the only reversible secret the CRM stores is the TOTP
  seed, encrypted with AES-256-GCM (key from `MFA_ENCRYPTION_KEY`, kept separate
  from the data). Everything else is a hash (sessions, API keys, recovery codes)
  or an environment variable.
- **API keys:** `crmk_` prefix, SHA-256 stored, shown once, read-only scope,
  revocable, org-freezable.
- **Bulk / ingress operations** (imports, bulk delete/update) are audited.
- **Public API** is read-only, key-scoped to one tenant by construction, and
  paginated (max 100/page). No CORS header is sent → default-deny for browsers.

## Incident response (owner controls)

At `/settings/emergency` an owner can, immediately and server-side:

- **Sign out everyone** (revoke all org sessions except their own).
- **Freeze API** (all keys rejected at `authenticateApiKey`).
- **Pause AI** (every generative action returns disabled).
- **Pause automations** (the runner skips the org).

Plus, from elsewhere: revoke individual sessions/API keys, disable users, force
password reset (by disabling then re-inviting). Every emergency action is audited.

## Deployment requirements (env)

| Variable | Purpose | Without it |
|---|---|---|
| `DB_*` | MySQL connection | App can't run |
| `MFA_ENCRYPTION_KEY` | Encrypts TOTP seeds (any long random string) | Two-factor is unavailable (honest "not configured") |
| `CRON_SECRET` | Guards `/api/cron/tick` | Automations run only via "Run now" |
| `SAJTPRESS_INTEGRATION` / `WEBAPP_INTERNAL_URL` / `INTERNAL_API_SECRET` | Platform connection + SSO + AI | Runs standalone; AI/SSO off |

Production is HTTPS-only (HSTS is set). `Secure` cookies require HTTPS.

## Dependency posture

- `npm run audit` (`npm audit --omit=dev`) scans production dependencies.
- An `overrides` entry pins `postcss` to a patched `^8.5.23` (resolves the
  build-time postcss advisories without a framework upgrade).
- **Known accepted finding:** `sharp` (`<0.35.0`, via Next's image optimizer)
  carries libvips advisories. The only upstream fix is a **major Next 15→16
  upgrade** (breaking). **Practical risk here is minimal:** the CRM processes no
  untrusted images (no uploads, no remote image sources), so `sharp` never runs
  on attacker-controlled input. Tracked for the next Next-upgrade window.

## What is NOT covered yet (residual risk)

Stated honestly rather than hidden:

- **No email/OAuth integrations** in the CRM yet → no stored provider tokens.
  When added, they must be encrypted (the `crypto.ts` primitive is ready) and
  the OAuth flows hardened.
- **No file uploads** yet → the upload-security controls (MIME/signature checks,
  out-of-webroot storage, malware scan) are unbuilt because there is no surface.
- **AI prompt-injection isolation** is partial: the CRM builds prompts
  server-side from org-scoped data, so cross-tenant leakage isn't possible via
  the current actions, but there is no formal system/user/data/content boundary
  enforcement for future tool-using agents.
- **Access is role-level, not record-level.** The four roles are org-wide; there
  is no per-owner or per-team scoping yet (e.g. "reps see only their assigned
  leads/deals"). The rank model is designed to extend to it, but a member today
  can read/edit every record in the org.
- **Rate limiting is process-local** (single Passenger process today). Back it
  with Redis if the app is ever horizontally scaled.
- **MFA has no QR code** (manual key entry only) and **no admin-enforced MFA**
  (it's opt-in; the security score flags admins who haven't enabled it).
- **`sharp`/libvips** advisory accepted as above.
- **No automated CI** — the gate (tsc + tests + build + `npm run audit`) is run
  locally before each deploy; there is no server-side pipeline enforcing it.

## Verification gate (run before every deploy)

```bash
npx tsc --noEmit && npm test && npm run audit && npm run build
```

Runtime of DB-backed flows is verified on the production database (there is no
local DB); the pure security cores (TOTP, crypto, rate limiter, SSRF guard,
score) are unit-tested, and org-scoping is tsc-enforced.
