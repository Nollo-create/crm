import { describe, it, expect } from "vitest";
import { buildEmailHtml } from "./email-html";

describe("buildEmailHtml", () => {
  it("escapes HTML so the body can't inject markup", () => {
    const html = buildEmailHtml("Hi <script>alert(1)</script> & <b>you</b>");
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
    expect(html).toContain("&amp;");
  });

  it("preserves line breaks as <br>", () => {
    expect(buildEmailHtml("line1\nline2")).toContain("line1<br>line2");
  });

  it("appends a hidden tracking pixel only when a url is given", () => {
    const withPixel = buildEmailHtml("hi", "https://crm.example/api/e/abc.png");
    expect(withPixel).toContain('src="https://crm.example/api/e/abc.png"');
    expect(withPixel).toContain('width="1"');
    expect(buildEmailHtml("hi")).not.toContain("<img");
  });
});
