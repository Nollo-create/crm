"use server";

import { revalidatePath } from "next/cache";
import { createTask, listTasksPage, setTaskDone, updateTask, deleteTask, getCompany, type TaskStatsRow } from "@/lib/db";
import { requireSession, guardWrite } from "@/lib/auth/session";
import { isTaskPriority } from "@/lib/crm/tasks";
import { validated, vString } from "@/lib/crm/validate";

export interface Task {
  id: number;
  companyId: number | null;
  companyName: string | null;
  title: string;
  notes: string;
  dueDate: string | null;
  priority: string;
  done: boolean;
  createdAt: string;
}

const ymd = (d: Date | null) => (d ? new Date(d).toISOString().slice(0, 10) : null);

function toTask(r: TaskStatsRow): Task {
  return {
    id: r.id,
    companyId: r.company_id,
    companyName: r.company_name,
    title: r.title,
    notes: r.notes,
    dueDate: ymd(r.due_date),
    priority: r.priority,
    done: !!r.done,
    createdAt: new Date(r.created_at).toISOString(),
  };
}

export interface TasksPage {
  rows: Task[];
  total: number;
  page: number;
  pageCount: number;
}

export async function tasksPageAction(opts: {
  q?: string;
  done?: boolean;
  priority?: string;
  due?: string;
  sortKey: string;
  sortDir: 1 | -1;
  page: number;
  pageSize: number;
}): Promise<TasksPage> {
  const { organizationId } = await requireSession();
  const res = await listTasksPage(organizationId, {
    q: opts.q?.trim() || undefined,
    done: opts.done,
    priority: opts.priority || undefined,
    due: opts.due || undefined,
    sortKey: opts.sortKey,
    sortDir: opts.sortDir,
    page: opts.page,
    pageSize: opts.pageSize,
  });
  return { rows: res.rows.map(toTask), total: res.total, page: res.page, pageCount: res.pageCount };
}

export async function createTaskAction(input: {
  title: string;
  notes?: string;
  dueDate?: string | null;
  priority?: string;
  companyId?: number | null;
}): Promise<{ id?: number; error?: string }> {
  const g = await guardWrite();
  if ("error" in g) return { error: g.error };
  const { organizationId } = g.session;
  const v = validated(() => ({
    title: vString("Title", input.title, { required: true, max: 190 }),
    notes: vString("Notes", input.notes, { max: 2000 }),
  }));
  if (!v.ok) return { error: v.error };
  const priority = input.priority && isTaskPriority(input.priority) ? input.priority : "normal";
  if (input.companyId && !(await getCompany(organizationId, input.companyId))) return { error: "Company not found." };
  const id = await createTask(organizationId, {
    title: v.value.title,
    notes: v.value.notes,
    dueDate: input.dueDate || null,
    priority,
    companyId: input.companyId || null,
  });
  revalidatePath("/tasks");
  return { id };
}

export async function toggleTaskDoneAction(id: number, done: boolean): Promise<{ error?: string }> {
  const g = await guardWrite();
  if ("error" in g) return { error: g.error };
  await setTaskDone(g.session.organizationId, id, done);
  revalidatePath("/tasks");
  return {};
}

export async function updateTaskAction(id: number, patch: { title?: string; notes?: string; dueDate?: string | null; priority?: string }): Promise<{ error?: string }> {
  const g = await guardWrite();
  if ("error" in g) return { error: g.error };
  const { organizationId } = g.session;
  const check = validated(() => {
    if (patch.title !== undefined) vString("Title", patch.title, { required: true, max: 190 });
    vString("Notes", patch.notes, { max: 2000 });
    return true;
  });
  if (!check.ok) return { error: check.error };
  const priority = patch.priority && isTaskPriority(patch.priority) ? patch.priority : undefined;
  await updateTask(organizationId, id, { ...patch, priority });
  revalidatePath("/tasks");
  return {};
}

export async function deleteTaskAction(id: number): Promise<{ error?: string }> {
  const g = await guardWrite();
  if ("error" in g) return { error: g.error };
  await deleteTask(g.session.organizationId, id);
  revalidatePath("/tasks");
  return {};
}
