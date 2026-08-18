# Sajtpress CRM — Incident Response

A runbook for a suspected security incident: account takeover, leaked API key,
stolen session, data exposure, or abuse. It maps each step to controls that
**already exist in the app**, so response is action, not theory.

Companion docs: [`SECURITY.md`](SECURITY.md), [`THREAT-MODEL.md`](THREAT-MODEL.md),
[`DISASTER-RECOVERY.md`](DISASTER-RECOVERY.md).

## Roles

- **Responder** — an org **owner** (only owners hold the emergency controls and
  policy switches).
- **Scribe** — records the timeline (the audit log does most of this for you).

## 1. Detect

Signals, and where to see them:

- **Active security alerts** — `/settings/security-overview` surfaces
  high-severity events (two-factor turned off, a user granted admin/owner, an API
  key minted, an emergency switch flipped, a policy change, a password change).
  If an alert **webhook** is configured, these also arrive in real time.
- **Security score + findings** — same page: failed-login spikes, stale
  sessions, idle API keys, admins without MFA.
- **Audit log** — `/settings/security` (full history, filterable, with IP +
  user-agent).
- **Active sessions** — `/settings/sessions` (per device, with last-used).

## 2. Triage

Classify quickly:

- **Scope** — one account, or the whole org? One tenant only (isolation holds by
  construction) or a platform-wide concern?
- **Severity** — is data being read/exfiltrated now, or is this a stale signal?
- **Vector** — stolen session, leaked API key, phished password, malicious
  insider, or a false alarm?

Note the earliest suspicious audit entry — it anchors the timeline and the
"restore from before this point" decision if data was tampered with.

## 3. Contain (server-side, immediate)

All of these are owner actions and take effect at once:

| Action | Where | Effect |
|---|---|---|
| **Sign out everyone** | `/settings/emergency` → force sign-out | Revokes every org session except yours |
| **Freeze API** | `/settings/emergency` | All API keys rejected at auth (401) |
| **Pause AI** | `/settings/emergency` | Every generative action returns disabled |
| **Pause automations** | `/settings/emergency` | The automation runner skips the org |
| Revoke one session | `/settings/sessions` | Kicks a single suspected device |
| Revoke an API key | `/settings/api` | Kills one leaked key without freezing all |
| Disable a user | `/settings/users` | Blocks a compromised/rogue account |
| Require admin MFA | `/settings/roles` | Forces every admin onto two-factor |

Rule of thumb: **API key leaked** → revoke that key (or Freeze API if unsure
which). **Session/password compromised** → force sign-out + have the user change
their password (which itself signs out their other devices). **Rogue insider** →
disable the user, then review what they touched in the audit log.

## 4. Eradicate

- Rotate the leaked factor: revoke the key / reset the password / re-enroll MFA.
- If a privileged account was taken over, review every `role_change`,
  `apikey_create`, and policy change it made and reverse anything unexpected.
- If the app or a dependency was the vector, patch and redeploy through the
  normal gate (tsc + tests + build + `npm run audit`).

## 5. Recover

- Turn the emergency switches back off once the threat is gone (each flip is
  audited).
- If **data integrity** was affected, restore from a backup taken **before** the
  incident — see [`DISASTER-RECOVERY.md`](DISASTER-RECOVERY.md), runbook D — and
  rotate secrets.
- Acknowledge the handled alerts on the security overview so the active list
  reflects reality.
- Confirm normal operation: sign-in, dashboard counts, a test API call.

## 6. Post-incident

- Write a short timeline (from the audit log): what happened, when detected, what
  was done, blast radius, root cause.
- Feed fixes back in: a new detection (another alert seam), a tightened control,
  or an update to [`THREAT-MODEL.md`](THREAT-MODEL.md) if a new vector appeared.
- If a real person's data was exposed, follow the applicable breach-notification
  obligations. This runbook is technical response, not legal advice.

## Fast reference

```
Leaked API key      → /settings/api: revoke it   (or Emergency: Freeze API)
Stolen session      → Emergency: Sign out everyone
Phished password    → disable user, reset password, re-enroll MFA
Rogue admin/insider → /settings/users: disable; audit their role/key changes
Under active abuse  → Emergency: Freeze API + Pause AI + Pause automations
Unsure / worst case → force sign-out, freeze API, then investigate calmly
```

## Limits (honest)

- Detection is **pull + best-effort push**: alerts show in-app and, if a webhook
  is set, are delivered there. There is no native SMTP/paging.
- Rate limiting and alerting are **process-local** — sized for the single
  Passenger process in use today.
- There is no SIEM/log shipping; the audit log is the system of record and lives
  in the same database (back it up — see DR).
