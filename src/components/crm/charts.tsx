import { cn } from "@/lib/utils";

// Lightweight, dependency-free chart primitives for the Analytics dashboards.
// All server-renderable (no interactivity) — just CSS.

export function Kpi({ label, value, sub, tone }: { label: string; value: string; sub?: string; tone?: string }) {
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2.5">
      <p className="text-2xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className={cn("mt-0.5 text-lg font-semibold tabular", tone)}>{value}</p>
      {sub && <p className="text-[10px] text-muted-foreground">{sub}</p>}
    </div>
  );
}

export interface BarItem {
  label: string;
  value: number;
  display?: string;
  barClass?: string;
}

export function BarList({ items, empty }: { items: BarItem[]; empty?: string }) {
  const shown = items;
  if (!shown.length) return <p className="py-6 text-center text-2xs text-muted-foreground">{empty ?? "No data yet."}</p>;
  const max = Math.max(1, ...shown.map((i) => i.value));
  return (
    <div className="space-y-1.5">
      {shown.map((it, i) => (
        <div key={i} className="flex items-center gap-2 text-xs">
          <span className="w-24 shrink-0 truncate text-muted-foreground sm:w-32">{it.label}</span>
          <div className="h-4 flex-1 overflow-hidden rounded bg-secondary">
            <div className={cn("h-full rounded", it.barClass ?? "bg-electric")} style={{ width: `${Math.min(100, (it.value / max) * 100)}%` }} />
          </div>
          <span className="w-20 shrink-0 text-right font-medium tabular">{it.display ?? String(it.value)}</span>
        </div>
      ))}
    </div>
  );
}

export function ChartCard({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="surface p-4">
      <p className="text-sm font-semibold">{title}</p>
      {subtitle && <p className="mt-0.5 text-2xs text-muted-foreground">{subtitle}</p>}
      <div className="mt-3">{children}</div>
    </div>
  );
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
/** "2026-03" -> "Mar 2026" (deterministic, no locale). */
export function monthLabel(ym: string): string {
  const [y, m] = ym.split("-");
  const idx = Number(m) - 1;
  return `${MONTHS[idx] ?? m} ${y}`;
}
