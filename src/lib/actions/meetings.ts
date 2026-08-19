"use server";

import { revalidatePath } from "next/cache";
import { requireSession, guardWrite } from "@/lib/auth/session";
import { recordAudit } from "@/lib/auth/audit";
import { validated, vString, vInt } from "@/lib/crm/validate";
import { createMeeting, updateMeeting, deleteMeeting, listMeetings, getMeeting, listMeetingsToday, addActivity, type MeetingRow } from "@/lib/db";

export interface MeetingView {
  id: number;
  title: string;
  startsAt: string;
  durationMin: number;
  companyId: number | null;
  companyName: string | null;
  contactId: number | null;
  contactName: string | null;
  location: string;
  notes: string;
}

function toView(r: MeetingRow): MeetingView {
  return {
    id: r.id,
    title: r.title,
    startsAt: new Date(r.starts_at).toISOString(),
    durationMin: r.duration_min,
    companyId: r.company_id,
    companyName: r.company_name,
    contactId: r.contact_id,
    contactName: r.contact_name,
    location: r.location,
    notes: r.notes ?? "",
  };
}

export interface MeetingDTO {
  title: string;
  startsAt: string; // ISO
  durationMin: number;
  companyId?: number | null;
  contactId?: number | null;
  location?: string;
  notes?: string;
}

export async function meetingsAction(): Promise<MeetingView[]> {
  const { organizationId } = await requireSession();
  const rows = await listMeetings(organizationId).catch(() => []);
  return rows.map(toView);
}

export async function meetingsTodayAction(): Promise<MeetingView[]> {
  const { organizationId } = await requireSession();
  const rows = await listMeetingsToday(organizationId).catch(() => []);
  return rows.map(toView);
}

export async function getMeetingAction(id: number): Promise<MeetingView | null> {
  const { organizationId } = await requireSession();
  const r = await getMeeting(organizationId, id).catch(() => null);
  return r ? toView(r) : null;
}

function validateMeeting(input: MeetingDTO) {
  return validated(() => ({
    title: vString("Title", input.title, { required: true, max: 200 }),
    location: vString("Location", input.location, { max: 200 }),
    notes: vString("Notes", input.notes, { max: 5000 }),
    durationMin: vInt("Duration", input.durationMin, { min: 5, max: 600 }) ?? 30,
  }));
}

export async function createMeetingAction(input: MeetingDTO): Promise<{ id?: number; error?: string }> {
  const g = await guardWrite();
  if ("error" in g) return { error: g.error };
  const session = g.session;
  const when = new Date(input.startsAt);
  if (isNaN(when.getTime())) return { error: "Pick a date and time." };
  const v = validateMeeting(input);
  if (!v.ok) return { error: v.error };

  const id = await createMeeting(session.organizationId, {
    title: v.value.title,
    startsAt: when,
    durationMin: v.value.durationMin,
    companyId: input.companyId ?? null,
    contactId: input.contactId ?? null,
    location: v.value.location,
    notes: v.value.notes,
    createdBy: session.email,
  });
  // Surface it on the linked record's timeline.
  if (input.companyId) {
    await addActivity(session.organizationId, { companyId: input.companyId, contactId: input.contactId ?? null, type: "meeting", summary: `Meeting: ${v.value.title} — ${when.toLocaleString()}` }).catch(() => {});
  }
  await recordAudit(session, "meeting_create", "meeting", id, v.value.title);
  revalidatePath("/meetings");
  return { id };
}

export async function updateMeetingAction(id: number, input: MeetingDTO): Promise<{ error?: string }> {
  const g = await guardWrite();
  if ("error" in g) return { error: g.error };
  const when = new Date(input.startsAt);
  if (isNaN(when.getTime())) return { error: "Pick a date and time." };
  const v = validateMeeting(input);
  if (!v.ok) return { error: v.error };
  await updateMeeting(g.session.organizationId, id, {
    title: v.value.title,
    startsAt: when,
    durationMin: v.value.durationMin,
    companyId: input.companyId ?? null,
    contactId: input.contactId ?? null,
    location: v.value.location,
    notes: v.value.notes,
  });
  revalidatePath("/meetings");
  return {};
}

export async function deleteMeetingAction(id: number): Promise<{ error?: string }> {
  const g = await guardWrite();
  if ("error" in g) return { error: g.error };
  await deleteMeeting(g.session.organizationId, id);
  revalidatePath("/meetings");
  return {};
}
