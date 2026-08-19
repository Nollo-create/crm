import { InvoiceEditor } from "./invoice-editor";

export const dynamic = "force-dynamic";

export default async function InvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <InvoiceEditor id={Number(id)} />;
}
