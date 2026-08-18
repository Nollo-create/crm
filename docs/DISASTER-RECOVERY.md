# Sajtpress CRM — Disaster Recovery

How to bring the CRM back after data loss, host failure, or a bad deploy. Honest
about what is and isn't automated today: this describes the **real** cPanel +
Phusion Passenger + MySQL deployment, not an idealized pipeline.

Companion docs: [`INCIDENT-RESPONSE.md`](INCIDENT-RESPONSE.md) (security
incidents), [`SECURITY.md`](SECURITY.md), [`THREAT-MODEL.md`](THREAT-MODEL.md).

## What the system is made of

| Component | Where it lives | How it's recovered |
|---|---|---|
| Application code | Git → GitHub (`Nollo-create/crm`, `main`) | `git clone` / pull |
| Built output (`.next`) | Committed to git (deploy model) | Comes with the code; or rebuild locally |
| Database | MySQL on the cPanel host | Restore from a SQL dump (see below) |
| Schema | Auto-created by the app | Idempotent — recreated on first boot |
| Secrets (env) | cPanel Node.js App "Environment variables" | **Not in git** — must be recorded separately |
| Uploaded files | *none today* | N/A (no upload feature) |

## The schema self-heals; the data does not

`ensureSchema()` / `ensureAuthSchema()` run `CREATE TABLE IF NOT EXISTS` plus
idempotent `ensureColumn` migrations on boot. Point the app at an **empty**
database with the right credentials and it recreates every table and column
automatically. This means:

- **Structure** is disposable — it's code, always reproducible.
- **Rows** are not — only a database backup brings customer data back.

So the recovery objective is entirely about the **data** and the **secrets**.

## Backups — current state (read this honestly)

There is **no application-level automated backup** built into the CRM. Data
durability today relies on the hosting layer, which the app can't guarantee on
its own. Before trusting this in production, confirm at least one of:

1. **cPanel / host backups** — most cPanel plans offer scheduled account or
   database backups (JetBackup, R1Soft, or the host's own). Verify the cadence
   and that MySQL is included. This is the expected primary mechanism.
2. **Manual DB export** — cPanel → phpMyAdmin → select the CRM database →
   **Export** → SQL. Store it off the host (download it). Quick, works with no
   shell, good for a pre-change snapshot.
3. **Automated dump to offsite** — if the host ever grants cron/shell, a
   `mysqldump` piped to offsite storage is the right upgrade. Not available on
   the current shell-less plan.

> **Action item (owner):** decide and document the backup cadence, then record
> the actual RPO here. Until then, assume RPO = "since the last host/phpMyAdmin
> backup," which may be up to a day or more.

## Protect the secrets separately from the data

Some env vars are not reconstructable and are as important as the database:

- **`MFA_ENCRYPTION_KEY`** — encrypts TOTP seeds. **If it is lost, every enrolled
  user's two-factor becomes undecryptable.** They can still sign in with a saved
  **recovery code**, then re-enroll; but without the key (and without recovery
  codes) MFA users are locked out. Store this key in a password manager, not only
  on the host.
- **`DB_*`**, **`CRON_SECRET`**, **`INTERNAL_API_SECRET`** — record them in the
  same secure vault so a host rebuild doesn't strand the app.

Keep a current copy of all env values somewhere the host failure can't take with
it. Losing the DB **and** the secrets is a worse incident than losing either.

## Recovery runbooks

### A. Bad deploy (app broken, data intact) — fastest
Most "outage" cases. The database is fine; a build or code change broke the app.

1. In cPanel → Git Version Control, or locally, identify the last good commit.
2. Revert: `git revert <bad>` (or check out the last good `.next`), rebuild
   locally (`npm run build`), commit, push.
3. cPanel → **Update from Remote** → **Restart**.
4. If `.next` itself is corrupt on the host, redeploy a locally built one (the
   deploy model already commits `.next`). Never leave the tree without `.next`.

*RTO: minutes.* No data touched.

### B. Database lost or corrupted (host intact)
1. Create/confirm the MySQL database + user in cPanel; set `DB_*` env to match.
2. Import the newest SQL backup: phpMyAdmin → the database → **Import** → the
   `.sql` file. (For a large dump, use the host's backup-restore tool instead.)
3. Restart the Node app. On boot the schema is verified/migrated automatically.
4. Spot-check: sign in, confirm counts on the dashboard, check the audit log.

*RTO: as long as the import takes. RPO: age of the backup.*

### C. Whole host lost (rebuild from scratch)
1. New host / cPanel account, Node 22, MySQL created.
2. Git Version Control → clone `https://github.com/Nollo-create/crm` (`main`).
3. Set **all** env vars from the secure vault (`DB_*`, `MFA_ENCRYPTION_KEY`,
   `CRON_SECRET`, `INTERNAL_API_SECRET`, platform vars). Missing
   `MFA_ENCRYPTION_KEY` = MFA users must use recovery codes.
4. Setup Node.js App: app root `repositories/appa` (per the platform), startup
   `server.js`, **Run NPM Install**, **Restart**.
5. Import the DB backup (runbook B).
6. Re-point DNS (`crm.sajtpress.rs`) if the host/IP changed.
7. Re-establish the cron job hitting `/api/cron/tick` with `CRON_SECRET`.

*RTO: hours, dominated by DNS + DB import. RPO: age of the backup.*

### D. Ransomware / integrity compromise
Treat as a security incident first — see [`INCIDENT-RESPONSE.md`](INCIDENT-RESPONSE.md).
Recover data only from a backup taken **before** the compromise, and **rotate
every secret** (`MFA_ENCRYPTION_KEY` rotation forces MFA re-enrollment) during
the rebuild.

## Verify a backup actually restores

A backup you have never restored is a hope, not a backup. Periodically: import
the latest dump into a scratch database, point a local dev instance at it, and
confirm login + record counts. Record the date of the last successful test
restore.

## Known gaps (tracked)

- No app-level automated/offsite backup — relies on the host (see above).
- No point-in-time recovery (binlog) unless the host provides it.
- Secrets live in the host env — mirror them in a vault or a host loss strands
  the app.
- No local database in the dev workflow, so DB-backed recovery steps are
  verified against a real/scratch MySQL, not in CI.
