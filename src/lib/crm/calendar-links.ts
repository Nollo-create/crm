// Calendar export helpers — pure, so the date formatting is unit tested and the
// meetings UI just renders the result. A meeting is a title + UTC start ISO +
// duration; output is a Google Calendar "add event" URL or an .ics document.

export interface CalendarEvent {
  title: string;
  startsAt: string; // UTC ISO
  durationMin: number;
  location?: string;
  notes?: string;
}

/** 2026-09-05T08:00:00.000Z -> 20260905T080000Z (compact UTC, iCal form). */
function stamp(iso: string): string {
  return iso.replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

/** Compact UTC start/end for an event, end = start + duration. */
export function eventTimes(startIso: string, durationMin: number): { start: string; end: string } {
  const startMs = new Date(startIso).getTime();
  const endIso = new Date(startMs + Math.max(1, durationMin) * 60_000).toISOString();
  return { start: stamp(new Date(startMs).toISOString()), end: stamp(endIso) };
}

export function googleCalendarUrl(e: CalendarEvent): string {
  const { start, end } = eventTimes(e.startsAt, e.durationMin);
  const p = new URLSearchParams({ action: "TEMPLATE", text: e.title || "Meeting", dates: `${start}/${end}` });
  if (e.location) p.set("location", e.location);
  if (e.notes) p.set("details", e.notes);
  return `https://calendar.google.com/calendar/render?${p.toString()}`;
}

const esc = (s: string) => (s || "").replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");

export function icsContent(e: CalendarEvent, uid: string): string {
  const { start, end } = eventTimes(e.startsAt, e.durationMin);
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Sajtpress CRM//Meetings//EN",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${start}`,
    `DTSTART:${start}`,
    `DTEND:${end}`,
    `SUMMARY:${esc(e.title || "Meeting")}`,
    e.location ? `LOCATION:${esc(e.location)}` : "",
    e.notes ? `DESCRIPTION:${esc(e.notes)}` : "",
    "END:VEVENT",
    "END:VCALENDAR",
  ]
    .filter(Boolean)
    .join("\r\n");
}
