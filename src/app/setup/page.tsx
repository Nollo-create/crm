import { redirect } from "next/navigation";
import { countUsers } from "@/lib/db";
import { AuthShell } from "@/components/crm/auth-shell";
import { SetupForm } from "./setup-form";

export const dynamic = "force-dynamic";

export default async function SetupPage() {
  // First-run only: once an owner exists, setup is closed.
  if ((await countUsers().catch(() => 0)) > 0) redirect("/login");
  return (
    <AuthShell title="Create your workspace" subtitle="Set up the first owner account.">
      <SetupForm />
    </AuthShell>
  );
}
