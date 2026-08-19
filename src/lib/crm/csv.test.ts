import { describe, it, expect } from "vitest";
import { parseCsv, autoMapHeaders, csvCell, toCsv } from "./csv";

describe("csvCell", () => {
  it("quotes and escapes embedded quotes", () => {
    expect(csvCell("hi")).toBe('"hi"');
    expect(csvCell('a"b')).toBe('"a""b"');
    expect(csvCell(null)).toBe('""');
    expect(csvCell(1200)).toBe('"1200"');
  });
  it("neutralizes spreadsheet formula injection", () => {
    expect(csvCell("=SUM(A1)")).toBe(`"'=SUM(A1)"`);
    expect(csvCell("+1")).toBe(`"'+1"`);
    expect(csvCell("@x")).toBe(`"'@x"`);
  });
});

describe("toCsv", () => {
  it("serializes a grid with CRLF rows", () => {
    expect(toCsv([["Name", "City"], ["Acme", "Beograd"]])).toBe('"Name","City"\r\n"Acme","Beograd"');
  });
  it("round-trips through parseCsv", () => {
    const grid = [["Name", "Note"], ["Acme", 'has "quotes", and commas']];
    expect(parseCsv(toCsv(grid))).toEqual([["Name", "Note"], ["Acme", 'has "quotes", and commas']]);
  });
});

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
