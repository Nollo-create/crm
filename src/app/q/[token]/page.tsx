import { getQuoteByToken, getOrganization } from "@/lib/db";
import { quoteNumber, isQuoteExpired } from "@/lib/crm/quotes";
import { QuoteView } from "./quote-view";

export const dynamic = "force-dynamic";

export default async function PublicQuotePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const res = await getQuoteByToken((token || "").slice(0, 64)).catch(() => null);
  if (!res) {
    return (
      <main className="grid min-h-screen place-items-center p-6">
        <p className="text-sm text-muted-foreground">This quote is no longer available.</p>
      </main>
    );
  }
  const { quote, items } = res;
  const org = await getOrganization(quote.organization_id).catch(() => null);
  const validUntil = quote.valid_until ? new Date(quote.valid_until).toISOString().slice(0, 10) : null;
  const todayYmd = new Date().toISOString().slice(0, 10);

  const data = {
    token: quote.public_token,
    number: quoteNumber(quote.id),
    companyName: quote.company_name,
    status: quote.status,
    validUntil,
    expired: isQuoteExpired(validUntil, todayYmd),
    notes: quote.notes,
    total: quote.total_cents / 100,
    decidedAt: quote.decided_at ? new Date(quote.decided_at).toISOString() : null,
    clientName: quote.client_name || "",
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
      <QuoteView data={data} />
    </main>
  );
}
