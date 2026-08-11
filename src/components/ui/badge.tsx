import { cn } from "@/lib/utils";

export type Tone = "neutral" | "electric" | "emerald" | "warning" | "danger" | "royal";

const TONES: Record<Tone, string> = {
  neutral: "bg-secondary text-muted-foreground",
  electric: "bg-electric/10 text-electric",
  emerald: "bg-emerald/10 text-emerald",
  warning: "bg-warning/10 text-warning",
  danger: "bg-danger/10 text-danger",
  royal: "bg-royal/10 text-royal",
};

export function Badge({
  tone = "neutral",
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { tone?: Tone }) {
  return (
    <span
      className={cn("inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-2xs font-medium", TONES[tone], className)}
      {...props}
    />
  );
}
