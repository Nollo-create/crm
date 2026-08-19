// Split an AI email draft into a subject + body so it can prefill the composer.
// The outreach prompt asks for "a Subject line, then a body", so the draft
// usually starts with "Subject: ...". If it doesn't, the whole thing becomes the
// body and the user writes their own subject. Pure + unit-tested.

export function parseOutreachDraft(text: string): { subject: string; body: string } {
  const raw = (text ?? "").replace(/\r\n/g, "\n").trim();
  if (!raw) return { subject: "", body: "" };

  const lines = raw.split("\n");
  let i = 0;
  while (i < lines.length && lines[i].trim() === "") i++; // skip leading blanks

  const first = (lines[i] ?? "").trim();
  const m = first.match(/^subject\s*:\s*(.+)$/i);
  if (m) {
    const subject = m[1].trim();
    const body = lines.slice(i + 1).join("\n").trim();
    return { subject, body };
  }
  return { subject: "", body: raw };
}
