import { describe, it, expect } from "vitest";
import { parseCsv, autoMapHeaders } from "./csv";

describe("parseCsv", () => {
  it("parses a simple grid", () => {
    expect(parseCsv("a,b,c\n1,2,3")).toEqual([
      ["a", "b", "c"],
      ["1", "2", "3"],
    ]);
  });
  it("handles quoted fields with embedded commas and newlines", () => {
    const csv = 'name,note\n"Acme, Inc.","line1\nline2"';
    expect(parseCsv(csv)).toEqual([
      ["name", "note"],
      ["Acme, Inc.", "line1\nline2"],
    ]);
  });
  it("unescapes doubled quotes", () => {
    expect(parseCsv('a\n"she said ""hi"""')).toEqual([["a"], ['she said "hi"']]);
  });
  it("normalizes CRLF and drops a trailing newline", () => {
    expect(parseCsv("a,b\r\n1,2\r\n")).toEqual([
      ["a", "b"],
      ["1", "2"],
    ]);
  });
  it("keeps empty cells", () => {
    expect(parseCsv("a,,c")).toEqual([["a", "", "c"]]);
  });
  it("handles empty input", () => {
    expect(parseCsv("")).toEqual([]);
  });
});

describe("autoMapHeaders", () => {
  it("maps common header names to lead fields", () => {
    const m = autoMapHeaders(["Full Name", "Company", "Email Address", "Phone", "Job Title", "Website", "Sector"]);
    expect(m).toEqual({ name: 0, company: 1, email: 2, phone: 3, title: 4, website: 5, industry: 6 });
  });
  it("is case-insensitive and matches by substring", () => {
    const m = autoMapHeaders(["organisation", "e-mail", "mobile"]);
    expect(m.company).toBe(0);
    expect(m.email).toBe(1);
    expect(m.phone).toBe(2);
  });
  it("omits fields it can't find", () => {
    const m = autoMapHeaders(["foo", "bar"]);
    expect(m.name).toBeUndefined();
    expect(Object.keys(m)).toHaveLength(0);
  });
});
