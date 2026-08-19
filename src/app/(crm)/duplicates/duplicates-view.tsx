"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Combine, Loader2, CheckCircle2, Building2, Globe, Mail, ShieldCheck } from "lucide-react";
import { duplicateGroupsAction, mergeCompaniesAction, type DuplicateGroupView, type DedupeCompanySummary } from "@/lib/actions/dedupe";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge, type Tone } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { useCanWrite } from "@/components/crm/role-context";
import { cn } from "@/lib/utils";

const REASON: Record<DuplicateGroupView["reason"], { label: string; tone: Tone; icon: typeof Globe }> = {
  vat: { label: "Same VAT", tone: "royal", icon: ShieldCheck },
  domain: { label: "Same domain", tone: "electric", icon: Globe },
  name: { label: "Same name", tone: "warning", icon: Building2 },
};

// Richest record = the one most worth keeping (most linked data; oldest breaks ties).
function richness(c: DedupeCompanySummary): number {
  return c.contacts * 2 + c.deals * 3 + c.activities;
}
function defaultPrimary(g: DuplicateGroupView): number {
  return [...g.companies].sort((a, b) => richness(b) - richness(a) || a.id - b.id)[0]?.id ?? 0;
}

export function DuplicatesView() {
  const { toast } = useToast();
  const canWrite = useCanWrite();
  const [groups, setGroups] = useState<DuplicateGroupView[] | null>(null);
  const [primaries, setPrimaries] = useState<Record<number, number>>({});
  const [busy, setBusy] = useState<number | null>(null);

  function load() {
    duplicateGroupsAction()
      .then((g) => { setGroups(g); setPrimaries({}); })
      .catch(() => setGroups([]));
  }
  useEffect(() => { load(); }, []);

  async function mergeGroup(gi: number, group: DuplicateGroupView) {
    const primaryId = primaries[gi] ?? defaultPrimary(group);
    const primary = group.companies.find((c) => c.id === primaryId);
    const others = group.companies.filter((c) => c.id !== primaryId);
    if (!primary || others.length === 0) return;
    if (typeof window !== "undefined" && !window.confirm(
      `Keep "${primary.name}" and merge ${others.length} duplicate${others.length === 1 ? "" : "s"} into it?\n\nTheir contacts, deals, quotes and history move to "${primary.name}", then the duplicate${others.length === 1 ? " is" : "s are"} deleted. This can't be undone.`
    )) return;

    setBusy(gi);
    for (const o of others) {
      const r = await mergeCompaniesAction(primaryId, o.id);
      if (r.error) {
        toast(r.error, { tone: "error" });
        setBusy(null);
        load();
        return;
      }
    }
    setBusy(null);
    toast(`Merged into ${primary.name}`, { tone: "success" });
    load();
  }

  return (
    <div className="max-w-3xl space-y-4">
      <div>
        <h1 className="flex items-center gap-2 text-xl font-semibold tracking-tight"><Combine size={18} className="text-electric" /> Duplicates</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">Companies that share a name, website/email domain, or VAT id. Pick the record to keep and merge the rest into it.</p>
      </div>

      {groups === null ? (
        <div className="space-y-2">{[0, 1].map((i) => <Skeleton key={i} className="h-40 w-full" />)}</div>
      ) : groups.length === 0 ? (
        <Card className="flex items-center gap-2 p-8 text-sm text-muted-foreground"><CheckCircle2 size={18} className="text-emerald" /> No duplicates found — your company records look clean.</Card>
      ) : (
        <>
          <p className="text-2xs text-muted-foreground">{groups.length} possible duplicate group{groups.length === 1 ? "" : "s"}.</p>
          {groups.map((g, gi) => {
            const primaryId = primaries[gi] ?? defaultPrimary(g);
            const R = REASON[g.reason];
            return (
              <Card key={`${g.reason}-${g.value}-${gi}`} className="space-y-3 p-4">
                <div className="flex items-center gap-2">
                  <Badge tone={R.tone}><R.icon size={11} className="mr-1 inline" />{R.label}</Badge>
                  {g.reason !== "name" && <span className="truncate text-2xs text-muted-foreground">{g.value}</span>}
                </div>

                <div className="space-y-2">
                  {g.companies.map((c) => {
                    const isPrimary = c.id === primaryId;
                    return (
                      <label key={c.id} className={cn("flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors", isPrimary ? "border-electric/50 bg-electric/[0.05]" : "border-border hover:bg-secondary/40")}>
                        <input
                          type="radio"
                          name={`primary-${gi}`}
                          checked={isPrimary}
                          onChange={() => setPrimaries((p) => ({ ...p, [gi]: c.id }))}
                          className="mt-1 h-4 w-4 shrink-0 accent-electric"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <Link href={`/companies/${c.id}`} className="truncate text-sm font-medium hover:text-electric hover:underline">{c.name || "—"}</Link>
                            {isPrimary && <Badge tone="emerald">Keep</Badge>}
                          </div>
                          <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-2xs text-muted-foreground">
                            <span>{c.contacts} contact{c.contacts === 1 ? "" : "s"} · {c.deals} deal{c.deals === 1 ? "" : "s"} · {c.activities} note{c.activities === 1 ? "" : "s"}</span>
                            {c.website && <span className="inline-flex items-center gap-1"><Globe size={10} /> {c.website.replace(/^https?:\/\//, "")}</span>}
                            {c.email && <span className="inline-flex items-center gap-1"><Mail size={10} /> {c.email}</span>}
                            {c.vatId && <span>VAT {c.vatId}</span>}
                          </p>
                        </div>
                      </label>
                    );
                  })}
                </div>

                {canWrite && (
                  <div className="flex justify-end">
                    <Button size="sm" onClick={() => mergeGroup(gi, g)} disabled={busy === gi}>
                      {busy === gi ? <Loader2 size={13} className="animate-spin" /> : <Combine size={13} />} Merge {g.companies.length - 1} into kept
                    </Button>
                  </div>
                )}
              </Card>
            );
          })}
        </>
      )}
    </div>
  );
}
