import { describe, it, expect } from "vitest";
import { eventTimes, googleCalendarUrl, icsContent } from "./calendar-links";

const ev = { title: "Kickoff call", startsAt: "2026-09-05T08:00:00.000Z", durationMin: 30, location: "Zoom", notes: "Discuss scope" };

describe("eventTimes", () => {
  it("formats compact UTC and adds the duration", () => {
    expect(eventTimes("2026-09-05T08:00:00.000Z", 30)).toEqual({ start: "20260905T080000Z", end: "20260905T083000Z" });
  });
  it("rolls the hour/day over", () => {
    expect(eventTimes("2026-09-05T23:45:00.000Z", 30).end).toBe("20260906T001500Z");
  });
});

describe("googleCalendarUrl", () => {
  it("includes the encoded title, dates, location and details", () => {
    const url = googleCalendarUrl(ev);
    expect(url).toContain("action=TEMPLATE");
    expect(url).toContain("dates=20260905T080000Z%2F20260905T083000Z");
    expect(url).toContain("text=Kickoff+call");
    expect(url).toContain("location=Zoom");
    expect(url).toContain("details=Discuss+scope");
  });
});

describe("icsContent", () => {
  it("produces a VEVENT with escaped fields", () => {
    const ics = icsContent({ ...ev, notes: "Line1, line2; end" }, "meeting-7@sajtpress");
    expect(ics).toContain("BEGIN:VEVENT");
    expect(ics).toContain("UID:meeting-7@sajtpress");
    expect(ics).toContain("DTSTART:20260905T080000Z");
    expect(ics).toContain("DTEND:20260905T083000Z");
    expect(ics).toContain("SUMMARY:Kickoff call");
    expect(ics).toContain("DESCRIPTION:Line1\\, line2\\; end");
    expect(ics).toContain("END:VCALENDAR");
  });
});
