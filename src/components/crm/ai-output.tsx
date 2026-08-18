"use client";

import Link from "next/link";
import { useState } from "react";
import { Loader2, PlugZap, Copy, Check } from "lucide-react";
import type { AiOut } from "@/lib/actions/ai";

/** Small copy-to-clipboard button used on generated AI text. */
export function CopyButton({ text, className }: { text: string; className?: string }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable — ignore */
    }
  }
  return (
    <button
      onClick={copy}
      className={"inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-2xs text-muted-foreground transition-colors hover:text-foreground " + (className ?? "")}
      title="Copy"
    >
      {copied ? <Check size={13} className="text-emerald" /> : <Copy size={13} />} {copied ? "Copied" : "Copy"}
    </button>
  );
}

/** Shared result panel for the generative AI pages: loading, an honest
 *  "connect Sajtpress AI" state when the platform LLM isn't available, an error,
 *  or the completion text. */
export function AiOutput({ loading, result }: { loading: boolean; result: AiOut | null }) {
  if (loading) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">
        <Loader2 size={15} className="animate-spin" /> Thinking…
      </div>
    );
  }
  if (!result) return null;

  if (!result.enabled) {
    return (
      <div className="rounded-xl border border-warning/40 bg-warning/10 p-4 text-sm">
        <p className="flex items-center gap-2 font-medium"><PlugZap size={15} className="text-warning" /> Sajtpress AI isn&apos;t connected</p>
        <p className="mt-1 text-muted-foreground">
          These features run on the Sajtpress platform&apos;s AI. Connect your workspace in{" "}
          <Link href="/settings/integrations" className="text-electric hover:underline">Settings → Integrations</Link> to enable them.
        </p>
      </div>
    );
  }
  if (result.error) {
    return <div className="rounded-xl border border-danger/40 bg-danger/10 p-4 text-sm text-danger">{result.error === "ai_failed" ? "The AI request failed. Try again." : result.error}</div>;
  }
  if (!result.text) {
    return <div className="rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">No response.</div>;
  }
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="whitespace-pre-wrap text-sm leading-relaxed">{result.text}</div>
      <div className="mt-2 flex justify-end border-t border-border pt-2">
        <CopyButton text={result.text} />
      </div>
    </div>
  );
}
