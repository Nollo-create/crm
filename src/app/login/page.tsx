import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { countUsers } from "@/lib/db";
import { integration, isConnected } from "@/lib/config";
import { AuthShell } from "@/components/crm/auth-shell";
import { LoginForm } from "./login-form";

export const dynamic = "force-dynamic";

const ERRORS: Record<string, string> = {
  sso: "Sajtpress sign-in failed. Please try again.",
  no_account: "No CRM account for that Sajtpress user — ask an admin to invite you first.",
};

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  if (await getSession().catch(() => null)) redirect("/");
  // No accounts yet -> first-run setup.
  if ((await countUsers().catch(() => 1)) === 0) redirect("/setup");

  const { error } = await searchParams;
  const message = error ? ERRORS[error] ?? "Something went wrong." : "";
  const sso = isConnected(integration);

  return (
    <AuthShell title="Sign in" subtitle="Welcome back to your workspace.">
      {message && <p className="mb-3 rounded-lg border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger">{message}</p>}
      <LoginForm />
      {sso && (
        <>
          <div className="my-3 flex items-center gap-2 text-2xs text-muted-foreground">
            <span className="h-px flex-1 bg-border" /> or <span className="h-px flex-1 bg-border" />
          </div>
          <a
            href="/sso/start"
            className="flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-border text-sm font-medium transition-colors hover:bg-secondary"
          >
            Continue with Sajtpress
          </a>
        </>
      )}
    </AuthShell>
  );
}
