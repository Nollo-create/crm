"use client";

import { useEffect, useRef, useState } from "react";
import { Bookmark, Check, Trash2, ChevronDown, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export interface SavedView {
  id: string;
  name: string;
  state: Record<string, unknown>;
}

/** A small, generic "saved views" control: snapshots the current filter/sort state
 *  under a name (localStorage, per storageKey) and re-applies it. Reused across the
 *  Leads and Deals lists; Companies keeps its own richer views. */
export function SavedViews<T extends Record<string, unknown>>({
  storageKey,
  current,
  onApply,
}: {
  storageKey: string;
  current: T;
  onApply: (state: T) => void;
}) {
  const [views, setViews] = useState<SavedView[]>([]);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const seq = useRef(0);

  useEffect(() => {
    try {
      const raw = JSON.parse(localStorage.getItem(storageKey) || "[]");
      setViews(Array.isArray(raw) ? raw : []);
    } catch {
      setViews([]);
    }
  }, [storageKey]);

  function persist(next: SavedView[]) {
    setViews(next);
    try {
      localStorage.setItem(storageKey, JSON.stringify(next));
    } catch {
      /* ignore quota / private-mode */
    }
  }
  function save() {
    const nm = name.trim();
    if (!nm) return;
    const id = `v${Date.now()}-${seq.current++}`;
    persist([...views.filter((v) => v.name.toLowerCase() !== nm.toLowerCase()), { id, name: nm, state: current }]);
    setName("");
  }
  function del(id: string) {
    persist(views.filter((v) => v.id !== id));
  }

  return (
    <div className="relative">
      <Button size="sm" variant="outline" onClick={() => setOpen((v) => !v)} className="gap-1">
        <Bookmark size={13} /> Views{views.length > 0 && <span className="text-2xs text-muted-foreground">· {views.length}</span>} <ChevronDown size={12} />
      </Button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-50 mt-1.5 w-64 rounded-lg border border-border bg-popover p-1.5 shadow-pop">
            <div className="max-h-56 space-y-0.5 overflow-y-auto">
              {views.length === 0 ? (
                <p className="px-2 py-3 text-center text-2xs text-muted-foreground">No saved views yet.</p>
              ) : (
                views.map((v) => (
                  <div key={v.id} className={cn("group flex items-center gap-1 rounded-md px-1.5 py-1 hover:bg-secondary")}>
                    <button onClick={() => { onApply(v.state as T); setOpen(false); }} className="flex flex-1 items-center gap-2 truncate text-left text-sm">
                      <Check size={13} className="shrink-0 text-muted-foreground" /> {v.name}
                    </button>
                    <button onClick={() => del(v.id)} className="shrink-0 text-muted-foreground opacity-0 transition-opacity hover:text-danger group-hover:opacity-100" aria-label="Delete view"><Trash2 size={12} /></button>
                  </div>
                ))
              )}
            </div>
            <div className="mt-1.5 flex items-center gap-1 border-t border-border pt-1.5">
              <Input value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && save()} placeholder="Save current view…" className="h-8 text-xs" />
              <Button size="sm" onClick={save} disabled={!name.trim()} className="shrink-0 px-2"><Plus size={13} /></Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
