import { describe, it, expect } from "vitest";
import { applyTemplate, templateVars } from "./email-template";

describe("applyTemplate", () => {
  const vars = templateVars({ name: "Sam Rivera", company: "Acme" });

  it("substitutes known placeholders", () => {
    expect(applyTemplate("Hi {{name}} at {{company}}", vars)).toBe("Hi Sam Rivera at Acme");
  });
  it("supports first_name and is case/space-insensitive", () => {
    expect(applyTemplate("Hey {{ First_Name }}!", vars)).toBe("Hey Sam!");
  });
  it("renders unknown or missing placeholders as empty (never literal {{x}})", () => {
    expect(applyTemplate("A {{unknown}} B", vars)).toBe("A  B");
    const empty = templateVars({});
    expect(applyTemplate("Hi {{name}}", empty)).toBe("Hi ");
  });
  it("leaves ordinary braces / text alone", () => {
    expect(applyTemplate("no vars here { just } text", vars)).toBe("no vars here { just } text");
  });
});

describe("templateVars", () => {
  it("derives first_name from the first word and trims", () => {
    expect(templateVars({ name: "  Dana Q. Lee " }).first_name).toBe("Dana");
    expect(templateVars({ company: " Globex " }).company).toBe("Globex");
    expect(templateVars({}).name).toBe("");
  });
});
