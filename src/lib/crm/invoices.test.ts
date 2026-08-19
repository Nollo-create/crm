import { describe, it, expect } from "vitest";
import { isInvoiceStatus, invoiceNumber, isInvoiceOverdue, isInvoiceSortKey, buildInvoiceOrderBy } from "./invoices";

describe("invoice helpers", () => {
  it("validates statuses + formats the number", () => {
    expect(isInvoiceStatus("paid")).toBe(true);
    expect(isInvoiceStatus("nope")).toBe(false);
    expect(invoiceNumber(7)).toBe("INV-0007");
    expect(invoiceNumber(1234)).toBe("INV-1234");
  });

  it("overdue only for sent + unpaid + past due", () => {
    expect(isInvoiceOverdue("sent", "2026-08-18", "2026-08-19")).toBe(true);
    expect(isInvoiceOverdue("sent", "2026-08-19", "2026-08-19")).toBe(false); // due today = not overdue
    expect(isInvoiceOverdue("paid", "2026-08-01", "2026-08-19")).toBe(false); // paid never overdue
    expect(isInvoiceOverdue("draft", "2026-08-01", "2026-08-19")).toBe(false); // draft never overdue
    expect(isInvoiceOverdue("sent", null, "2026-08-19")).toBe(false); // no due date
  });

  it("sort allowlist rejects junk and defaults safely", () => {
    expect(isInvoiceSortKey("due")).toBe(true);
    expect(isInvoiceSortKey("drop table")).toBe(false);
    expect(buildInvoiceOrderBy("due", -1)).toBe("ORDER BY i.due_date DESC, i.id DESC");
    expect(buildInvoiceOrderBy("garbage", 1)).toBe("ORDER BY i.created_at ASC, i.id DESC");
  });
});
