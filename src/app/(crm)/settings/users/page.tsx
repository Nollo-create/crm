import { requireSession } from "@/lib/auth/session";
import { can } from "@/lib/auth/rbac";
import { UsersManager } from "./users-manager";

export const dynamic = "force-dynamic";

export default async function UsersPage() {
  const session = await requireSession();
  if (!can(session.role, "member:manage")) {
    return (
      <div className="mx-auto max-w-md py-16 text-center">
        <p className="text-sm text-muted-foreground">You don&apos;t have access to user management.</p>
      </div>
    );
  }
  return <UsersManager currentUserId={session.userId} currentRole={session.role} />;
}
