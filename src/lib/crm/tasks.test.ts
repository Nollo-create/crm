import { describe, it, expect } from "vitest";
import { buildTaskOrderBy, isTaskSortKey, isTaskPriority } from "./tasks";

describe("task validation", () => {
  it("recognises valid priorities", () => {
    expect(isTaskPriority("high")).toBe(true);
    expect(isTaskPriority("urgent")).toBe(false);
  });
});

describe("buildTaskOrderBy", () => {
  it("sorts due dates with nulls last, both directions", () => {
    expect(buildTaskOrderBy("due", 1)).toBe("ORDER BY t.due_date IS NULL, t.due_date ASC, t.id DESC");
    expect(buildTaskOrderBy("due", -1)).toBe("ORDER BY t.due_date IS NULL, t.due_date DESC, t.id DESC");
  });

  it("sorts priority in high->low order via FIELD()", () => {
    expect(buildTaskOrderBy("priority", 1)).toBe("ORDER BY FIELD(t.priority, 'high', 'normal', 'low') ASC, t.id DESC");
  });

  it("falls back to the default (due) for unknown / injection input", () => {
    expect(buildTaskOrderBy("done); DROP TABLE crm_tasks; --", 1)).toBe("ORDER BY t.due_date IS NULL, t.due_date ASC, t.id DESC");
    expect(buildTaskOrderBy("evil--", 1)).not.toContain("evil--");
  });

  it("recognises exactly the sortable keys", () => {
    for (const k of ["due", "priority", "title", "created"]) expect(isTaskSortKey(k)).toBe(true);
    expect(isTaskSortKey("done")).toBe(false);
  });
});
