// Tasks domain — pure data + the server-side sort allowlist. A task is a to-do
// / reminder, optionally linked to a company. `t` = crm_tasks.

export type TaskPriority = "high" | "normal" | "low";
export const TASK_PRIORITIES: TaskPriority[] = ["high", "normal", "low"];
export const TASK_PRIORITY_LABEL: Record<TaskPriority, string> = { high: "High", normal: "Normal", low: "Low" };
export function isTaskPriority(v: string): v is TaskPriority {
  return (TASK_PRIORITIES as string[]).includes(v);
}

export type TaskSortKey = "due" | "priority" | "title" | "created";
const PRIORITY_FIELD = "FIELD(t.priority, 'high', 'normal', 'low')";
const SORT_EXPR: Record<TaskSortKey, string> = {
  due: "t.due_date",
  priority: PRIORITY_FIELD,
  title: "t.title",
  created: "t.id",
};
const KEYS = new Set(Object.keys(SORT_EXPR));

export function isTaskSortKey(v: string): v is TaskSortKey {
  return KEYS.has(v);
}

export function buildTaskOrderBy(key: string, dir: 1 | -1): string {
  const direction = dir === 1 ? "ASC" : "DESC";
  const resolved: TaskSortKey = isTaskSortKey(key) ? key : "due"; // default
  // Undated tasks always sort last, whichever direction the date sort goes.
  if (resolved === "due") {
    return `ORDER BY t.due_date IS NULL, t.due_date ${direction}, t.id DESC`;
  }
  return `ORDER BY ${SORT_EXPR[resolved]} ${direction}, t.id DESC`;
}
