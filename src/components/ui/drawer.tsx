"use client";

import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

const WIDTHS = { xs: "max-w-[17rem]", sm: "max-w-sm", md: "max-w-md", lg: "max-w-lg", xl: "max-w-xl" } as const;

/**
 * Right/left slide-in panel. Preferred over a modal for viewing a record
 * without leaving the current screen. Stays mounted through the leave
 * transition, locks body scroll and closes on Esc or overlay click.
 */
export function Drawer({
  open,
  onClose,
  side = "right",
  width = "md",
  className,
  children,
}: {
  open: boolean;
  onClose: () => void;
  side?: "right" | "left";
  width?: keyof typeof WIDTHS;
  className?: string;
  children: React.ReactNode;
}) {
  const [mounted, setMounted] = useState(false); // present in the DOM (incl. leave anim)
  const [shown, setShown] = useState(false); // drives the enter/leave transition
  const panelRef = useRef<HTMLDivElement>(null);

  // Mount immediately when opening; keep mounted through the leave transition.
  useEffect(() => {
    if (open) {
      setMounted(true);
    } else if (mounted) {
      setShown(false);
      const t = setTimeout(() => setMounted(false), 300);
      return () => clearTimeout(t);
    }
  }, [open, mounted]);

  // Once mounted, flip `shown` on the next tick so the enter transition plays.
  // A timeout (not rAF) so it fires even when the tab isn't compositing frames.
  useEffect(() => {
    if (open && mounted) {
      const t = setTimeout(() => setShown(true), 20);
      return () => clearTimeout(t);
    }
  }, [open, mounted]);

  useEffect(() => {
    if (!mounted) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [mounted, onClose]);

  useEffect(() => {
    if (shown) panelRef.current?.focus();
  }, [shown]);

  if (!mounted) return null;

  const off = side === "right" ? "translate-x-full" : "-translate-x-full";

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true">
      <div
        onClick={onClose}
        className={cn("absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-200", shown ? "opacity-100" : "opacity-0")}
      />
      <div
        ref={panelRef}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        className={cn(
          "absolute inset-y-0 flex w-full flex-col bg-popover shadow-pop outline-none transition-transform duration-300 ease-out",
          side === "right" ? "right-0 border-l border-border" : "left-0 border-r border-border",
          WIDTHS[width],
          shown ? "translate-x-0" : off,
          className
        )}
      >
        {children}
      </div>
    </div>
  );
}

export function DrawerHeader({ onClose, className, children }: { onClose?: () => void; className?: string; children: React.ReactNode }) {
  return (
    <div className={cn("flex items-start gap-3 border-b border-border p-4", className)}>
      <div className="min-w-0 flex-1">{children}</div>
      {onClose && (
        <button
          onClick={onClose}
          className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          title="Close (Esc)"
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
}

export function DrawerBody({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("flex-1 space-y-5 overflow-y-auto p-4", className)}>{children}</div>;
}

export function DrawerFooter({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("flex items-center gap-2 border-t border-border p-3", className)}>{children}</div>;
}
