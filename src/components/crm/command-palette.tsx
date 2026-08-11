"use client";

import { useEffect, useMemo, useRef, useState, type ComponentType } from "react";
import { useRouter } from "next/navigation";
import { Search, Building2, Users, Target, Handshake, CheckSquare, Plus, CornerDownLeft, Loader2 } from "lucide-react";
import { searchCompaniesAction, type SearchHit } from "@/lib/actions/crm";
import { crmNav } from "@/lib/crm/nav";
import { cn } from "@/lib/utils";

type Icon = ComponentType<{ size?: number; className?: string }>;

interface FlatItem {
  key: string;
  group: string;
  label: string;
  sub?: string;
  icon: Icon;
  href: string;
}

// Every real module is jumpable (built from the one nav source of truth; `soon`
// items are skipped since they lead nowhere yet), plus quick-create shortcuts.
const NAV_COMMANDS: FlatItem[] = crmNav.flatMap((g) =>
  g.items
    .filter((it) => !it.soon)
    .map((it) => ({ key: `nav-${it.href}`, group: "Navigate", label: it.label, sub: g.title, icon: it.icon, href: it.href }))
);
const CREATE_COMMANDS: FlatItem[] = [
  { key: "new-company", group: "Create", label: "New company", icon: Building2, href: "/companies?new=1" },
  { key: "new-contact", group: "Create", label: "New contact", icon: Users, href: "/contacts?new=1" },
  { key: "new-lead", group: "Create", label: "New lead", icon: Target, href: "/leads?new=1" },
  { key: "new-deal", group: "Create", label: "New deal", icon: Handshake, href: "/deals?new=1" },
  { key: "new-task", group: "Create", label: "New task", icon: CheckSquare, href: "/tasks?new=1" },
];
const COMMANDS: FlatItem[] = [...NAV_COMMANDS, ...CREATE_COMMANDS];

export function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [searching, setSearching] = useState(false);
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setQ("");
      setHits([]);
      setActive(0);
      const t = setTimeout(() => inputRef.current?.focus(), 30);
      return () => clearTimeout(t);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const s = q.trim();
    if (!s) {
      setHits([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    const t = setTimeout(async () => {
      const r = await searchCompaniesAction(s).catch(() => []);
      setHits(r);
      setSearching(false);
    }, 180);
    return () => clearTimeout(t);
  }, [q, open]);

  const flat = useMemo<FlatItem[]>(() => {
    const s = q.trim().toLowerCase();
    const cmds = s ? COMMANDS.filter((c) => c.label.toLowerCase().includes(s)) : COMMANDS;
    const companyHits: FlatItem[] = hits.map((h) => ({
      key: `hit-${h.id}`,
      group: "Companies",
      label: h.name,
      sub: h.city || undefined,
      icon: Building2,
      href: `/companies/${h.id}`,
    }));
    return [...cmds, ...companyHits];
  }, [q, hits]);

  useEffect(() => {
    setActive(0);
  }, [flat.length]);

  function go(item?: FlatItem) {
    if (item) {
      router.push(item.href);
      onClose();
    }
  }

  function onKey(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, flat.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      go(flat[active]);
    } else if (e.key === "Escape") {
      onClose();
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 p-4 pt-[12vh] backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-lg overflow-hidden rounded-xl border border-border bg-popover shadow-pop"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 border-b border-border px-3">
          <Search size={16} className="shrink-0 text-muted-foreground" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={onKey}
            placeholder="Search modules, companies, or create…"
            className="h-12 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          {searching && <Loader2 size={14} className="animate-spin text-muted-foreground" />}
          <kbd className="rounded border border-border bg-secondary px-1.5 py-0.5 text-2xs text-muted-foreground">esc</kbd>
        </div>

        <div className="max-h-[22rem] overflow-y-auto p-1.5">
          {flat.length === 0 ? (
            <p className="px-2 py-8 text-center text-sm text-muted-foreground">No results for “{q}”.</p>
          ) : (
            flat.map((item, i) => {
              const Icon = item.icon;
              const isActive = i === active;
              const firstOfGroup = i === 0 || flat[i - 1].group !== item.group;
              return (
                <div key={item.key}>
                  {firstOfGroup && (
                    <p className="px-2 pb-1 pt-2 text-2xs font-semibold uppercase tracking-wide text-muted-foreground/60">
                      {item.group}
                    </p>
                  )}
                  <button
                    onMouseMove={() => setActive(i)}
                    onClick={() => go(item)}
                    className={cn(
                      "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm",
                      isActive ? "bg-secondary text-foreground" : "text-muted-foreground"
                    )}
                  >
                    <Icon size={16} className="shrink-0" />
                    <span className="flex-1 truncate text-foreground">{item.label}</span>
                    {item.sub && <span className="truncate text-2xs text-muted-foreground">{item.sub}</span>}
                    {isActive && <CornerDownLeft size={13} className="shrink-0 text-muted-foreground" />}
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
