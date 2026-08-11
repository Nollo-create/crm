import { QuoteEditor } from "./quote-editor";

export const dynamic = "force-dynamic";

export default async function QuotePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <QuoteEditor id={Number(id)} />;
}
