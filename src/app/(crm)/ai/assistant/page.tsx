"use client";

import { useEffect, useRef, useState } from "react";
import { Send, Sparkles, PlugZap, Loader2, Trash2, User } from "lucide-react";
import Link from "next/link";
import { aiAssistantAction, type ChatTurn } from "@/lib/actions/ai";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/crm/ai-output";

const EXAMPLES = ["What should I focus on this week?", "How is my pipeline looking?", "Which customers are at risk?", "Where am I losing deals?"];

type Msg = ChatTurn & { id: number };

export default function AssistantPage() {
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [disconnected, setDisconnected] = useState(false);
  const [error, setError] = useState("");
  const endRef = useRef<HTMLDivElement>(null);
  const idRef = useRef(0);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [msgs, loading]);

  async function ask(question?: string) {
    const text = (question ?? q).trim();
    if (!text || loading) return;
    setError("");
    setDisconnected(false);
    const history: ChatTurn[] = msgs.map((m) => ({ role: m.role, text: m.text }));
    setMsgs((prev) => [...prev, { id: ++idRef.current, role: "user", text }]);
    setQ("");
    setLoading(true);
    const r = await aiAssistantAction(text, history).catch(() => ({ text: "", enabled: false as boolean, error: "ai_failed" }));
    setLoading(false);
    if (!r.enabled) {
      setDisconnected(true);
      return;
    }
    if (r.error) {
      setError(r.error === "ai_failed" ? "The AI request failed. Try again." : r.error);
      return;
    }
    setMsgs((prev) => [...prev, { id: ++idRef.current, role: "assistant", text: r.text }]);
  }

  const empty = msgs.length === 0 && !loading;

  return (
    <div className="mx-auto flex h-[calc(100vh-8rem)] max-w-2xl flex-col">
      <div className="flex items-center justify-between gap-2 pb-3">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-semibold tracking-tight"><Sparkles size={18} className="text-royal" /> AI sales assistant</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">Ask about your pipeline, accounts and priorities. Follow-ups keep context.</p>
        </div>
        {msgs.length > 0 && (
          <button onClick={() => { setMsgs([]); setError(""); setDisconnected(false); }} className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-2xs text-muted-foreground transition-colors hover:text-foreground" title="Clear conversation">
            <Trash2 size={13} /> Clear
          </button>
        )}
      </div>

      {/* Thread */}
      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
        {empty && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {EXAMPLES.map((e) => (
              <button key={e} onClick={() => ask(e)} className="rounded-lg bg-secondary px-2.5 py-1 text-2xs text-muted-foreground transition-colors hover:text-foreground">{e}</button>
            ))}
          </div>
        )}

        {msgs.map((m) =>
          m.role === "user" ? (
            <div key={m.id} className="flex justify-end">
              <div className="flex max-w-[85%] items-start gap-2">
                <div className="rounded-2xl rounded-tr-sm bg-electric/10 px-3 py-2 text-sm text-foreground">{m.text}</div>
                <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-secondary text-muted-foreground"><User size={13} /></span>
              </div>
            </div>
          ) : (
            <div key={m.id} className="flex justify-start">
              <div className="flex max-w-[90%] items-start gap-2">
                <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-royal/15 text-royal"><Sparkles size={13} /></span>
                <div className="group rounded-2xl rounded-tl-sm border border-border bg-card px-3 py-2">
                  <div className="whitespace-pre-wrap text-sm leading-relaxed">{m.text}</div>
                  <div className="mt-1 flex justify-end opacity-0 transition-opacity group-hover:opacity-100">
                    <CopyButton text={m.text} />
                  </div>
                </div>
              </div>
            </div>
          )
        )}

        {loading && (
          <div className="flex justify-start">
            <div className="flex items-center gap-2">
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-royal/15 text-royal"><Sparkles size={13} /></span>
              <div className="flex items-center gap-2 rounded-2xl rounded-tl-sm border border-border bg-card px-3 py-2 text-sm text-muted-foreground">
                <Loader2 size={14} className="animate-spin" /> Thinking…
              </div>
            </div>
          </div>
        )}

        {disconnected && (
          <div className="rounded-xl border border-warning/40 bg-warning/10 p-4 text-sm">
            <p className="flex items-center gap-2 font-medium"><PlugZap size={15} className="text-warning" /> Sajtpress AI isn&apos;t connected</p>
            <p className="mt-1 text-muted-foreground">
              This assistant runs on the Sajtpress platform&apos;s AI. Connect your workspace in{" "}
              <Link href="/settings/integrations" className="text-electric hover:underline">Settings → Integrations</Link> to enable it.
            </p>
          </div>
        )}
        {error && <div className="rounded-xl border border-danger/40 bg-danger/10 p-3 text-sm text-danger">{error}</div>}

        <div ref={endRef} />
      </div>

      {/* Composer */}
      <form onSubmit={(e) => { e.preventDefault(); ask(); }} className="flex gap-2 border-t border-border pt-3">
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={msgs.length ? "Ask a follow-up…" : "Ask something…"} autoFocus />
        <Button type="submit" disabled={loading || !q.trim()}><Send size={15} /></Button>
      </form>
    </div>
  );
}
