# Sajtpress CRM — Threat Model

A working threat model, not a compliance artifact. It names the assets, the
trust boundaries, who might attack them, the concrete threats (grouped
STRIDE-style), what mitigates each today, and what residual risk remains. Read
it with [`SECURITY.md`](SECURITY.md) (control detail),
[`INCIDENT-RESPONSE.md`](INCIDENT-RESPONSE.md) and
[`DISASTER-RECOVERY.md`](DISASTER-RECOVERY.md).

Principle throughout: **the client is untrusted.** Every boundary below is
enforced server-side.

## Assets (what we protect)

| Asset | Why it matters |
|---|---|
| Tenant CRM data (companies, contacts, leads, deals, quotes, activities) | The customer's confidential pipeline; cross-tenant leakage is the worst case |
| Credentials & session tokens | Account takeover → everything else |
| TOTP seeds | Reversible secret; encrypted at rest |
| API keys | Standing programmatic read access to a tenant |
| Audit log | Integrity of the record of who did what |
| Org security policy & emergency switches | Control-plane; abuse disables defenses |

## Trust boundaries

```
[ Browser / API client ]   ← fully untrusted
        │  HTTPS
        ▼
[ Passenger / Next.js server ]   ← trust root; all authz happens here
        │
        ├── MySQL (same host)            ← trusted store, org-scoped queries
        ├── Platform webapp /api/internal ← trusted, SSRF-guarded, secret-authed
        └── Owner-set alert webhook       ← untrusted destination, SSRF-guarded egress
```

The only code we trust is what runs on the server. Data crossing **into** the
server (form input, API params, chat history, imported files, CRM records that
outside parties influenced) is untrusted even after it's stored.

## Actors

- **External anonymous** — no account; hits login, the API, public routes.
- **Malicious tenant user** — a valid low-privilege account (member/viewer)
  trying to exceed its role or reach another tenant.
- **Compromised session** — an attacker riding a stolen cookie of any role.
- **Malicious data author** — someone who can get text into a CRM record (an
  imported lead, a form the tenant exposed) aiming at the AI or the operator.
- **Curious insider** — a member who should not see every record.

## Threats & mitigations (STRIDE)

### Spoofing (identity)
- *Credential stuffing / brute force* → per-IP + per-account rate limiting with
  cooldown; generic errors (no user enumeration); timing-uniform login.
- *Session theft* → `httpOnly`+`Secure`+`SameSite=Lax` cookies; only the token
  **hash** is stored; status re-checked every request; per-device revocation +
  org-wide force sign-out.
- *Weak/again-used passwords on privileged accounts* → **admin-enforced MFA**
  (opt-in org policy): owners/admins must have TOTP to manage the org.

### Tampering (integrity)
- *SQL injection* → parameterized queries throughout; sort/filter builders are
  allowlist-based.
- *Mass-assignment / bad input* → `validate.ts` at the action boundary; cleaned
  values are merged explicitly, never blind-spread.
- *Forged requests* → server actions are POST + same-origin; `SameSite` cookies;
  no state-changing GETs.

### Repudiation (accountability)
- *"I didn't do that"* → `crm_audit_logs` with actor, IP, user-agent on every
  mutation and auth event; **active security alerts** persist high-severity
  events (MFA off, role elevated, key minted, emergency switch, policy change,
  password change) for acknowledgement, and optionally push them to a webhook.

### Information disclosure (confidentiality)
- *Cross-tenant read* → **every** query is `organization_id`-scoped from the
  session, never from client input. The single highest-value invariant.
- *Over-broad intra-tenant read* → optional **record-level RBAC**: when an owner
  turns it on, a member sees only leads/deals they own or that are unassigned.
- *Secret leakage* → only the TOTP seed is reversible (AES-256-GCM, separate
  key); everything else is a hash or an env var. API responses never include
  `token_hash`/`password_hash`.
- *SSRF exfiltration* → the one inbound-integration seam is pinned to the
  configured origin on `/api/internal/*`; the outbound alert webhook is
  restricted to public https hosts and never follows redirects.

### Denial of service (availability)
- *Login/endpoint flooding* → rate limits return `429` + `Retry-After`. Honest
  limit: it is **process-local** (one Passenger process) — see residual risk.
- *Expensive AI abuse* → per-agent token caps; org-wide **pause AI** switch.

### Elevation of privilege (authorization)
- *Role escalation* → rank model (`owner>admin>member>viewer`); a missing gate
  can only *fail closed* (block a write), never let a lower role act as higher.
- *Write as a read-only viewer* → `guardWrite()` on every mutation; viewer is
  server-blocked and the write UI is hidden client-side too.
- *Hijacked session flipping org policy* → **step-up re-auth** on org security
  policy changes (a fresh TOTP/recovery code, or the password).

### AI-specific (prompt injection)
- *Untrusted record text hijacks the model* → all AI is generation-only (no
  tools, no writes, tenant-scoped). CRM data and chat history are **fenced** in
  unforgeable markers, control tokens stripped, with a standing system
  instruction to treat fenced content as data. Each agent has a fixed
  server-side prompt, only its own entity's data, and inherits org + record RBAC.

## Attack-surface enumeration

| Surface | Exposure | Primary control |
|---|---|---|
| `/login`, `/setup` | Public | Rate limit, generic errors, timing-uniform |
| Server actions | Auth cookie | `requireSession` → `can()`/`guardWrite()` |
| `/api/v1/*` | Bearer API key | Key hash + scope + expiry + rate limit + org freeze |
| `/api/cron/tick` | `CRON_SECRET` | `timingSafeEqual` secret |
| `/api/internal/*` (to webapp) | Server→server | `INTERNAL_API_SECRET`, SSRF-pinned |
| Alert webhook (egress) | Owner-set | `isSafeWebhookUrl` (https + public only) |
| AI prompts | Auth cookie | Prompt-injection boundary + org scope |

## Residual risks (accepted / tracked)

- **Rate limiting is process-local** — move to Redis if horizontally scaled.
- **No automated CI** — the verification gate is run locally before each deploy.
- **No email/OAuth/file-upload surfaces yet** — controls for stored provider
  tokens and upload scanning are unbuilt because the surface doesn't exist.
- **`sharp`/libvips advisory** accepted (no untrusted image processing here).
- **Record-level RBAC is off by default** and should be DB-verified before an
  owner enables it in production.

Revisit this document whenever a new surface is added (email, uploads, OAuth,
tool-using AI, horizontal scaling).
