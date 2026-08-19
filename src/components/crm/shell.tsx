"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { PanelLeft, Search, Plus, LogOut, Building2, Users, Target, Handshake, CheckSquare, Settings, CreditCard, KeyRound } from "lucide-react";
import { crmNav } from "@/lib/crm/nav";
import { ThemeToggle } from "@/components/crm/theme-toggle";
import { CommandPalette } from "@/components/crm/command-palette";
import { NotificationsBell } from "@/components/crm/notifications-bell";
import { BottomNav } from "@/components/crm/bottom-nav";
import { Logo, BrandMark } from "@/components/crm/logo";

const CREATE_ITEMS = [
  { label: "New company", href: "/companies?new=1", icon: Building2 },
  { label: "New contact", href: "/contacts?new=1", icon: Users },
  { label: "New lead", href: "/leads?new=1", icon: Target },
  { label: "New deal", href: "/deals?new=1", icon: Handshake },
  { label: "New task", href: "/tasks?new=1", icon: CheckSquare },
];
import { Drawer, DrawerHeader, DrawerBody } from "@/components/ui/drawer";
import { logoutAction } from "@/lib/actions/auth";
import { cn } from "@/lib/utils";

export interface ShellUser {
  name: string;
  email: string;
  role: string;
}

export function Shell({ connected, user, children }: { connected: boolean; user: ShellUser; children: React.ReactNode }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [cmdOpen, setCmdOpen] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);
  const [userMenu, setUserMenu] = useState(false);
  const [createMenu, setCreateMenu] = useState(false);
  const initial = (user.name || user.email || "?").slice(0, 1).toUpperCase();

  useEffect(() => {
    setCollapsed(localStorage.getItem("crm-sidebar") === "1");
    setMounted(true);
  }, []);
  useEffect(() => {
    setMobileNav(false); // close the mobile drawer whenever the route changes
  }, [pathname]);
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCmdOpen((o) => !o);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  function toggle() {
    setCollapsed((v) => {
      const next = !v;
      localStorage.setItem("crm-sidebar", next ? "1" : "0");
      return next;
    });
  }

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside
        className={cn(
          "sticky top-0 hidden h-screen shrink-0 flex-col border-r border-border bg-card/50 md:flex",
          mounted && collapsed ? "w-[60px]" : "w-[232px]"
        )}
      >
        <div className={cn("flex h-14 items-center border-b border-border", collapsed ? "justify-center" : "px-4")}>
          {collapsed ? <BrandMark /> : <Logo />}
        </div>

        <nav className="flex-1 overflow-y-auto px-2 py-3">
          <SidebarNav collapsed={collapsed} pathname={pathname} />
        </nav>

        <div className="border-t border-border p-2">
          {collapsed ? (
            <div className="flex flex-col items-center gap-1">
              <Link
                href="/settings/org"
                className="relative grid h-8 w-8 place-items-center rounded-full bg-royal/15 text-2xs font-semibold text-royal"
                title={`${user.name || user.email} — account & settings`}
              >
                {initial}
                <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full bg-emerald ring-2 ring-card" />
              </Link>
              <button
                onClick={toggle}
                className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                title="Expand sidebar"
                aria-label="Expand sidebar"
              >
                <PanelLeft size={15} className="rotate-180" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1">
              <Link
                href="/settings/org"
                className="flex min-w-0 flex-1 items-center gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-secondary"
                title="Account & settings"
              >
                <span className="relative grid h-7 w-7 shrink-0 place-items-center rounded-full bg-royal/15 text-2xs font-semibold text-royal">
                  {initial}
                  <span
                    className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald ring-2 ring-card"
                    title="Online"
                  />
                </span>
                <span className="min-w-0 leading-tight">
                  <span className="block truncate text-sm font-medium">{user.name || "Account"}</span>
                  <span className="block truncate text-2xs capitalize text-muted-foreground">{user.role}</span>
                </span>
              </Link>
              <button
                onClick={toggle}
                className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                title="Collapse sidebar"
                aria-label="Collapse sidebar"
              >
                <PanelLeft size={15} />
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur">
          {/* Mobile brand (the sidebar carries it on desktop) */}
          <Link href="/" className="md:hidden">
            <Logo />
          </Link>
          {/* Desktop search field */}
          <button
            onClick={() => setCmdOpen(true)}
            className="hidden h-9 max-w-md flex-1 items-center gap-2 rounded-lg border border-border bg-card px-3 text-sm text-muted-foreground transition-colors hover:border-electric/40 md:flex"
            title="Search — ⌘K"
          >
            <Search size={15} />
            <span className="flex-1 text-left">Search or jump to…</span>
            <kbd className="hidden items-center rounded-md border border-border bg-secondary px-2 py-1 text-[13px] font-semibold leading-none text-foreground/70 sm:inline-flex">⌘K</kbd>
          </button>
          <div className="flex-1 md:hidden" />
          {/* Mobile search icon */}
          <button
            onClick={() => setCmdOpen(true)}
            className="grid h-9 w-9 place-items-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground md:hidden"
            title="Search"
            aria-label="Search"
          >
            <Search size={18} />
          </button>
          <div className="flex items-center gap-1">
            {/* Quick create */}
            <div className="relative">
              <button
                onClick={() => setCreateMenu((v) => !v)}
                className="grid h-8 w-8 place-items-center rounded-lg bg-electric text-white transition-colors hover:bg-electric/90"
                title="Create new"
                aria-label="Create new"
              >
                <Plus size={16} />
              </button>
              {createMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setCreateMenu(false)} />
                  <div className="absolute right-0 z-50 mt-1.5 w-48 rounded-lg border border-border bg-popover p-1 shadow-pop">
                    <p className="px-2 pb-1 pt-1.5 text-2xs font-semibold uppercase tracking-wide text-muted-foreground/60">Create</p>
                    {CREATE_ITEMS.map((c) => (
                      <Link
                        key={c.href}
                        href={c.href}
                        onClick={() => setCreateMenu(false)}
                        className="flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                      >
                        <c.icon size={15} className="shrink-0 text-muted-foreground" /> {c.label}
                      </Link>
                    ))}
                  </div>
                </>
              )}
            </div>
            <NotificationsBell />
            <ThemeToggle />
            <div className="relative ml-1">
              <button
                onClick={() => setUserMenu((v) => !v)}
                className="grid h-8 w-8 place-items-center rounded-full bg-royal/15 text-xs font-semibold text-royal"
                title={user.email}
                aria-label="Account menu"
              >
                {initial}
              </button>
              {userMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setUserMenu(false)} />
                  <div className="absolute right-0 z-50 mt-1.5 w-56 rounded-lg border border-border bg-popover p-1 shadow-pop">
                    <div className="px-2 py-1.5">
                      <p className="truncate text-sm font-medium">{user.name || "Account"}</p>
                      <p className="truncate text-2xs text-muted-foreground">{user.email}</p>
                      <span className="mt-1.5 inline-block rounded bg-secondary px-1.5 py-0.5 text-2xs capitalize text-muted-foreground">{user.role}</span>
                    </div>
                    <div className="my-1 border-t border-border" />
                    {[
                      { label: "Settings", href: "/settings/org", icon: Settings },
                      { label: "Billing", href: "/settings/billing", icon: CreditCard },
                      { label: "API keys", href: "/settings/api", icon: KeyRound },
                    ].map((m) => (
                      <Link
                        key={m.href}
                        href={m.href}
                        onClick={() => setUserMenu(false)}
                        className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                      >
                        <m.icon size={14} /> {m.label}
                      </Link>
                    ))}
                    <div className="my-1 border-t border-border" />
                    <form action={logoutAction}>
                      <button
                        type="submit"
                        className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                      >
                        <LogOut size={14} /> Sign out
                      </button>
                    </form>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1">
          <div className="mx-auto max-w-7xl p-4 pb-24 sm:p-6 md:pb-8">{children}</div>
        </main>
      </div>

      {/* Mobile: bottom tab bar + full-menu drawer */}
      <BottomNav onMore={() => setMobileNav(true)} />
      <Drawer open={mobileNav} onClose={() => setMobileNav(false)} side="left" width="xs">
        <DrawerHeader onClose={() => setMobileNav(false)}>
          <Logo />
        </DrawerHeader>
        <DrawerBody className="flex flex-col p-2">
          <SidebarNav collapsed={false} pathname={pathname} onNavigate={() => setMobileNav(false)} />
          <div className="mt-auto border-t border-border pt-2">
            <p className="truncate px-2 text-sm font-medium">{user.name || "Account"}</p>
            <p className="truncate px-2 text-2xs text-muted-foreground">{user.email}</p>
            <form action={logoutAction}>
              <button
                type="submit"
                className="mt-1.5 flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              >
                <LogOut size={16} /> Sign out
              </button>
            </form>
          </div>
        </DrawerBody>
      </Drawer>

      <CommandPalette open={cmdOpen} onClose={() => setCmdOpen(false)} />
    </div>
  );
}

/** The active nav item is the one whose href is the *longest* prefix of the
 *  current path (with a "/" boundary so "/settings/email" doesn't match
 *  "/settings/email-templates"). Longest-match also stops a parent like
 *  "/emails" lighting up on "/emails/bulk". */
function resolveActiveHref(pathname: string): string | null {
  let best: string | null = null;
  for (const group of crmNav) {
    for (const item of group.items) {
      if (item.soon) continue;
      const href = item.href;
      const matches = href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(href + "/");
      if (matches && (best === null || href.length > best.length)) best = href;
    }
  }
  return best;
}

function SidebarNav({ collapsed, pathname, onNavigate }: { collapsed: boolean; pathname: string; onNavigate?: () => void }) {
  const activeHref = resolveActiveHref(pathname);
  const activeRef = useRef<HTMLAnchorElement | null>(null);
  // Keep the highlighted item in view (and the scrollbar tracking it) whenever
  // the active route changes — so a deep item like Account Security isn't left
  // off-screen after navigating.
  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: "nearest" });
  }, [activeHref]);
  return (
    <div className="space-y-3">
      {crmNav.map((group, gi) => (
        <div key={group.title ?? gi} className="space-y-0.5">
          {group.title && !collapsed && (
            <div className="flex items-center gap-2 px-2 pb-1.5 pt-3">
              <span className="h-3 w-[3px] shrink-0 rounded-full bg-gradient-to-b from-electric to-royal" />
              <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-foreground/70">{group.title}</span>
              <span className="h-px flex-1 bg-gradient-to-r from-border to-transparent" />
            </div>
          )}
          {group.title && collapsed && gi > 0 && <div className="mx-auto my-2 h-px w-6 bg-gradient-to-r from-transparent via-electric/40 to-transparent" />}
          {group.items.map((item) => {
            const active = item.href === activeHref;
            const Icon = item.icon;
            const cls = cn(
              "group flex items-center rounded-lg text-sm transition-colors",
              collapsed ? "h-9 w-9 justify-center" : "gap-2.5 px-2.5 py-1.5",
              active
                ? "bg-electric/10 font-medium text-electric"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground",
              item.soon && "cursor-default opacity-55 hover:bg-transparent hover:text-muted-foreground"
            );
            const inner = (
              <>
                <Icon size={16} className="shrink-0" />
                {!collapsed && <span className="flex-1 truncate">{item.label}</span>}
                {!collapsed && item.soon && <span className="soon-badge">soon</span>}
              </>
            );
            return item.soon ? (
              <span key={item.href} className={cls} title={collapsed ? `${item.label} — soon` : "Coming in a later phase"}>
                {inner}
              </span>
            ) : (
              <Link key={item.href} ref={active ? activeRef : null} href={item.href} onClick={onNavigate} className={cls} title={collapsed ? item.label : undefined}>
                {inner}
              </Link>
            );
          })}
        </div>
      ))}
    </div>
  );
}
