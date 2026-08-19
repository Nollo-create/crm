"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bell, MailOpen, CornerDownLeft, Trophy, Loader2, Compass } from "lucide-react";
import { unreadNotificationsAction, notificationFeedAction, markNotificationsSeenAction, type EventNotification } from "@/lib/actions/notifications";
import { timeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";

const ICON: Record<string, { icon: typeof Bell; tone: string }> = {
  email_open: { icon: MailOpen, tone: "bg-electric/15 text-electric" },
  reply: { icon: CornerDownLeft, tone: "bg-emerald/15 text-emerald" },
  deal_won: { icon: Trophy, tone: "bg-warning/15 text-warning" },
};
const iconFor = (t: string) => ICON[t] ?? { icon: Bell, tone: "bg-secondary text-muted-foreground" };

export function NotificationsBell() {
  const [open, setOpen] = useState(false);
  const [count, setCount] = useState(0);
  const [items, setItems] = useState<EventNotification[]>([]);
  const [attention, setAttention] = useState(0);
  const [loading, setLoading] = useState(false);

  // Poll the unread badge.
  useEffect(() => {
    let alive = true;
    const tick = () => unreadNotificationsAction().then((n) => alive && setCount(n)).catch(() => {});
    tick();
    const t = setInterval(tick, 60_000);
    return () => { alive = false; clearInterval(t); };
  }, []);

  async function openPanel() {
    setOpen(true);
    setLoading(true);
    try {
      const r = await notificationFeedAction();
      setItems(r.items);
      setAttention(r.attention);
      await markNotificationsSeenAction();
      setCount(0); // seen → badge clears
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => (open ? setOpen(false) : openPanel())}
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
              <p className="text-sm font-semibold">Notifications</p>
              {loading && <Loader2 size={13} className="animate-spin text-muted-foreground" />}
            </div>

            <div className="max-h-[22rem] overflow-y-auto p-1.5">
              {!loading && items.length === 0 ? (
                <p className="px-3 py-8 text-center text-2xs text-muted-foreground">Nothing yet. Opens, replies and wins will show up here.</p>
              ) : (
                items.map((n) => {
                  const k = iconFor(n.type);
                  const Icon = k.icon;
                  return (
                    <Link
                      key={n.id}
                      href={n.href || "#"}
                      onClick={() => setOpen(false)}
                      className={cn("flex items-start gap-2.5 rounded-lg px-2 py-2 transition-colors hover:bg-secondary", n.unread && "bg-electric/[0.04]")}
                    >
                      <span className={cn("mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full", k.tone)}><Icon size={14} /></span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-2xs leading-snug">{n.title}</span>
                        <span className="block text-[10px] text-muted-foreground">{timeAgo(n.createdAt)}</span>
                      </span>
                      {n.unread && <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-electric" />}
                    </Link>
                  );
                })
              )}
            </div>

            {attention > 0 && (
              <Link href="/my-day" onClick={() => setOpen(false)} className="flex items-center gap-2 border-t border-border px-3 py-2 text-2xs font-medium text-electric hover:bg-secondary">
                <Compass size={13} /> {attention} thing{attention === 1 ? "" : "s"} need attention today — My Day
              </Link>
            )}
          </div>
        </>
      )}
    </div>
  );
}
