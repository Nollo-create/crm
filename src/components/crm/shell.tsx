"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { crmNav } from "@/lib/crm/nav";
import { cn } from "@/lib/utils";

export function Shell({ connected, children }: { connected: boolean; children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-60 shrink-0 flex-col border-r border-border bg-card/40 p-3 md:flex">
        <div className="px-2 py-3">
          <p className="text-lg font-semibold">
            Sajt<span className="text-electric">press</span> CRM
          </p>
          <p className="text-[11px] text-muted-foreground">B2B Sales OS</p>
        </div>
        <nav className="mt-2 flex-1 space-y-0.5 overflow-y-auto">
          {crmNav.map((item) => {
            const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            const Icon = item.icon;
            const cls = cn(
              "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm",
              active
                ? "bg-secondary font-medium text-foreground"
                : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground",
              item.soon && "cursor-default opacity-60 hover:bg-transparent hover:text-muted-foreground"
            );
            const inner = (
              <>
                <Icon size={16} className="shrink-0" />
                <span className="flex-1">{item.label}</span>
                {item.soon && (
                  <span className="rounded bg-secondary px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">
                    soon
                  </span>
                )}
              </>
            );
            return item.soon ? (
              <span key={item.href} className={cls} title="Coming in a later stage">
                {inner}
              </span>
            ) : (
              <Link key={item.href} href={item.href} className={cls}>
                {inner}
              </Link>
            );
          })}
        </nav>
        <div className="mt-2 border-t border-border px-2 py-2 text-[11px] text-muted-foreground">
          <span className={cn("mr-1.5 inline-block h-1.5 w-1.5 rounded-full", connected ? "bg-emerald" : "bg-warning")} />
          {connected ? "Connected to Sajtpress" : "Standalone"}
        </div>
      </aside>
      <main className="min-w-0 flex-1">
        <div className="mx-auto max-w-6xl p-4 sm:p-6">{children}</div>
      </main>
    </div>
  );
}
