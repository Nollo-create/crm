"use client";

import { useState } from "react";
import { Send, Sparkles } from "lucide-react";
import { aiAssistantAction, type AiOut } from "@/lib/actions/ai";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AiOutput } from "@/components/crm/ai-output";

const EXAMPLES = ["What should I focus on this week?", "How is my pipeline looking?", "Which customers are at risk?"];

export default function AssistantPage() {
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AiOut | null>(null);

  async function ask(question?: string) {
    const text = (question ?? q).trim();
    if (!text) return;
    setQ(text);
    setLoading(true);
    setResult(null);
    const r = await aiAssistantAction(text).catch(() => ({ text: "", enabled: false }));
    setResult(r);
    setLoading(false);
  }

  return (
    <div className="max-w-2xl space-y-4">
      <div>
        <h1 className="flex items-center gap-2 text-xl font-semibold tracking-tight"><Sparkles size={18} className="text-royal" /> AI sales assistant</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">Ask about your pipeline, accounts and priorities.</p>
      </div>

      <form onSubmit={(e) => { e.preventDefault(); ask(); }} className="flex gap-2">
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Ask something…" autoFocus />
        <Button type="submit" disabled={loading || !q.trim()}><Send size={15} /></Button>
      </form>

      <div className="flex flex-wrap gap-1.5">
        {EXAMPLES.map((e) => (
          <button key={e} onClick={() => ask(e)} disabled={loading} className="rounded-lg bg-secondary px-2.5 py-1 text-2xs text-muted-foreground transition-colors hover:text-foreground">
            {e}
          </button>
        ))}
      </div>

      <AiOutput loading={loading} result={result} />
    </div>
  );
}
