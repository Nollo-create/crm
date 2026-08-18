"use client";

import { useEffect, useState } from "react";
import { Plus, X } from "lucide-react";
import { listTagsAction, getEntityTagsAction, setEntityTagsAction, type Tag } from "@/lib/actions/tags";
import { pickTagColor, tagClass } from "@/lib/crm/tags";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

/** Reusable tag chips + add/create popover for any entity (company/contact/lead/deal). */
export function TagEditor({ entityType, entityId }: { entityType: "company" | "contact" | "lead" | "deal"; entityId: number }) {
  const [tags, setTags] = useState<Tag[]>([]);
  const [all, setAll] = useState<Tag[]>([]);
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    getEntityTagsAction(entityType, entityId).then(setTags).catch(() => {});
    listTagsAction().then(setAll).catch(() => {});
  }, [entityType, entityId]);

  const has = (id: number) => tags.some((t) => t.id === id);

  async function apply(ids: number[], newTags?: { name: string; color: string }[]) {
    setBusy(true);
    const r = await setEntityTagsAction(entityType, entityId, ids, newTags);
    setBusy(false);
    if (r.error) return;
    setTags(r.tags);
    if (newTags?.length) listTagsAction().then(setAll).catch(() => {});
  }
  function toggle(t: Tag) {
    apply(has(t.id) ? tags.filter((x) => x.id !== t.id).map((x) => x.id) : [...tags.map((x) => x.id), t.id]);
  }
  function removeTag(id: number) {
    apply(tags.filter((t) => t.id !== id).map((t) => t.id));
  }
  function createAndAdd() {
    const nm = q.trim();
    if (!nm) return;
    const existing = all.find((t) => t.name.toLowerCase() === nm.toLowerCase());
    if (existing) {
      if (!has(existing.id)) toggle(existing);
    } else {
      apply(tags.map((t) => t.id), [{ name: nm, color: pickTagColor(nm) }]);
    }
    setQ("");
  }

  const available = all.filter((t) => !has(t.id) && t.name.toLowerCase().includes(q.trim().toLowerCase()));

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {tags.map((t) => (
        <span key={t.id} className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-2xs font-medium", tagClass(t.color))}>
          {t.name}
          <button onClick={() => removeTag(t.id)} className="opacity-60 hover:opacity-100" aria-label={`Remove ${t.name}`}><X size={11} /></button>
        </span>
      ))}
      <div className="relative">
        <button
          onClick={() => setOpen((v) => !v)}
          disabled={busy}
          className="inline-flex items-center gap-1 rounded-full border border-dashed border-border px-2 py-0.5 text-2xs text-muted-foreground transition-colors hover:border-electric/50 hover:text-foreground"
        >
          <Plus size={11} /> Tag
        </button>
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <div className="absolute left-0 z-50 mt-1 w-56 rounded-lg border border-border bg-popover p-1.5 shadow-pop">
              <div className="flex items-center gap-1">
                <Input value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === "Enter" && createAndAdd()} placeholder="New or find tag…" className="h-8 text-xs" />
                <button onClick={createAndAdd} disabled={!q.trim()} className="shrink-0 rounded-md bg-electric px-2 py-1.5 text-white disabled:opacity-40" aria-label="Add tag"><Plus size={13} /></button>
              </div>
              {available.length > 0 && (
                <div className="mt-1.5 max-h-40 space-y-0.5 overflow-y-auto border-t border-border pt-1.5">
                  {available.map((t) => (
                    <button key={t.id} onClick={() => toggle(t)} className="flex w-full items-center rounded-md px-1 py-0.5 text-left hover:bg-secondary">
                      <span className={cn("rounded-full px-2 py-0.5 text-2xs font-medium", tagClass(t.color))}>{t.name}</span>
                    </button>
                  ))}
                </div>
              )}
              {q.trim() && available.length === 0 && !all.some((t) => t.name.toLowerCase() === q.trim().toLowerCase()) && (
                <p className="mt-1.5 border-t border-border px-1 pt-1.5 text-2xs text-muted-foreground">Press + to create “{q.trim()}”.</p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
