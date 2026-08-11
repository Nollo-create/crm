import { requireSession } from "@/lib/auth/session";
import { can } from "@/lib/auth/rbac";
import { AuditViewer } from "./audit-viewer";

export const dynamic = "force-dynamic";

export default async function SecurityPage() {
  const session = await requireSession();
  if (!can(session.role, "member:manage")) {
    return (
      <div className="mx-auto max-w-md py-16 text-center">
        <p className="text-sm text-muted-foreground">You don&apos;t have access to the audit log.</p>
      </div>
    );
  }
  return <AuditViewer />;
}
