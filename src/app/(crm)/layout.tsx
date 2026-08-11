import { Shell } from "@/components/crm/shell";
import { ToastProvider } from "@/components/ui/toast";
import { integration, isConnected } from "@/lib/config";

export default function CrmLayout({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <Shell connected={isConnected(integration)}>{children}</Shell>
    </ToastProvider>
  );
}
