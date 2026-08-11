"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Building2, GitBranch, Menu } from "lucide-react";
import { cn } from "@/lib/utils";

const TABS = [
  { label: "Home", href: "/", icon: LayoutDashboard, match: (p: string) => p === "/" },
  { label: "Companies", href: "/companies", icon: Building2, match: (p: string) => p.startsWith("/companies") },
  { label: "Pipeline", href: "/pipeline", icon: GitBranch, match: (p: string) => p.startsWith("/pipeline") },
];

/** iOS/Android-style bottom tab bar — the primary navigation on phones. Sits
 *  above the home indicator (safe-area aware); "More" opens the full menu. */
export function BottomNav({ onMore }: { onMore: () => void }) {
  const pathname = usePathname();
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-30 flex items-stretch border-t border-border bg-background/90 backdrop-blur md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      {TABS.map((t) => {
        const active = t.match(pathname);
        const Icon = t.icon;
        return (
          <Link
            key={t.href}
            href={t.href}
            className={cn(
              "flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-medium transition-colors active:bg-secondary/60",
              active ? "text-electric" : "text-muted-foreground"
            )}
          >
            <Icon size={20} className="shrink-0" />
            <span>{t.label}</span>
          </Link>
        );
      })}
      <button
        onClick={onMore}
        className="flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-medium text-muted-foreground transition-colors active:bg-secondary/60"
      >
        <Menu size={20} className="shrink-0" />
        <span>More</span>
      </button>
    </nav>
  );
}
