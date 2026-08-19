"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Mails, Loader2, Send, X, UserPlus, ShieldAlert, Eye } from "lucide-react";
import { bulkSendEmailAction, emailComposeStatusAction, listEmailTemplatesAction, type EmailTemplateView, type BulkRecipient } from "@/lib/actions/email";
import { searchContactsAction, type ContactHit } from "@/lib/actions/crm";
import { applyTemplate, templateVars, BULK_MAX } from "@/lib/crm/email-template";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { useCanWrite } from "@/components/crm/role-context";

type Recipient = BulkRecipient & { name: string; company: string };

export function BulkEmail() {
  const { toast } = useToast();
  const canWrite = useCanWrite();
  const [status, setStatus] = useState<{ available: boolean; from: string } | null>(null);
  const [templates, setTemplates] = useState<EmailTemplateView[]>([]);
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ContactHit[]>([]);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [track, setTrack] = useState(true);
  const [preview, setPreview] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    emailComposeStatusAction().then(setStatus).catch(() => setStatus({ available: false, from: "" }));
    listEmailTemplatesAction().then(setTemplates).catch(() => setTemplates([]));
  }, []);

  useEffect(() => {
    const s = query.trim();
    if (!s) { setResults([]); return; }
    const t = setTimeout(async () => setResults(await searchContactsAction(s).catch(() => [])), 200);
    return () => clearTimeout(t);
  }, [query]);

  function add(c: ContactHit) {
    setRecipients((prev) => (prev.some((r) => r.email.toLowerCase() === c.email.toLowerCase()) ? prev : [...prev, { email: c.email, name: c.name, company: c.companyName, contactId: c.id, companyId: c.companyId }]));
    setQuery("");
    setResults([]);
  }
  const remove = (email: string) => setRecipients((prev) => prev.filter((r) => r.email !== email));

  function useTemplate(id: string) {
    const t = templates.find((x) => String(x.id) === id);
    if (t) { setSubject(t.subject); setBody(t.body); }
  }

  async function send() {
    if (recipients.length === 0) return toast("Add at least one recipient.", { tone: "error" });
    if (typeof window !== "undefined" && !window.confirm(`Send this email to ${recipients.length} recipient${recipients.length === 1 ? "" : "s"}?`)) return;
    setBusy(true);
    const r = await bulkSendEmailAction({ recipients, subject, body, track });
    setBusy(false);
    if (r.error) return toast(r.error, { tone: "error" });
    toast(`Sent ${r.sent}${r.failed ? ` · ${r.failed} failed` : ""}`, { tone: r.failed ? "error" : "success" });
    if (r.sent) { setRecipients([]); setSubject(""); setBody(""); }
  }

  const first = recipients[0];
  const vars = templateVars({ name: first?.name, company: first?.company });
  const capped = recipients.length >= BULK_MAX;

  if (status && !status.available) {
    return (
      <div className="max-w-2xl space-y-3">
        <h1 className="flex items-center gap-2 text-xl font-semibold tracking-tight"><Mails size={18} className="text-electric" /> Bulk email</h1>
        <Card className="flex items-start gap-2 border-warning/40 bg-warning/5 p-4 text-sm text-muted-foreground">
          <ShieldAlert size={16} className="mt-0.5 shrink-0 text-warning" />
          <span>No active mailbox yet. An owner can connect one in <Link href="/settings/email" className="text-electric hover:underline">Settings → Email</Link>.</span>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-4">
      <div>
        <h1 className="flex items-center gap-2 text-xl font-semibold tracking-tight"><Mails size={18} className="text-electric" /> Bulk email</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">Send a personalized copy to several contacts at once. Each is tracked and logged. Up to {BULK_MAX} per send.</p>
      </div>

      {/* Recipients */}
      <Card className="space-y-2 p-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold">Recipients {recipients.length > 0 && <span className="text-2xs font-normal text-muted-foreground">({recipients.length})</span>}</p>
          {recipients.length > 0 && <button onClick={() => setRecipients([])} className="text-2xs text-muted-foreground hover:text-danger">Clear all</button>}
        </div>
        <div className="relative">
          <div className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"><UserPlus size={14} /></div>
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={capped ? `Limit of ${BULK_MAX} reached` : "Search contacts to add…"} className="pl-8" disabled={capped} />
          {results.length > 0 && (
            <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-lg border border-border bg-popover shadow-pop">
              {results.map((c) => (
                <button key={c.id} onClick={() => add(c)} className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm hover:bg-secondary">
                  <span className="min-w-0"><span className="block truncate font-medium">{c.name || c.email}</span><span className="block truncate text-2xs text-muted-foreground">{c.email}{c.companyName ? ` · ${c.companyName}` : ""}</span></span>
                </button>
              ))}
            </div>
          )}
        </div>
        {recipients.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {recipients.map((r) => (
              <span key={r.email} className="inline-flex items-center gap-1 rounded-full border border-border bg-secondary/50 py-1 pl-2.5 pr-1 text-2xs">
                {r.name || r.email}
                <button onClick={() => remove(r.email)} className="grid h-4 w-4 place-items-center rounded-full text-muted-foreground hover:text-danger"><X size={11} /></button>
              </span>
            ))}
          </div>
        )}
      </Card>

      {/* Message */}
      <Card className="space-y-3 p-4">
        {templates.length > 0 && (
          <label className="block text-2xs uppercase tracking-wide text-muted-foreground">
            Start from a template
            <Select defaultValue="" onChange={(e) => { useTemplate(e.target.value); e.target.value = ""; }} className="mt-1 h-9">
              <option value="">— none —</option>
              {templates.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </Select>
          </label>
        )}
        <label className="block text-2xs uppercase tracking-wide text-muted-foreground">
          Subject
          <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Quick idea for {{company}}" className="mt-1" />
        </label>
        <label className="block text-2xs uppercase tracking-wide text-muted-foreground">
          Message
          <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={8} placeholder={"Hi {{first_name}},\n\n…"} className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-electric" />
        </label>
        <p className="text-[10px] text-muted-foreground">Placeholders <code>{"{{name}}"}</code> <code>{"{{first_name}}"}</code> <code>{"{{company}}"}</code> are filled in per recipient.</p>

        {preview && first && (
          <div className="rounded-lg border border-border bg-secondary/30 p-3 text-2xs">
            <p className="mb-1 font-medium text-muted-foreground">Preview for {first.name || first.email}:</p>
            <p className="font-semibold">{applyTemplate(subject, vars) || "(no subject)"}</p>
            <p className="mt-1 whitespace-pre-wrap text-muted-foreground">{applyTemplate(body, vars)}</p>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3">
          <div className="flex items-center gap-3">
            <label className="flex cursor-pointer items-center gap-1.5 text-2xs text-muted-foreground">
              <input type="checkbox" checked={track} onChange={(e) => setTrack(e.target.checked)} className="h-3.5 w-3.5 accent-electric" /> Track opens
            </label>
            {first && <button onClick={() => setPreview((v) => !v)} className="inline-flex items-center gap-1 text-2xs text-muted-foreground hover:text-foreground"><Eye size={12} /> {preview ? "Hide" : "Preview"}</button>}
          </div>
          <Button size="sm" onClick={send} disabled={!canWrite || busy || recipients.length === 0 || !subject.trim() || !body.trim()}>
            {busy ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />} Send to {recipients.length || ""}
          </Button>
        </div>
      </Card>

      <p className="text-[10px] text-muted-foreground">Tip: providers cap daily volume (Gmail ~500/day, Workspace ~2,000). Keep batches sensible and warm — this is for your contacts, not cold lists.</p>
    </div>
  );
}
