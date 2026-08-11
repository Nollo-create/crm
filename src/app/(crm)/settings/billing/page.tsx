import { getBillingAction } from "@/lib/actions/billing";
import { BillingManager } from "./billing-manager";

export const dynamic = "force-dynamic";

export default async function BillingPage() {
  const data = await getBillingAction();
  if (!data) {
    return <p className="py-16 text-center text-sm text-muted-foreground">Could not load billing.</p>;
  }
  return <BillingManager data={data} />;
}
