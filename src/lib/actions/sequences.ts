"use server";

import { revalidatePath } from "next/cache";
import { requireSession, guardWrite } from "@/lib/auth/session";
import { recordAudit } from "@/lib/auth/audit";
import { validated, vString, vInt } from "@/lib/crm/validate";
import {
  listSequences,
  getSequence,
  getSequenceSteps,
  createSequence,
  updateSequence,
  replaceSequenceSteps,
  deleteSequence,
  activeEnrollmentExists,
  createEnrollment,
  listContactEnrollments,
  stopEnrollment,
  getContact,
} from "@/lib/db";

const DAY_MS = 24 * 60 * 60_000;

export interface SequenceStepInput {
  delayDays: number;
  subject: string;
  body: string;
}
export interface SequenceListItem {
  id: number;
  name: string;
  stopOnOpen: boolean;
  stepCount: number;
  activeCount: number;
  totalEnrolled: number;
}
export interface SequenceDetail {
  id: number;
  name: string;
  stopOnOpen: boolean;
  steps: SequenceStepInput[];
}

export async function listSequencesAction(): Promise<SequenceListItem[]> {
  const { organizationId } = await requireSession();
  const rows = await listSequences(organizationId).catch(() => []);
  return rows.map((r) => ({ id: r.id, name: r.name, stopOnOpen: !!r.stop_on_open, stepCount: r.step_count, activeCount: r.active_count, totalEnrolled: r.total_enrolled }));
}

export async function getSequenceAction(id: number): Promise<SequenceDetail | null> {
  const { organizationId } = await requireSession();
  const seq = await getSequence(organizationId, id).catch(() => null);
  if (!seq) return null;
  const steps = await getSequenceSteps(organizationId, id).catch(() => []);
  return { id: seq.id, name: seq.name, stopOnOpen: !!seq.stop_on_open, steps: steps.map((s) => ({ delayDays: s.delay_days, subject: s.subject, body: s.body ?? "" })) };
}

export async function saveSequenceAction(input: { id?: number; name: string; stopOnOpen: boolean; steps: SequenceStepInput[] }): Promise<{ id?: number; error?: string }> {
  const g = await guardWrite();
  if ("error" in g) return { error: g.error };
  const session = g.session;

  const nameCheck = validated(() => ({ name: vString("Name", input.name, { required: true, max: 120 }) }));
  if (!nameCheck.ok) return { error: nameCheck.error };
  const steps = (input.steps ?? []).slice(0, 10);
  if (steps.length === 0) return { error: "Add at least one step." };
  const clean: SequenceStepInput[] = [];
  for (let i = 0; i < steps.length; i++) {
    const sv = validated(() => ({
      subject: vString(`Step ${i + 1} subject`, steps[i].subject, { required: true, max: 300 }),
      body: vString(`Step ${i + 1} body`, steps[i].body, { required: true, max: 20000 }),
      delayDays: vInt(`Step ${i + 1} delay`, steps[i].delayDays, { min: 0, max: 365 }) ?? 0,
    }));
    if (!sv.ok) return { error: sv.error };
    clean.push({ subject: sv.value.subject, body: sv.value.body, delayDays: sv.value.delayDays });
  }

  let id = input.id ?? 0;
  if (id) {
    await updateSequence(session.organizationId, id, { name: nameCheck.value.name, stopOnOpen: input.stopOnOpen });
    await recordAudit(session, "sequence_update", "sequence", id, nameCheck.value.name);
  } else {
    id = await createSequence(session.organizationId, { name: nameCheck.value.name, stopOnOpen: input.stopOnOpen, createdBy: session.email });
    await recordAudit(session, "sequence_create", "sequence", id, nameCheck.value.name);
  }
  await replaceSequenceSteps(session.organizationId, id, clean);
  revalidatePath("/emails/sequences");
  return { id };
}

export async function deleteSequenceAction(id: number): Promise<{ error?: string }> {
  const g = await guardWrite();
  if ("error" in g) return { error: g.error };
  await deleteSequence(g.session.organizationId, id);
  await recordAudit(g.session, "sequence_delete", "sequence", id);
  revalidatePath("/emails/sequences");
  return {};
}

/** Enroll a contact into a sequence — its first step goes out on the next cron
 *  tick after the step's delay. */
export async function enrollContactAction(sequenceId: number, contactId: number): Promise<{ ok?: true; error?: string }> {
  const g = await guardWrite();
  if ("error" in g) return { error: g.error };
  const session = g.session;

  const contact = await getContact(session.organizationId, contactId).catch(() => null);
  if (!contact) return { error: "Contact not found." };
  if (!contact.email) return { error: "That contact has no email address." };
  const steps = await getSequenceSteps(session.organizationId, sequenceId).catch(() => []);
  if (steps.length === 0) return { error: "That sequence has no steps yet." };
  if (await activeEnrollmentExists(session.organizationId, sequenceId, contactId)) return { error: "Already enrolled in this sequence." };

  const nextSendAt = new Date(Date.now() + Math.max(0, steps[0].delay_days) * DAY_MS);
  await createEnrollment(session.organizationId, {
    sequenceId,
    contactId,
    companyId: contact.company_id,
    toEmail: contact.email,
    recipientName: contact.name,
    companyName: contact.company_name,
    enrolledBy: session.email,
    nextSendAt,
  });
  await recordAudit(session, "sequence_enroll", "contact", contactId, `sequence #${sequenceId}`);
  revalidatePath(`/contacts/${contactId}`);
  return { ok: true };
}

export interface ContactEnrollment {
  id: number;
  sequenceId: number;
  sequenceName: string;
  status: string;
  currentStep: number;
}

export async function listContactEnrollmentsAction(contactId: number): Promise<ContactEnrollment[]> {
  const { organizationId } = await requireSession();
  return listContactEnrollments(organizationId, contactId).catch(() => []);
}

export async function stopEnrollmentAction(id: number, contactId?: number): Promise<{ error?: string }> {
  const g = await guardWrite();
  if ("error" in g) return { error: g.error };
  await stopEnrollment(g.session.organizationId, id);
  await recordAudit(g.session, "sequence_stop", "contact", contactId ?? null, `enrollment #${id}`);
  if (contactId) revalidatePath(`/contacts/${contactId}`);
  return {};
}
