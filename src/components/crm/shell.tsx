"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { PanelLeft, Search, Bell, Plus, Menu, LogOut } from "lucide-react";
import { crmNav } from "@/lib/crm/nav";
import { ThemeToggle } from "@/components/crm/theme-toggle";
import { CommandPalette } from "@/components/crm/command-palette";
import { BottomNav } from "@/components/crm/bottom-nav";
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
          {collapsed ? (
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-electric text-sm font-bold text-white">S</span>
          ) : (
            <p className="text-[15px] font-semibold tracking-tight">
              Sajt<span className="text-electric">press</span>
              <span className="ml-1 text-muted-foreground">CRM</span>
            </p>
          )}
        </div>

        <nav className="flex-1 overflow-y-auto px-2 py-3">
          <SidebarNav collapsed={collapsed} pathname={pathname} />
        </nav>

        <div className="border-t border-border p-2">
          <button
            onClick={toggle}
            className={cn(
              "flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-2xs text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground",
              collapsed && "justify-center"
            )}
            title={connected ? "Connected to Sajtpress" : "Standalone"}
          >
            <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", connected ? "bg-emerald" : "bg-warning")} />
            {!collapsed && <span className="flex-1 text-left">{connected ? "Connected" : "Standalone"}</span>}
            <PanelLeft size={14} className={cn("transition-transform", collapsed && "rotate-180")} />
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur">
          {/* Mobile brand (the sidebar carries it on desktop) */}
          <Link href="/" className="text-[15px] font-semibold tracking-tight md:hidden">
            Sajt<span className="text-electric">press</span>
            <span className="ml-1 text-muted-foreground">CRM</span>
          </Link>
          {/* Desktop search field */}
          <button
            onClick={() => setCmdOpen(true)}
            className="hidden h-9 max-w-md flex-1 items-center gap-2 rounded-lg border border-border bg-card px-3 text-sm text-muted-foreground transition-colors hover:border-electric/40 md:flex"
            title="Search — ⌘K"
          >
            <Search size={15} />
            <span className="flex-1 text-left">Search or jump to…</span>
            <kbd className="hidden rounded border border-border bg-secondary px-1.5 py-0.5 text-2xs sm:inline">⌘K</kbd>
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
            <Link
              href="/companies"
              className="hidden h-8 w-8 place-items-center rounded-lg bg-electric text-white transition-colors hover:bg-electric/90 md:grid"
              title="New company"
            >
              <Plus size={16} />
            </Link>
            <button disabled className="grid h-8 w-8 cursor-not-allowed place-items-center rounded-lg text-muted-foreground/40" title="Notifications — coming soon" aria-label="Notifications (coming soon)">
              <Bell size={16} />
            </button>
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
          <p className="text-[15px] font-semibold tracking-tight">
            Sajt<span className="text-electric">press</span>
            <span className="ml-1 text-muted-foreground">CRM</span>
          </p>
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

function SidebarNav({ collapsed, pathname, onNavigate }: { collapsed: boolean; pathname: string; onNavigate?: () => void }) {
  return (
    <div className="space-y-3">
      {crmNav.map((group, gi) => (
        <div key={group.title ?? gi} className="space-y-0.5">
          {group.title && !collapsed && (
            <p className="px-2 pb-1 pt-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
              {group.title}
            </p>
          )}
          {group.title && collapsed && gi > 0 && <div className="mx-2 my-1.5 border-t border-border/70" />}
          {group.items.map((item) => {
            const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
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
              <Link key={item.href} href={item.href} onClick={onNavigate} className={cls} title={collapsed ? item.label : undefined}>
                {inner}
              </Link>
            );
          })}
        </div>
      ))}
    </div>
  );
}
