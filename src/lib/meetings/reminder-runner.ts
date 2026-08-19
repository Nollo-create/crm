import { listMeetingsToRemind, markMeetingReminded, createNotification } from "@/lib/db";

// Cron slice: fire a "starting soon" notification for meetings that begin within
// the next ~20 minutes and haven't been reminded yet. The notification goes to
// whoever scheduled the meeting (created_by), falling back to the whole team.
export async function processMeetingReminders(): Promise<{ reminded: number }> {
  const due = await listMeetingsToRemind(20).catch(() => []);
  let reminded = 0;
  for (const m of due) {
    await createNotification(m.organization_id, {
      userEmail: m.created_by || null,
      type: "meeting",
      title: `Meeting soon: ${m.title || "Untitled meeting"}`,
      href: "/meetings",
    }).catch(() => {});
    // Mark reminded regardless so a failed notify doesn't loop every tick.
    await markMeetingReminded(m.id).catch(() => {});
    reminded++;
  }
  return { reminded };
}
