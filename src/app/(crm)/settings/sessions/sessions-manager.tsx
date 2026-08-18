"use client";

import { useEffect, useState } from "react";
import { Monitor, Smartphone, LogOut, Loader2, ShieldCheck, Trash2 } from "lucide-react";
import { listSessionsAction, revokeSessionAction, revokeOtherSessionsAction, type SessionView } from "@/lib/actions/sessions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { timeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";
import { MfaCard } from "@/components/crm/mfa-card";
import { PasswordCard } from "@/components/crm/password-card";

const isMobile = (device: string) => /iphone|ipad|android/i.test(device);

export function SessionsManager() {
  const { toast } = useToast();
  const [rows, setRows] = useState<SessionView[]>([]);
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [revokingAll, setRevokingAll] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    listSessionsAction()
      .then((r) => !cancelled && setRows(r))
      .catch(() => !cancelled && setRows([]))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  const refetch = () => setReloadKey((k) => k + 1);
  const others = rows.filter((r) => !r.current).length;

  async function revoke(s: SessionView) {
    if (typeof window !== "undefined" && !window.confirm(`Sign out ${s.device} (${s.ip})?`)) return;
    setBusyId(s.id);
    const r = await revokeSessionAction(s.id);
    setBusyId(null);
    if (r.error) return toast(r.error, { tone: "error" });
    toast("Session revoked", { tone: "success" });
    refetch();
  }

  async function revokeAll() {
    if (typeof window !== "undefined" && !window.confirm("Sign out of all other devices?")) return;
    setRevokingAll(true);
    const r = await revokeOtherSessionsAction();
    setRevokingAll(false);
    if (r.error) return toast(r.error, { tone: "error" });
    toast(r.count > 0 ? `Signed out ${r.count} other session${r.count === 1 ? "" : "s"}` : "No other sessions", { tone: "success" });
    refetch();
  }

  return (
    <div className="max-w-2xl space-y-4">
      <div>
        <h1 className="flex items-center gap-2 text-xl font-semibold tracking-tight">
          <ShieldCheck size={18} className="text-electric" /> Account security
        </h1>
        <p className="mt-0.5 text-sm text-muted-foreground">Two-factor authentication and the devices signed in to your account.</p>
      </div>

      <MfaCard />
      <PasswordCard />

      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <p className="text-sm font-semibold">Active sessions</p>
        {others > 0 && (
          <Button size="sm" variant="outline" onClick={revokeAll} disabled={revokingAll}>
            {revokingAll ? <Loader2 size={14} className="animate-spin" /> : <LogOut size={14} />} Log out other sessions
          </Button>
        )}
      </div>

      {loading ? (
        <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}</div>
      ) : rows.length === 0 ? (
        <Card className="p-8 text-center text-sm text-muted-foreground">No active sessions.</Card>
      ) : (
        <div className="space-y-2">
          {rows.map((s) => {
            const Icon = isMobile(s.device) ? Smartphone : Monitor;
            return (
              <Card key={s.id} className={cn("flex items-center gap-3 p-3", s.current && "border-electric/40")}>
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-secondary text-muted-foreground"><Icon size={16} /></span>
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-2 text-sm font-medium">
                    {s.device}
                    {s.current && <span className="rounded-full bg-emerald/12 px-1.5 py-0.5 text-[10px] font-medium text-emerald">This device</span>}
                  </p>
                  <p className="truncate text-2xs text-muted-foreground">
                    {[s.ip, s.lastUsedAt ? `active ${timeAgo(s.lastUsedAt)}` : null, `signed in ${timeAgo(s.createdAt)}`].filter(Boolean).join(" · ")}
                  </p>
                </div>
                {!s.current && (
                  <button onClick={() => revoke(s)} disabled={busyId === s.id} className="grid h-8 w-8 shrink-0 place-items-center rounded text-muted-foreground hover:text-danger disabled:opacity-50" title="Revoke this session">
                    {busyId === s.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                  </button>
                )}
              </Card>
            );
          })}
        </div>
      )}
      <p className="text-2xs text-muted-foreground">Revoking a session signs that device out immediately. Sessions also expire on their own.</p>
    </div>
  );
}
