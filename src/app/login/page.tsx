import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { Users, ListChecks, Workflow } from "lucide-react";
import { getSession } from "@/lib/auth/session";
import { countUsers } from "@/lib/db";
import { integration, isConnected } from "@/lib/config";
import { MFA_COOKIE } from "@/lib/auth/constants";
import { BrandMark } from "@/components/crm/logo";
import { AuthVisual } from "@/components/crm/auth-visual";
import { LoginForm } from "./login-form";

export const dynamic = "force-dynamic";

const ERRORS: Record<string, string> = {
  sso: "Sajtpress sign-in failed. Please try again.",
  no_account: "No CRM account for that Sajtpress user — ask an admin to invite you first.",
};

const FEATURES = [
  { icon: Users, label: "Client & sales management" },
  { icon: ListChecks, label: "Projects & task tracking" },
  { icon: Workflow, label: "Automated workflows & insights" },
];

function Wordmark() {
  return (
    <span className="select-none text-[15px] font-bold leading-none tracking-tight text-white">
      SAJT<span className="bg-gradient-to-r from-electric to-royal bg-clip-text text-transparent">PRESS</span>
      <span className="ml-1.5 align-[1px] text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400">CRM</span>
    </span>
  );
}

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  if (await getSession().catch(() => null)) redirect("/");
  if ((await countUsers().catch(() => 1)) === 0) redirect("/setup");

  const { error } = await searchParams;
  const message = error ? ERRORS[error] ?? "Something went wrong." : "";
  const sso = isConnected(integration);
  const startMfa = !!(await cookies()).get(MFA_COOKIE)?.value;
  const year = new Date().getFullYear();

  return (
    <div className="relative flex min-h-screen bg-[#090b15] text-white">
      {/* ---- Left hero (desktop) ---- */}
      <section className="relative hidden overflow-hidden lg:flex lg:w-[54%] xl:w-[57%]">
        <AuthVisual />
        <div className="relative z-10 flex w-full flex-col justify-between p-10 xl:p-14">
          <div className="auth-fade-up flex items-center gap-2.5">
            <BrandMark className="h-9 w-9" />
            <Wordmark />
          </div>

          <div className="max-w-lg">
            <h1 className="auth-fade-up text-[2.6rem] font-bold leading-[1.08] tracking-tight xl:text-5xl" style={{ animationDelay: ".05s" }}>
              Everything your business needs.{" "}
              <span className="bg-gradient-to-r from-electric via-[#93a7ff] to-royal bg-clip-text text-transparent">In one place.</span>
            </h1>
            <p className="auth-fade-up mt-5 max-w-md text-[15px] leading-relaxed text-slate-300" style={{ animationDelay: ".12s" }}>
              Manage clients, projects, tasks, sales, and team workflows from one intelligent workspace.
            </p>
            <ul className="mt-9 space-y-3.5">
              {FEATURES.map((f, i) => (
                <li key={f.label} className="auth-fade-up flex items-center gap-3" style={{ animationDelay: `${0.2 + i * 0.07}s` }}>
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-white/10 bg-white/[0.06] text-electric">
                    <f.icon size={16} />
                  </span>
                  <span className="text-sm text-slate-200">{f.label}</span>
                </li>
              ))}
            </ul>
          </div>

          <p className="auth-fade-up text-xs text-slate-500" style={{ animationDelay: ".4s" }}>© {year} Sajtpress · crm.sajtpress.rs</p>
        </div>
      </section>

      {/* ---- Right: focused login card ---- */}
      <section className="relative flex flex-1 items-center justify-center overflow-hidden p-5 sm:p-8">
        {/* subtle ambient (stronger on mobile where the hero is hidden) */}
        <div className="pointer-events-none absolute -right-16 -top-16 h-72 w-72 rounded-full bg-[rgba(124,92,255,0.20)] blur-[90px] lg:opacity-40" />
        <div className="pointer-events-none absolute -bottom-20 -left-10 h-64 w-64 rounded-full bg-[rgba(79,140,255,0.16)] blur-[90px] lg:hidden" />

        <div className="auth-fade-up relative z-10 w-full max-w-sm">
          {/* Mobile brand */}
          <div className="mb-8 flex items-center justify-center gap-2.5 lg:hidden">
            <BrandMark className="h-9 w-9" />
            <Wordmark />
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.045] p-6 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.9)] backdrop-blur-xl sm:p-7">
            <h2 className="text-xl font-semibold tracking-tight">Welcome back</h2>
            <p className="mt-1 text-sm text-slate-400">Sign in to continue to your CRM workspace.</p>

            {message && (
              <p className="mt-4 rounded-lg border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-[#ffa3b6]">{message}</p>
            )}

            <div className="mt-5">
              <LoginForm startMfa={startMfa} />
            </div>

            {sso && (
              <>
                <div className="my-4 flex items-center gap-3 text-[11px] uppercase tracking-wider text-slate-500">
                  <span className="h-px flex-1 bg-white/10" /> or <span className="h-px flex-1 bg-white/10" />
                </div>
                <a
                  href="/sso/start"
                  className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-white/12 bg-white/[0.03] text-sm font-medium text-slate-200 transition-colors hover:bg-white/[0.08]"
                >
                  Continue with Sajtpress
                </a>
              </>
            )}

            <p className="mt-6 text-center text-xs text-slate-500">Need access? Contact your system administrator.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
