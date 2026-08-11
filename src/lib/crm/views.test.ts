import { describe, it, expect } from "vitest";
import { viewMatches, activeViewId, makeView, normalizeViews, BUILTIN_VIEWS, type ViewState } from "./views";

describe("viewMatches / activeViewId", () => {
  it("matches on status + sort together", () => {
    const s: ViewState = { status: "lead", sortKey: "score", sortDir: -1 };
    expect(viewMatches({ id: "x", name: "x", status: "lead", sortKey: "score", sortDir: -1 }, s)).toBe(true);
    expect(viewMatches({ id: "x", name: "x", status: "lead", sortKey: "score", sortDir: 1 }, s)).toBe(false);
    expect(viewMatches({ id: "x", name: "x", status: "active", sortKey: "score", sortDir: -1 }, s)).toBe(false);
  });

  it("finds the built-in for a state, null when custom", () => {
    expect(activeViewId(BUILTIN_VIEWS, { status: "", sortKey: "score", sortDir: -1 })).toBe("all");
    expect(activeViewId(BUILTIN_VIEWS, { status: "lead", sortKey: "score", sortDir: -1 })).toBe("leads");
    expect(activeViewId(BUILTIN_VIEWS, { status: "customer", sortKey: "name", sortDir: 1 })).toBeNull();
  });
});

describe("makeView", () => {
  it("trims the name and snapshots the state", () => {
    expect(makeView("v1", "  My view ", { status: "active", sortKey: "openValue", sortDir: -1 })).toEqual({
      id: "v1", name: "My view", status: "active", sortKey: "openValue", sortDir: -1,
    });
  });
});

describe("normalizeViews", () => {
  it("keeps valid views and drops anything malformed", () => {
    const raw = [
      { id: "a", name: "Good", status: "", sortKey: "score", sortDir: -1 },
      { id: "b", name: "   ", status: "", sortKey: "score", sortDir: -1 },       // blank name
      { id: "c", name: "Bad sort", status: "", sortKey: "nope", sortDir: -1 },   // unknown sort key
      { id: "d", name: "Bad dir", status: "", sortKey: "score", sortDir: 0 },    // invalid dir
      "garbage",
      null,
    ];
    const out = normalizeViews(raw);
    expect(out).toHaveLength(1);
    expect(out[0].id).toBe("a");
  });

  it("returns [] for non-arrays", () => {
    expect(normalizeViews(null)).toEqual([]);
    expect(normalizeViews({})).toEqual([]);
    expect(normalizeViews("[]")).toEqual([]);
  });
});
