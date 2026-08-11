import "server-only";

// The client for talking to the Sajtpress webapp — server-to-server, with the
// shared service secret. Every call degrades gracefully: if the integration is
// off, unconfigured, unreachable or slow, it returns a safe empty result instead
// of throwing. That's what lets the CMS run identically whether it's connected
// or standalone.
//
// Contract (implemented on the webapp side, guarded by X-Internal-Secret):
//   GET  /api/internal/ping           -> 200 when the secret matches
//   POST /api/internal/ai-context     { agentId, projectId?, taskText? } -> { block }
//
// The webapp endpoints don't exist yet — until they do, these no-op to empty,
// so the CMS already works.

import { integration, isConnected } from "./config";

async function callWebapp(path: string, init: RequestInit, timeoutMs = 5000): Promise<Response | null> {
  if (!isConnected(integration)) return null;
  try {
    return await fetch(`${integration.webappUrl}${path}`, {
      ...init,
      headers: { ...(init.headers ?? {}), "x-internal-secret": integration.secret },
      signal: AbortSignal.timeout(timeoutMs),
      cache: "no-store",
    });
  } catch {
    return null;
  }
}

/** The assembled AI Intelligence context for an agent, from the shared brain.
 *  "" when disconnected — the CMS's agents then run without it, unchanged. */
export async function agentContext(
  agentId: string,
  opts: { projectId?: number; taskText?: string } = {}
): Promise<string> {
  const res = await callWebapp("/api/internal/ai-context", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ agentId, projectId: opts.projectId, taskText: opts.taskText }),
  });
  if (!res || !res.ok) return "";
  try {
    const data = (await res.json()) as { block?: string };
    return typeof data.block === "string" ? data.block : "";
  } catch {
    return "";
  }
}

/** Is the Sajtpress webapp reachable with our credentials right now? For the
 *  status page / health check. */
export async function webappReachable(): Promise<boolean> {
  const res = await callWebapp("/api/internal/ping", { method: "GET" }, 4000);
  return !!res && res.ok;
}
