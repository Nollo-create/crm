"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Handshake, Building2, FileText, Target, ArrowRight, ListPlus, Check, Loader2 } from "lucide-react";
import { createTaskAction } from "@/lib/actions/tasks";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import type { NbaItem } from "@/lib/actions/ai";

const KIND: Record<string, { icon: typeof Handshake; style: string; priority: string }> = {
  deal: { icon: Handshake, style: "bg-warning/10 text-warning", priority: "high" },
  account: { icon: Building2, style: "bg-danger/10 text-danger", priority: "high" },
  quote: { icon: FileText, style: "bg-electric/10 text-electric", priority: "medium" },
  lead: { icon: Target, style: "bg-emerald/10 text-emerald", priority: "medium" },
};

const TABS = [
  { id: "all", label: "All" },
  { id: "deal", label: "Deals" },
  { id: "account", label: "Accounts" },
  { id: "quote", label: "Quotes" },
  { id: "lead", label: "Leads" },
] as const;

export function NbaList({ items }: { items: NbaItem[] }) {
  const { toast } = useToast();
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("all");
  const [logged, setLogged] = useState<Record<number, "busy" | "done">>({});

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: items.length, deal: 0, account: 0, quote: 0, lead: 0 };
    for (const it of items) c[it.kind]++;
    return c;
  }, [items]);

  const shown = useMemo(() => (tab === "all" ? items : items.filter((it) => it.kind === tab)), [items, tab]);

  async function logTask(idx: number, it: NbaItem) {
    if (logged[idx]) return;
    setLogged((p) => ({ ...p, [idx]: "busy" }));
    const r = await createTaskAction({ title: it.title, companyId: it.companyId ?? null, priority: KIND[it.kind]?.priority ?? "medium" }).catch(() => ({ error: "Failed" }));
    if ("error" in r && r.error) {
      toast(r.error, { tone: "error" });
      setLogged((p) => {
        const n = { ...p };
        delete n[idx];
        return n;
      });
      return;
    }
    setLogged((p) => ({ ...p, [idx]: "done" }));
    toast("Added to Tasks", { tone: "success" });
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-1">
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} disabled={t.id !== "all" && counts[t.id] === 0} className={cn("rounded-lg px-2.5 py-1 text-xs font-medium transition-colors disabled:opacity-40", tab === t.id ? "bg-secondary text-foreground" : "text-muted-foreground hover:bg-secondary/60")}>
            {t.label} <span className="text-2xs text-muted-foreground">{counts[t.id]}</span>
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {shown.map((it, i) => {
          const idx = items.indexOf(it);
          const k = KIND[it.kind] ?? KIND.lead;
          const Icon = k.icon;
          const state = logged[idx];
          return (
            <div key={i} className="group flex items-center gap-3 rounded-xl border border-border bg-card p-3 transition-colors hover:border-electric/40">
              <span className={cn("grid h-8 w-8 shrink-0 place-items-center rounded-full", k.style)}><Icon size={15} /></span>
              <Link href={it.href} className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{it.title}</p>
                <p className="truncate text-2xs text-muted-foreground">{it.subtitle}</p>
              </Link>
              <button
                onClick={() => logTask(idx, it)}
                disabled={!!state}
                title={state === "done" ? "Added to Tasks" : "Log as task"}
                className={cn("inline-flex shrink-0 items-center gap-1 rounded-lg px-2 py-1 text-2xs font-medium transition-colors", state === "done" ? "text-emerald" : "text-muted-foreground hover:bg-secondary hover:text-foreground")}
              >
                {state === "busy" ? <Loader2 size={13} className="animate-spin" /> : state === "done" ? <Check size={13} /> : <ListPlus size={13} />}
                <span className="hidden sm:inline">{state === "done" ? "Added" : "Task"}</span>
              </button>
              <Link href={it.href} className="shrink-0"><ArrowRight size={15} className="text-muted-foreground transition-transform group-hover:translate-x-0.5" /></Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}
