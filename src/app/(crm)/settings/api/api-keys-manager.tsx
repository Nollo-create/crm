"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { KeyRound, Plus, Copy, Check, Trash2, Loader2, ShieldCheck } from "lucide-react";
import {
  createApiKeyAction,
  toggleApiKeyAction,
  deleteApiKeyAction,
  type ApiKeysData,
} from "@/lib/actions/api-keys";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { timeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";

const ENDPOINTS = [
  { method: "GET", path: "/api/v1/ping", desc: "Verify the key (whoami)" },
  { method: "GET", path: "/api/v1/companies", desc: "List companies" },
  { method: "GET", path: "/api/v1/contacts", desc: "List contacts" },
  { method: "GET", path: "/api/v1/deals", desc: "List deals" },
];

export function ApiKeysManager({ data }: { data: ApiKeysData }) {
  const { toast } = useToast();
  const router = useRouter();
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [reveal, setReveal] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [base, setBase] = useState("https://crm.sajtpress.rs");

  useEffect(() => {
    if (typeof window !== "undefined") setBase(window.location.origin);
  }, []);

  const activeCount = data.keys.filter((k) => k.enabled).length;
  const totalRequests = data.keys.reduce((s, k) => s + k.requestCount, 0);
  const curlFor = (path: string) => `curl ${base}${path} \\\n  -H "Authorization: Bearer crmk_your_key"`;

  async function copy(text: string, key: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey((k) => (k === key ? null : k)), 1500);
    } catch {
      toast("Copy failed — select and copy manually", { tone: "error" });
    }
  }

  async function create() {
    setCreating(true);
    const r = await createApiKeyAction(name);
    setCreating(false);
    if (r.error) return toast(r.error, { tone: "error" });
    setReveal(r.plain ?? null);
    setName("");
    router.refresh();
  }
  async function toggle(id: number, enabled: boolean) {
    setBusyId(id);
    const r = await toggleApiKeyAction(id, enabled);
    setBusyId(null);
    if (r.error) return toast(r.error, { tone: "error" });
    router.refresh();
  }
  async function revoke(id: number, label: string) {
    if (typeof window !== "undefined" && !window.confirm(`Revoke "${label}"? Any client using it will stop working.`)) return;
    setBusyId(id);
    const r = await deleteApiKeyAction(id);
    setBusyId(null);
    if (r.error) return toast(r.error, { tone: "error" });
    toast("Key revoked", { tone: "success" });
    router.refresh();
  }
  async function copyReveal() {
    if (!reveal) return;
    try {
      await navigator.clipboard.writeText(reveal);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast("Copy failed — select and copy manually", { tone: "error" });
    }
  }

  return (
    <div className="max-w-3xl space-y-4">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">API</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">Programmatic, read-only access to your organization&apos;s data.</p>
      </div>

      {/* One-time reveal */}
      {reveal && (
        <Card className="space-y-2 border-emerald/40 bg-emerald/5 p-4">
          <div className="flex items-center gap-1.5 text-sm font-semibold text-emerald">
            <ShieldCheck size={15} /> Your new API key
          </div>
          <p className="text-2xs text-muted-foreground">Copy it now — for your security it won&apos;t be shown again.</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 overflow-x-auto rounded-lg border border-border bg-background px-3 py-2 text-xs">{reveal}</code>
            <Button size="sm" variant="outline" onClick={copyReveal}>
              {copied ? <Check size={14} className="text-emerald" /> : <Copy size={14} />} {copied ? "Copied" : "Copy"}
            </Button>
          </div>
          <div className="flex justify-end">
            <Button size="sm" variant="ghost" onClick={() => setReveal(null)}>Done</Button>
          </div>
        </Card>
      )}

      {/* Create */}
      {data.canManage && (
        <Card className="flex flex-wrap items-end gap-2 p-4">
          <label className="flex-1 text-2xs uppercase tracking-wide text-muted-foreground">
            New key label
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Zapier, internal script" className="mt-1" />
          </label>
          <Button size="sm" onClick={create} disabled={creating}>
            {creating ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />} Create key
          </Button>
        </Card>
      )}

      {/* Usage summary */}
      {data.keys.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          <Card className="p-3"><p className="text-2xs text-muted-foreground">Keys</p><p className="text-lg font-semibold tabular">{data.keys.length}</p></Card>
          <Card className="p-3"><p className="text-2xs text-muted-foreground">Active</p><p className="text-lg font-semibold tabular text-emerald">{activeCount}</p></Card>
          <Card className="p-3"><p className="text-2xs text-muted-foreground">Total requests</p><p className="text-lg font-semibold tabular">{totalRequests.toLocaleString("en-US")}</p></Card>
        </div>
      )}

      {/* Keys */}
      {data.keys.length === 0 ? (
        <Card className="p-8 text-center text-sm text-muted-foreground">
          No API keys yet.{data.canManage ? " Create one above to start using the API." : " Only an owner can create keys."}
        </Card>
      ) : (
        <div className="space-y-2">
          {data.keys.map((k) => (
            <Card key={k.id} className={cn("flex items-center gap-3 p-3", !k.enabled && "opacity-60")}>
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-electric/12 text-electric"><KeyRound size={15} /></span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{k.name}</p>
                <p className="truncate text-2xs text-muted-foreground">
                  <code>{k.masked}</code> · {k.requestCount} req{k.requestCount === 1 ? "" : "s"} ·{" "}
                  {k.lastUsedAt ? `used ${timeAgo(k.lastUsedAt)}` : "never used"}
                </p>
              </div>
              {data.canManage && (
                <>
                  <label className="flex shrink-0 cursor-pointer items-center gap-1.5 text-2xs text-muted-foreground">
                    <input type="checkbox" checked={k.enabled} disabled={busyId === k.id} onChange={() => toggle(k.id, !k.enabled)} className="h-3.5 w-3.5 accent-electric" />
                    {k.enabled ? "Active" : "Disabled"}
                  </label>
                  <button onClick={() => revoke(k.id, k.name)} disabled={busyId === k.id} className="grid h-7 w-7 shrink-0 place-items-center rounded text-muted-foreground hover:text-danger" title="Revoke">
                    <Trash2 size={14} />
                  </button>
                </>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Docs */}
      <Card className="space-y-3 p-4">
        <div>
          <p className="text-sm font-semibold">Using the API</p>
          <p className="text-2xs text-muted-foreground">Send your key as a bearer token. All endpoints are read-only and scoped to your organization.</p>
        </div>
        <div className="relative">
          <pre className="overflow-x-auto rounded-lg border border-border bg-background p-3 pr-16 text-2xs leading-relaxed">{curlFor("/api/v1/companies")}</pre>
          <button onClick={() => copy(curlFor("/api/v1/companies"), "curl")} className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-md bg-secondary px-1.5 py-1 text-2xs text-muted-foreground transition-colors hover:text-foreground">
            {copiedKey === "curl" ? <Check size={12} className="text-emerald" /> : <Copy size={12} />} {copiedKey === "curl" ? "Copied" : "Copy"}
          </button>
        </div>
        <div className="space-y-1 border-t border-border pt-3">
          {ENDPOINTS.map((e) => (
            <div key={e.path} className="group flex items-center gap-2 text-2xs">
              <span className="w-10 shrink-0 rounded bg-secondary px-1.5 py-0.5 text-center font-semibold text-muted-foreground">{e.method}</span>
              <code className="text-foreground">{e.path}</code>
              <span className="min-w-0 flex-1 truncate text-muted-foreground">— {e.desc}</span>
              <button onClick={() => copy(curlFor(e.path), e.path)} title="Copy curl" className="shrink-0 rounded p-1 text-muted-foreground opacity-0 transition-opacity hover:text-foreground group-hover:opacity-100">
                {copiedKey === e.path ? <Check size={12} className="text-emerald" /> : <Copy size={12} />}
              </button>
            </div>
          ))}
        </div>
        <p className="text-2xs text-muted-foreground">
          Query params: <code>q</code> (search), <code>sort</code>, <code>dir</code> (asc/desc), <code>page</code>, <code>limit</code> (max 100). Write access
          isn&apos;t available in v1. Rate limit: <code>120 requests/min</code> per key — over that returns <code>429</code> with a <code>Retry-After</code> header.
        </p>
      </Card>
    </div>
  );
}
