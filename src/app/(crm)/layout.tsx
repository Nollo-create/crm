import { Shell } from "@/components/crm/shell";
import { integration, isConnected } from "@/lib/config";

export default function CrmLayout({ children }: { children: React.ReactNode }) {
  return <Shell connected={isConnected(integration)}>{children}</Shell>;
}
