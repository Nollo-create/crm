"use client";

import { createContext, useContext, type ReactNode } from "react";

// Makes the signed-in user's role available to client components so write UI can
// be hidden for read-only (viewer) users. This is UX only — the real boundary is
// the server-side guardWrite()/can() checks. `canWrite` mirrors the server's
// `record:write` permission: everyone except viewer.

interface RoleCtx {
  role: string;
  canWrite: boolean;
}

const Ctx = createContext<RoleCtx>({ role: "member", canWrite: true });

export function RoleProvider({ role, children }: { role: string; children: ReactNode }) {
  return <Ctx.Provider value={{ role, canWrite: role !== "viewer" }}>{children}</Ctx.Provider>;
}

export function useRole(): string {
  return useContext(Ctx).role;
}

/** True when the user may create/edit/delete records (owner/admin/member). */
export function useCanWrite(): boolean {
  return useContext(Ctx).canWrite;
}
