// Pure CSV parsing + column auto-mapping for the lead importer. No deps; RFC-4180
// enough for real exports (quoted fields, embedded commas/newlines, "" escapes,
// CRLF). The parse↔shape logic is unit-tested — a silent import bug is expensive.

/** Parse CSV text into a grid of cells. Trailing blank line is dropped. */
export function parseCsv(text: string): string[][] {
  const s = String(text ?? "").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;
  let i = 0;
  while (i < s.length) {
    const ch = s[i];
    if (inQuotes) {
      if (ch === '"') {
        if (s[i + 1] === '"') { cell += '"'; i += 2; continue; }
        inQuotes = false; i++; continue;
      }
      cell += ch; i++; continue;
    }
    if (ch === '"') { inQuotes = true; i++; continue; }
    if (ch === ",") { row.push(cell); cell = ""; i++; continue; }
    if (ch === "\n") { row.push(cell); rows.push(row); row = []; cell = ""; i++; continue; }
    cell += ch; i++;
  }
  row.push(cell);
  rows.push(row);
  // Drop a trailing empty row produced by a final newline.
  return rows.filter((r, idx) => !(idx === rows.length - 1 && r.length === 1 && r[0] === ""));
}

/** The lead fields an import can fill (maps onto LeadInputDTO). */
export const LEAD_IMPORT_FIELDS = [
  { key: "name", label: "Contact name" },
  { key: "company", label: "Company" },
  { key: "email", label: "Email" },
  { key: "phone", label: "Phone" },
  { key: "title", label: "Title" },
  { key: "website", label: "Website" },
  { key: "industry", label: "Industry" },
] as const;

export type LeadImportField = (typeof LEAD_IMPORT_FIELDS)[number]["key"];

const FIELD_ALIASES: Record<LeadImportField, string[]> = {
  name: ["name", "contact name", "full name", "contact", "person", "lead"],
  company: ["company", "organization", "organisation", "account", "business", "employer"],
  email: ["email", "e-mail", "mail", "email address"],
  phone: ["phone", "telephone", "tel", "mobile", "phone number", "cell"],
  title: ["title", "job title", "position", "role"],
  website: ["website", "url", "web", "site", "domain", "web site"],
  industry: ["industry", "sector", "vertical"],
};

/** Best-guess CSV-column-index for each lead field, from the header row. Returns
 *  a partial map (field -> column index); unmatched fields are omitted. */
export function autoMapHeaders(headers: string[]): Partial<Record<LeadImportField, number>> {
  const norm = headers.map((h) => h.trim().toLowerCase());
  const map: Partial<Record<LeadImportField, number>> = {};
  for (const field of Object.keys(FIELD_ALIASES) as LeadImportField[]) {
    const aliases = FIELD_ALIASES[field];
    let idx = norm.findIndex((h) => aliases.includes(h));
    if (idx < 0) idx = norm.findIndex((h) => h.length > 2 && aliases.some((a) => h.includes(a)));
    if (idx >= 0) map[field] = idx;
  }
  return map;
}
