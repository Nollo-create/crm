import { describe, it, expect } from "vitest";
import { parseOutreachDraft } from "./outreach-draft";

describe("parseOutreachDraft", () => {
  it("peels a leading Subject: line off into the subject", () => {
    const r = parseOutreachDraft("Subject: Quick idea for Acme\n\nHi Sam,\n\nWould love to chat.\n\nBest,\nJ");
    expect(r.subject).toBe("Quick idea for Acme");
    expect(r.body).toBe("Hi Sam,\n\nWould love to chat.\n\nBest,\nJ");
  });

  it("is case-insensitive and tolerates extra spacing", () => {
    expect(parseOutreachDraft("  SUBJECT :   Hello  \nBody here").subject).toBe("Hello");
  });

  it("skips leading blank lines before the subject", () => {
    const r = parseOutreachDraft("\n\nSubject: Hi\nBody");
    expect(r.subject).toBe("Hi");
    expect(r.body).toBe("Body");
  });

  it("no Subject line → empty subject, whole text as body", () => {
    const r = parseOutreachDraft("Hi Sam, just checking in.");
    expect(r.subject).toBe("");
    expect(r.body).toBe("Hi Sam, just checking in.");
  });

  it("handles empty / whitespace input", () => {
    expect(parseOutreachDraft("")).toEqual({ subject: "", body: "" });
    expect(parseOutreachDraft("   \n  ")).toEqual({ subject: "", body: "" });
  });
});
