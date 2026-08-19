import { describe, it, expect } from "vitest";
import { normalizeCompanyName, normalizeDomain, findDuplicateGroups, type DedupeCompany } from "./dedupe";

describe("normalizeCompanyName", () => {
  it("strips legal suffixes, case and punctuation", () => {
    expect(normalizeCompanyName("Acme d.o.o.")).toBe("acme");
    expect(normalizeCompanyName("ACME, LLC")).toBe("acme");
    expect(normalizeCompanyName("Acme Inc.")).toBe("acme");
    expect(normalizeCompanyName("  Acme   ")).toBe("acme");
  });
  it("keeps distinct names distinct", () => {
    expect(normalizeCompanyName("Acme")).not.toBe(normalizeCompanyName("Acmex"));
  });
});

describe("normalizeDomain", () => {
  it("extracts the bare host from urls and emails", () => {
    expect(normalizeDomain("https://www.acme.com/contact")).toBe("acme.com");
    expect(normalizeDomain("HELLO@Acme.com")).toBe("acme.com");
    expect(normalizeDomain("http://acme.com")).toBe("acme.com");
    expect(normalizeDomain("")).toBe("");
  });
});

const co = (id: number, p: Partial<DedupeCompany> = {}): DedupeCompany => ({ id, name: "", website: "", email: "", vatId: "", ...p });

describe("findDuplicateGroups", () => {
  it("groups by normalized name", () => {
    const groups = findDuplicateGroups([co(1, { name: "Acme d.o.o." }), co(2, { name: "ACME LLC" }), co(3, { name: "Globex" })]);
    const nameGroup = groups.find((g) => g.reason === "name");
    expect(nameGroup?.ids).toEqual([1, 2]);
  });

  it("groups by shared web/email domain even when names differ", () => {
    const groups = findDuplicateGroups([co(1, { name: "Acme", website: "https://acme.com" }), co(2, { name: "Acme Sales", email: "rep@acme.com" })]);
    expect(groups.some((g) => g.reason === "domain" && g.ids.includes(1) && g.ids.includes(2))).toBe(true);
  });

  it("groups by VAT id", () => {
    const groups = findDuplicateGroups([co(1, { name: "A", vatId: "RS12345678" }), co(2, { name: "B", vatId: "rs 12345678" })]);
    expect(groups.find((g) => g.reason === "vat")?.ids).toEqual([1, 2]);
  });

  it("ignores singletons and reports the strongest reason once", () => {
    // Same name AND same domain -> one group, under the stronger (domain) reason.
    const groups = findDuplicateGroups([co(1, { name: "Acme", website: "acme.com" }), co(2, { name: "Acme", website: "acme.com" }), co(3, { name: "Unique Co" })]);
    const withBoth = groups.filter((g) => g.ids.length === 2 && g.ids[0] === 1 && g.ids[1] === 2);
    expect(withBoth).toHaveLength(1);
    expect(withBoth[0].reason).toBe("domain");
    expect(groups.every((g) => g.ids.length >= 2)).toBe(true);
  });

  it("returns nothing for a clean list", () => {
    expect(findDuplicateGroups([co(1, { name: "Acme" }), co(2, { name: "Globex" })])).toEqual([]);
  });
});
