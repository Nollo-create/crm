import { Logo } from "@/components/crm/logo";

export function AuthShell({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen place-items-center bg-background p-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <div className="flex justify-center">
            <Logo markClassName="h-9 w-9" wordClassName="text-lg" />
          </div>
          <h1 className="mt-5 text-xl font-semibold tracking-tight">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
        </div>
        <div className="surface p-5">{children}</div>
      </div>
    </div>
  );
}
