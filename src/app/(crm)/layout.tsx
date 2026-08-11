import { Shell } from "@/components/crm/shell";
import { ToastProvider } from "@/components/ui/toast";
import { requireSession } from "@/lib/auth/session";
import { integration, isConnected } from "@/lib/config";

export const dynamic = "force-dynamic";

export default async function CrmLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSession(); // redirects to /login when not signed in
  return (
    <ToastProvider>
      <Shell connected={isConnected(integration)} user={{ name: session.name, email: session.email, role: session.role }}>
        {children}
      </Shell>
    </ToastProvider>
  );
}
