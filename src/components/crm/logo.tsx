import { cn } from "@/lib/utils";

// Sajtpress brand logo. `BrandMark` is the standalone app-icon (gradient squircle
// + spark); `Wordmark` is the SAJTPRESS lockup with a gradient "PRESS"; `Logo`
// pairs them. One source of truth so the brand stays identical everywhere.

export function BrandMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "relative grid shrink-0 place-items-center rounded-[10px] bg-gradient-to-br from-electric to-royal shadow-[0_5px_16px_-5px_rgba(124,92,255,0.6)] ring-1 ring-inset ring-white/20",
        className ?? "h-8 w-8"
      )}
      aria-hidden
    >
      {/* geometric spark — momentum / speed */}
      <svg viewBox="0 0 24 24" className="h-[52%] w-[52%] text-white" fill="currentColor">
        <path d="M13 2 L4.5 13.5 L11 13.5 L11 22 L19.5 10.5 L13 10.5 Z" />
      </svg>
    </span>
  );
}

export function Wordmark({ withCrm = true, className }: { withCrm?: boolean; className?: string }) {
  return (
    <span className={cn("select-none font-bold leading-none tracking-tight text-[15px]", className)}>
      <span className="text-foreground">SAJT</span>
      <span className="bg-gradient-to-r from-electric to-royal bg-clip-text text-transparent">PRESS</span>
      {withCrm && (
        <span className="ml-1.5 align-[1px] text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground/70">CRM</span>
      )}
    </span>
  );
}

export function Logo({ withCrm = true, markClassName, wordClassName, className }: { withCrm?: boolean; markClassName?: string; wordClassName?: string; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <BrandMark className={markClassName} />
      <Wordmark withCrm={withCrm} className={wordClassName} />
    </span>
  );
}
