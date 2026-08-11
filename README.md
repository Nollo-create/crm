# Sajtpress CMS

Content management for the Sajtpress platform — a **separate** Next.js 15 app at
`cms.sajtpress.rs`, built to connect to the webapp (`webapp.sajtpress.rs`) but to
stand alone whenever wanted.

## Design principle: connected now, separable later

Every link to the webapp is a **replaceable seam**, never a reach into its
internals:

- **Own database.** The CMS uses its own MySQL database (`DB_NAME`) and never
  joins across into the webapp's tables.
- **Own auth (to come).** SSO from the webapp is layered on top; the CMS keeps
  its own user/session model so it can log people in by itself.
- **API, not internals.** Anything it needs from the webapp goes through
  `src/lib/sajtpress.ts` (server-to-server, shared secret) — see the contract
  there.
- **One switch.** `SAJTPRESS_INTEGRATION=on|off` flips connected ↔ standalone.
  Every cross-app call **degrades gracefully** to an empty/no-op result, so the
  app runs identically either way.

## Local dev

```bash
npm install
cp .env.example .env.local   # fill in DB_* (and integration vars if testing it)
npm run dev                  # http://localhost:3000
npm test                     # vitest
```

The home page and `/api/health` show live status: CMS database, integration
mode, and whether the webapp is reachable.

## Deploy (mirrors the webapp — cPanel + Passenger)

The shared host can't run `next build`, so build locally and commit the output:

1. **cPanel → Setup Node.js App** → create an app: Application root
   `repositories/cms`, Application URL `cms.sajtpress.rs`, startup file
   `server.js`, Node 22, Production. Set the env vars from `.env.example`.
2. Local: `npm run build`, then commit (`.next` is tracked; `.next/cache` is
   gitignored), push.
3. cPanel → Git Version Control → **Update from Remote**, then **Restart** the
   Node app. Run **NPM Install** only when dependencies changed.

## Connecting to the webapp

The webapp must expose (guarded by `X-Internal-Secret` === `INTERNAL_API_SECRET`):

- `GET  /api/internal/ping` → 200 when the secret matches
- `POST /api/internal/ai-context` `{ agentId, projectId?, taskText? }` → `{ block }`

Until those exist, integration calls no-op to empty and the CMS runs standalone.
