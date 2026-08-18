"use server";

import { revalidatePath } from "next/cache";
import { listTags, createTag, tagsForEntity, setEntityTags } from "@/lib/db";
import { requireSession } from "@/lib/auth/session";

export interface Tag {
  id: number;
  name: string;
  color: string;
}

const ENTITY_TYPES = ["company", "contact", "lead", "deal"];
const ROUTE: Record<string, string> = { company: "companies", contact: "contacts", lead: "leads", deal: "deals" };

export async function listTagsAction(): Promise<Tag[]> {
  const { organizationId } = await requireSession();
  const rows = await listTags(organizationId).catch(() => []);
  return rows.map((t) => ({ id: t.id, name: t.name, color: t.color }));
}

export async function getEntityTagsAction(entityType: string, entityId: number): Promise<Tag[]> {
  const { organizationId } = await requireSession();
  if (!ENTITY_TYPES.includes(entityType)) return [];
  const rows = await tagsForEntity(organizationId, entityType, entityId).catch(() => []);
  return rows.map((t) => ({ id: t.id, name: t.name, color: t.color }));
}

/** Set the full tag set on an entity. `newTags` are created first (idempotent),
 *  their ids folded in. Returns the resulting tags. */
export async function setEntityTagsAction(
  entityType: string,
  entityId: number,
  tagIds: number[],
  newTags?: { name: string; color: string }[]
): Promise<{ tags: Tag[]; error?: string }> {
  const { organizationId } = await requireSession();
  if (!ENTITY_TYPES.includes(entityType)) return { tags: [], error: "Unknown entity." };
  const ids = [...tagIds];
  for (const nt of (newTags ?? []).slice(0, 20)) {
    const nm = (nt.name ?? "").trim();
    if (!nm) continue;
    const id = await createTag(organizationId, nm, nt.color || "electric").catch(() => 0);
    if (id) ids.push(id);
  }
  await setEntityTags(organizationId, entityType, entityId, ids);
  const rows = await tagsForEntity(organizationId, entityType, entityId).catch(() => []);
  revalidatePath(`/${ROUTE[entityType] ?? entityType}/${entityId}`);
  return { tags: rows.map((t) => ({ id: t.id, name: t.name, color: t.color })) };
}
