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
import { buildInternalUrl } from "./crm/internal-url";

// SSRF invariant: the CRM only ever calls its configured webapp origin, on
// code-defined `/api/internal/*` paths — never a user- or AI-supplied URL. The
// guard (pure + unit-tested in crm/internal-url) refuses anything off-origin;
// redirect:"error" below stops a redirect from pivoting off it mid-flight.
async function callWebapp(path: string, init: RequestInit, timeoutMs = 5000): Promise<Response | null> {
  if (!isConnected(integration)) return null;
  const target = buildInternalUrl(integration.webappUrl, path);
  if (!target) return null;
  try {
    return await fetch(target, {
      ...init,
      headers: { ...(init.headers ?? {}), "x-internal-secret": integration.secret },
      signal: AbortSignal.timeout(timeoutMs),
      cache: "no-store",
      redirect: "error", // never follow a redirect off the internal origin
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

export interface AiResult {
  /** the completion text, "" when the platform AI isn't available */
  text: string;
  /** true only when the platform's Anthropic key is configured + enabled */
  enabled: boolean;
}

/** Run a prompt on the Sajtpress platform's LLM. The CRM owns the prompt +
 *  context; this is just the model call. Degrades to { text:"", enabled:false }
 *  when the integration is off, unconfigured, unreachable or the platform AI is
 *  disabled — so every AI page has an honest "connect Sajtpress AI" state. */
export async function aiComplete(input: { system?: string; prompt: string; maxTokens?: number }): Promise<AiResult> {
  const res = await callWebapp(
    "/api/internal/ai/complete",
    { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(input) },
    45000
  );
  if (!res || !res.ok) return { text: "", enabled: false };
  try {
    const data = (await res.json()) as { text?: string; enabled?: boolean };
    return { text: typeof data.text === "string" ? data.text : "", enabled: !!data.enabled };
  } catch {
    return { text: "", enabled: false };
  }
}
