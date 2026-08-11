"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

type ToastTone = "default" | "success" | "error" | "info";
interface ToastData { id: number; message: string; tone: ToastTone; duration: number }
interface ToastOptions { tone?: ToastTone; duration?: number }

interface ToastApi {
  toast: (message: string, opts?: ToastOptions) => number;
  dismiss: (id: number) => void;
}

const ToastContext = createContext<ToastApi | null>(null);

let seq = 0; // module-level id source — unique without Date.now/Math.random

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastData[]>([]);
  const dismiss = useCallback((id: number) => setToasts((t) => t.filter((x) => x.id !== id)), []);
  const toast = useCallback((message: string, opts?: ToastOptions) => {
    const id = ++seq;
    setToasts((prev) => [...prev, { id, message, tone: opts?.tone ?? "default", duration: opts?.duration ?? 4000 }]);
    return id;
  }, []);
  return (
    <ToastContext.Provider value={{ toast, dismiss }}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 top-14 z-[60] flex flex-col items-center gap-2 p-4 sm:items-end">
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onDismiss={dismiss} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within a ToastProvider");
  return ctx;
}

const TONES: Record<ToastTone, { Icon: typeof Info; color: string }> = {
  default: { Icon: Info, color: "text-muted-foreground" },
  success: { Icon: CheckCircle2, color: "text-emerald" },
  error: { Icon: AlertCircle, color: "text-danger" },
  info: { Icon: Info, color: "text-electric" },
};

function ToastItem({ toast, onDismiss }: { toast: ToastData; onDismiss: (id: number) => void }) {
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const enter = setTimeout(() => setShown(true), 10);
    const leave = setTimeout(() => setShown(false), toast.duration);
    const remove = setTimeout(() => onDismiss(toast.id), toast.duration + 220);
    return () => {
      clearTimeout(enter);
      clearTimeout(leave);
      clearTimeout(remove);
    };
  }, [toast.id, toast.duration, onDismiss]);

  const { Icon, color } = TONES[toast.tone];
  return (
    <div
      role="status"
      className={cn(
        "pointer-events-auto flex w-full max-w-sm items-start gap-2.5 rounded-xl border border-border bg-popover p-3 shadow-pop transition-all duration-200",
        shown ? "translate-y-0 opacity-100" : "-translate-y-2 opacity-0"
      )}
    >
      <Icon size={16} className={cn("mt-0.5 shrink-0", color)} />
      <p className="flex-1 text-sm leading-snug">{toast.message}</p>
      <button onClick={() => onDismiss(toast.id)} className="shrink-0 text-muted-foreground transition-colors hover:text-foreground" aria-label="Dismiss">
        <X size={14} />
      </button>
    </div>
  );
}
