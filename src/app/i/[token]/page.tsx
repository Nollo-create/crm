import { getInvoiceByToken, getOrganization } from "@/lib/db";
import { invoiceNumber, isInvoiceOverdue } from "@/lib/crm/invoices";
import { InvoiceView } from "./invoice-view";

export const dynamic = "force-dynamic";

export default async function PublicInvoicePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const res = await getInvoiceByToken((token || "").slice(0, 64)).catch(() => null);
  if (!res) {
    return (
      <main className="grid min-h-screen place-items-center p-6">
        <p className="text-sm text-muted-foreground">This invoice is no longer available.</p>
      </main>
    );
  }
  const { invoice, items } = res;
  const org = await getOrganization(invoice.organization_id).catch(() => null);
  const issueDate = invoice.issue_date ? new Date(invoice.issue_date).toISOString().slice(0, 10) : null;
  const dueDate = invoice.due_date ? new Date(invoice.due_date).toISOString().slice(0, 10) : null;
  const todayYmd = new Date().toISOString().slice(0, 10);

  const data = {
    number: invoiceNumber(invoice.id),
    companyName: invoice.company_name,
    status: invoice.status,
    issueDate,
    dueDate,
    overdue: isInvoiceOverdue(invoice.status, dueDate, todayYmd),
    notes: invoice.notes,
    total: invoice.total_cents / 100,
    paidAt: invoice.paid_at ? new Date(invoice.paid_at).toISOString() : null,
    paidAmount: invoice.paid_amount_cents / 100,
    paymentMethod: invoice.payment_method || "",
    seller: {
      name: (org?.billing_name || org?.name || "Sajtpress").trim(),
      address: (org?.billing_address || "").trim(),
      taxId: (org?.tax_id || "").trim(),
      email: (org?.billing_email || "").trim(),
    },
    items: items.map((it) => ({ name: it.name, unitPrice: it.unit_price_cents / 100, quantity: it.quantity, lineTotal: it.line_total_cents / 100 })),
  };
  return (
    <main className="min-h-screen bg-secondary/30 px-4 py-8 print:bg-white print:px-0 print:py-0">
      <InvoiceView data={data} />
    </main>
  );
}
