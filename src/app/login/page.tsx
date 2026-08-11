import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { countUsers } from "@/lib/db";
import { AuthShell } from "@/components/crm/auth-shell";
import { LoginForm } from "./login-form";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  if (await getSession().catch(() => null)) redirect("/");
  // No accounts yet -> first-run setup.
  if ((await countUsers().catch(() => 1)) === 0) redirect("/setup");
  return (
    <AuthShell title="Sign in" subtitle="Welcome back to your workspace.">
      <LoginForm />
    </AuthShell>
  );
}
