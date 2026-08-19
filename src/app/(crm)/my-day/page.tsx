"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Sun, Handshake, Building2, FileText, Target, CheckCircle2, Circle, ArrowRight, Loader2, CalendarClock } from "lucide-react";
import { nextBestActionsAction, type NbaItem } from "@/lib/actions/ai";
import { tasksPageAction, toggleTaskDoneAction, type Task } from "@/lib/actions/tasks";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useCanWrite } from "@/components/crm/role-context";
import { cn } from "@/lib/utils";

const KIND: Record<NbaItem["kind"], { icon: typeof Handshake; ring: string }> = {
  deal: { icon: Handshake, ring: "bg-electric/12 text-electric" },
  account: { icon: Building2, ring: "bg-royal/12 text-royal" },
  quote: { icon: FileText, ring: "bg-warning/12 text-warning" },
  lead: { icon: Target, ring: "bg-emerald/12 text-emerald" },
};

function greeting(): string {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
}

export default function MyDayPage() {
  const canWrite = useCanWrite();
  const [actions, setActions] = useState<NbaItem[] | null>(null);
  const [tasks, setTasks] = useState<Task[] | null>(null);

  useEffect(() => {
    nextBestActionsAction().then(setActions).catch(() => setActions([]));
    tasksPageAction({ done: false, sortKey: "due", sortDir: 1, page: 1, pageSize: 8 })
      .then((r) => setTasks(r.rows))
      .catch(() => setTasks([]));
  }, []);

  async function complete(id: number) {
    setTasks((t) => (t ? t.filter((x) => x.id !== id) : t)); // optimistic
    await toggleTaskDoneAction(id, true).catch(() => {});
  }

  const today = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
  const overdue = (due: string | null) => !!due && due < new Date().toISOString().slice(0, 10);

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div>
        <h1 className="flex items-center gap-2 text-xl font-semibold tracking-tight"><Sun size={18} className="text-warning" /> {greeting()}</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">{today} — here&apos;s what needs your attention.</p>
      </div>

      {/* Chase today */}
      <div>
        <p className="mb-2 flex items-center gap-2 text-sm font-semibold">Chase today {actions && actions.length > 0 && <Badge tone="neutral">{actions.length}</Badge>}</p>
        {actions === null ? (
          <div className="space-y-2">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
        ) : actions.length === 0 ? (
          <Card className="flex items-center gap-2 p-4 text-sm text-muted-foreground"><CheckCircle2 size={16} className="text-emerald" /> Nothing urgent right now. Nice — you&apos;re on top of it.</Card>
        ) : (
          <div className="space-y-2">
            {actions.map((a, i) => {
              const k = KIND[a.kind];
              const Icon = k.icon;
              return (
                <Link key={`${a.kind}-${i}`} href={a.href} className="group flex items-center gap-3 rounded-xl border border-border bg-card p-3 transition-colors hover:border-electric/40">
                  <span className={cn("grid h-9 w-9 shrink-0 place-items-center rounded-full", k.ring)}><Icon size={16} /></span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{a.title}</span>
                    <span className="block truncate text-2xs text-muted-foreground">{a.subtitle}</span>
                  </span>
                  <ArrowRight size={15} className="shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-electric" />
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Open tasks */}
      <div>
        <p className="mb-2 flex items-center gap-2 text-sm font-semibold"><CalendarClock size={15} className="text-muted-foreground" /> Your open tasks</p>
        {tasks === null ? (
          <div className="space-y-2">{[0, 1].map((i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
        ) : tasks.length === 0 ? (
          <Card className="p-4 text-sm text-muted-foreground">No open tasks. <Link href="/tasks" className="text-electric hover:underline">Add one →</Link></Card>
        ) : (
          <div className="space-y-2">
            {tasks.map((t) => (
              <Card key={t.id} className="flex items-center gap-3 p-3">
                <button
                  onClick={() => canWrite && complete(t.id)}
                  disabled={!canWrite}
                  title={canWrite ? "Mark done" : undefined}
                  className={cn("shrink-0 text-muted-foreground transition-colors", canWrite && "hover:text-emerald")}
                >
                  <Circle size={17} />
                </button>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{t.title}</p>
                  <p className="flex items-center gap-2 text-2xs text-muted-foreground">
                    {t.companyName && (t.companyId ? <Link href={`/companies/${t.companyId}`} className="text-electric hover:underline">{t.companyName}</Link> : <span>{t.companyName}</span>)}
                    {t.dueDate && <span className={cn(overdue(t.dueDate) && "font-medium text-danger")}>{overdue(t.dueDate) ? "overdue · " : "due "}{t.dueDate}</span>}
                  </p>
                </div>
                {t.priority === "high" && <Badge tone="danger">High</Badge>}
              </Card>
            ))}
            <Link href="/tasks" className="inline-flex items-center gap-1 text-2xs font-medium text-electric hover:underline">All tasks <ArrowRight size={12} /></Link>
          </div>
        )}
      </div>
    </div>
  );
}
