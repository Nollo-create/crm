"use client";

import Link from "next/link";
import { Loader2, PlugZap } from "lucide-react";
import type { AiOut } from "@/lib/actions/ai";

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
  return <div className="whitespace-pre-wrap rounded-xl border border-border bg-card p-4 text-sm leading-relaxed">{result.text}</div>;
}
