"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bell, Handshake, FileText, Target, Building2, Loader2, RefreshCw } from "lucide-react";
import { notificationsAction, type Notification, type NotificationKind } from "@/lib/actions/notifications";
import { cn } from "@/lib/utils";

const KIND_ICON: Record<NotificationKind, typeof Bell> = { deal: Handshake, quote: FileText, lead: Target, account: Building2 };
const KIND_TONE: Record<NotificationKind, string> = {
  deal: "bg-danger/15 text-danger",
  quote: "bg-warning/15 text-warning",
  lead: "bg-emerald/15 text-emerald",
  account: "bg-royal/15 text-royal",
};

export function NotificationsBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Notification[]>([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const r = await notificationsAction();
      setItems(r.items);
      setCount(r.count);
    } catch {
      setItems([]);
      setCount(0);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    void load();
  }, []);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative grid h-8 w-8 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        title="Notifications"
        aria-label={`Notifications${count ? ` (${count})` : ""}`}
      >
        <Bell size={16} />
        {count > 0 && (
          <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-[16px] place-items-center rounded-full bg-danger px-1 text-[9px] font-bold text-white ring-2 ring-background">
            {count > 9 ? "9+" : count}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-50 mt-1.5 w-80 overflow-hidden rounded-lg border border-border bg-popover shadow-pop">
            <div className="flex items-center justify-between border-b border-border px-3 py-2">
              <p className="text-sm font-semibold">Needs attention</p>
              <button onClick={load} className="text-muted-foreground hover:text-foreground" title="Refresh" aria-label="Refresh">
                {loading ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
              </button>
            </div>

            <div className="max-h-[22rem] overflow-y-auto p-1.5">
              {loading && items.length === 0 ? (
                <div className="space-y-1 p-1">
                  {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-11 animate-pulse rounded-lg bg-secondary/60" />)}
                </div>
              ) : items.length === 0 ? (
                <p className="px-2 py-8 text-center text-sm text-muted-foreground">You&apos;re all caught up. 🎉</p>
              ) : (
                items.map((n) => {
                  const Icon = KIND_ICON[n.kind];
                  return (
                    <Link
                      key={n.id}
                      href={n.href}
                      onClick={() => setOpen(false)}
                      className="flex items-start gap-2.5 rounded-lg px-2 py-2 transition-colors hover:bg-secondary"
                    >
                      <span className={cn("mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full", KIND_TONE[n.kind])}>
                        <Icon size={14} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-foreground">{n.title}</span>
                        <span className="block truncate text-2xs text-muted-foreground">{n.sub}</span>
                      </span>
                    </Link>
                  );
                })
              )}
            </div>

            <div className="border-t border-border px-3 py-1.5">
              <Link href="/ai/next-action" onClick={() => setOpen(false)} className="block text-center text-2xs text-electric hover:underline">
                Open Next Best Action
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
