import "server-only";
import { ImapFlow } from "imapflow";
import { decryptSecret } from "@/lib/auth/crypto";
import { getEmailSyncState, setEmailSyncState, getContactByEmail, stopContactEnrollments, addActivity, orgsWithImap, type ImapOrgRow } from "@/lib/db";

// Inbox sync (master email frontier). Each cron tick connects to every org's
// configured IMAP mailbox, reads mail newer than the last cursor, and — for
// messages from a known CRM contact — logs an inbound activity on the timeline
// and stops that contact's active sequences (stop-on-reply). Bounded per org.
//
// Honest scope: matches by From address only (no MIME threading); the first sync
// sets a baseline and never backfills the whole inbox; bodies aren't stored.

const MAX_PER_ORG = 40;

async function syncOrg(org: ImapOrgRow): Promise<{ logged: number; stopped: number }> {
  const password = org.password_enc ? decryptSecret(org.password_enc) : "";
  if (!password) return { logged: 0, stopped: 0 };

  const state = await getEmailSyncState(org.organization_id);
  const client = new ImapFlow({
    host: org.imap_host,
    port: org.imap_port || 993,
    secure: true,
    auth: { user: org.username, pass: password },
    logger: false,
  });

  let logged = 0;
  let stopped = 0;
  try {
    await client.connect();
    const lock = await client.getMailboxLock("INBOX");
    try {
      const box = client.mailbox;
      if (!box) return { logged, stopped };
      const uidValidity = Number(box.uidValidity);
      const uidNext = Number(box.uidNext);

      // First sync (or a uidvalidity reset) → baseline to "now", process nothing,
      // so we never dump the whole existing inbox onto timelines.
      if (state.uidValidity !== uidValidity) {
        await setEmailSyncState(org.organization_id, Math.max(0, uidNext - 1), uidValidity);
      } else {
        const since = state.lastUid;
        let maxUid = since;
        for await (const msg of client.fetch(`${since + 1}:*`, { envelope: true }, { uid: true })) {
          if (msg.uid <= since) continue; // IMAP "X:*" always returns the last msg
          if (msg.uid > maxUid) maxUid = msg.uid;
          const from = (msg.envelope?.from?.[0]?.address ?? "").toLowerCase();
          const subject = msg.envelope?.subject || "(no subject)";
          if (!from) continue;
          const contact = await getContactByEmail(org.organization_id, from).catch(() => null);
          if (!contact) continue; // only log mail from known contacts
          await addActivity(org.organization_id, {
            companyId: contact.companyId,
            contactId: contact.id,
            type: "email",
            summary: `Reply from ${contact.name || from}: ${subject}`.slice(0, 490),
          }).catch(() => {});
          logged++;
          stopped += await stopContactEnrollments(org.organization_id, contact.id).catch(() => 0);
          if (logged >= MAX_PER_ORG) break;
        }
        await setEmailSyncState(org.organization_id, maxUid, uidValidity);
      }
    } finally {
      lock.release();
    }
    await client.logout();
  } catch {
    try {
      client.close();
    } catch {
      /* ignore */
    }
  }
  return { logged, stopped };
}

export async function processInboxSync(): Promise<{ logged: number; stopped: number }> {
  const orgs = await orgsWithImap().catch(() => [] as ImapOrgRow[]);
  let logged = 0;
  let stopped = 0;
  for (const org of orgs) {
    const r = await syncOrg(org).catch(() => ({ logged: 0, stopped: 0 }));
    logged += r.logged;
    stopped += r.stopped;
  }
  return { logged, stopped };
}
