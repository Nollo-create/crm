"use client";

import { useRouter } from "next/navigation";
import { GripVertical, CalendarClock } from "lucide-react";
import { STAGES, weightedValue, stage, dealCloseInfo, type StageId } from "@/lib/crm/pipeline";
import type { BoardDeal } from "@/lib/actions/crm";
import { Select } from "@/components/ui/input";
import { useCanWrite } from "@/components/crm/role-context";
import { eur } from "@/lib/format";
import { cn } from "@/lib/utils";

export type StageTone = "muted" | "electric" | "royal" | "warning" | "emerald" | "danger";

export const STAGE_TONE: Record<StageId, StageTone> = {
  new: "muted", qualified: "electric", contacted: "electric",
  discovery: "royal", meeting: "royal", quote: "warning",
  negotiation: "warning", won: "emerald", lost: "danger",
};
export const TONE_DOT: Record<StageTone, string> = {
  muted: "bg-muted-foreground/60", electric: "bg-electric", royal: "bg-royal",
  warning: "bg-warning", emerald: "bg-emerald", danger: "bg-danger",
};
export const TONE_TOP: Record<StageTone, string> = {
  muted: "bg-muted-foreground/25", electric: "bg-electric", royal: "bg-royal",
  warning: "bg-warning", emerald: "bg-emerald", danger: "bg-danger",
};

/** One deal on the pipeline board: title, owner, account, value + weighted bar,
 *  a close-date signal and an inline stage move. Clicking opens the account. */
export function DealCard({
  deal: d,
  onMove,
  onDragStart,
  onDragEnd,
  dragging,
}: {
  deal: BoardDeal;
  onMove: (id: number, stage: string) => void;
  onDragStart?: (id: number) => void;
  onDragEnd?: () => void;
  dragging?: boolean;
}) {
  const router = useRouter();
  const canWrite = useCanWrite();
  const prob = d.probability != null ? d.probability : stage(d.stage).probability;
  const close = dealCloseInfo(d.expectedClose);
  return (
    <div
      draggable={canWrite}
      onDragStart={(e) => {
        if (!canWrite) return;
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", String(d.id));
        onDragStart?.(d.id);
      }}
      onDragEnd={() => onDragEnd?.()}
      onClick={() => router.push(`/deals/${d.id}`)}
      className={cn(
        "group rounded-lg border border-border bg-card p-3 shadow-xs transition-all hover:-translate-y-0.5 hover:border-electric/40 hover:shadow-card",
        canWrite ? "cursor-grab active:cursor-grabbing" : "cursor-pointer",
        dragging && "opacity-40"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="min-w-0 flex-1 truncate text-sm font-medium">{d.title}</p>
        {d.owner ? (
          <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-royal/15 text-[10px] font-semibold text-royal" title={`Owner · ${d.owner}`}>
            {d.owner.slice(0, 1).toUpperCase()}
          </span>
        ) : (
          <GripVertical size={14} className="shrink-0 text-muted-foreground/0 transition-colors group-hover:text-muted-foreground/50" />
        )}
      </div>
      <p className="mt-0.5 truncate text-xs text-muted-foreground group-hover:text-electric">{d.companyName}</p>

      <div className="mt-2 flex items-baseline justify-between gap-2">
        <span className="text-sm font-semibold tabular">{eur(d.value)}</span>
        <span className="text-2xs text-muted-foreground">≈ {eur(weightedValue(d))}</span>
      </div>
      <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-secondary">
        <div className={cn("h-full rounded-full", TONE_DOT[STAGE_TONE[d.stage]])} style={{ width: `${prob}%` }} />
      </div>

      {close && (
        <p className={cn(
          "mt-2 inline-flex items-center gap-1 text-2xs",
          close.tone === "danger" ? "text-danger" : close.tone === "warning" ? "text-warning" : "text-muted-foreground"
        )}>
          <CalendarClock size={11} /> {close.label}
        </p>
      )}

      {canWrite && (
        <div className="mt-2 border-t border-border pt-2" onClick={(e) => e.stopPropagation()}>
          <Select
            value={d.stage}
            onChange={(e) => onMove(d.id, e.target.value)}
            className="h-7 w-full border-transparent bg-secondary/50 text-2xs hover:bg-secondary"
          >
            {STAGES.map((st) => (
              <option key={st.id} value={st.id}>{st.label}</option>
            ))}
          </Select>
        </div>
      )}
    </div>
  );
}
