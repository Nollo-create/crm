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

/** One CSV cell: injection-guarded (a leading = + - @ TAB or CR makes Excel /
 *  Sheets evaluate the cell as a formula) then quoted with "" escaping. */
export function csvCell(v: unknown): string {
  let s = v === null || v === undefined ? "" : String(v);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
}

/** Serialize a grid (first row usually the header) to CSV text (CRLF rows). */
export function toCsv(rows: unknown[][]): string {
  return rows.map((r) => r.map(csvCell).join(",")).join("\r\n");
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

/** Generic header auto-mapper: for each field, the best-matching column index
 *  (exact alias first, then substring). Unmatched fields are omitted. */
export function mapHeaders(headers: string[], aliases: Record<string, string[]>): Record<string, number> {
  const norm = headers.map((h) => h.trim().toLowerCase());
  const map: Record<string, number> = {};
  for (const field of Object.keys(aliases)) {
    const al = aliases[field];
    let idx = norm.findIndex((h) => al.includes(h));
    if (idx < 0) idx = norm.findIndex((h) => h.length > 2 && al.some((a) => h.includes(a)));
    if (idx >= 0) map[field] = idx;
  }
  return map;
}

/** Best-guess CSV-column-index for each lead field, from the header row. */
export function autoMapHeaders(headers: string[]): Partial<Record<LeadImportField, number>> {
  return mapHeaders(headers, FIELD_ALIASES) as Partial<Record<LeadImportField, number>>;
}

// ---- Import field sets for the generic CSV importer ------------------------

export interface ImportField {
  key: string;
  label: string;
  required?: boolean;
}

export const COMPANY_IMPORT_FIELDS: ImportField[] = [
  { key: "name", label: "Company name", required: true },
  { key: "industry", label: "Industry" },
  { key: "city", label: "City" },
  { key: "website", label: "Website" },
  { key: "phone", label: "Phone" },
  { key: "email", label: "Email" },
  { key: "country", label: "Country" },
  { key: "vatId", label: "VAT / Tax ID" },
];
export const COMPANY_IMPORT_ALIASES: Record<string, string[]> = {
  name: ["name", "company", "company name", "organization", "organisation", "account", "business"],
  industry: ["industry", "sector", "vertical"],
  city: ["city", "town"],
  website: ["website", "url", "web", "site", "domain"],
  phone: ["phone", "telephone", "tel", "mobile"],
  email: ["email", "e-mail", "mail", "email address"],
  country: ["country"],
  vatId: ["vat", "vat id", "vat number", "tax id", "tax", "pib"],
};

export const CONTACT_IMPORT_FIELDS: ImportField[] = [
  { key: "name", label: "Contact name", required: true },
  { key: "company", label: "Company", required: true },
  { key: "email", label: "Email" },
  { key: "phone", label: "Phone" },
  { key: "title", label: "Title" },
];
export const CONTACT_IMPORT_ALIASES: Record<string, string[]> = {
  name: ["name", "contact name", "full name", "contact", "person"],
  company: ["company", "company name", "organization", "organisation", "account", "business"],
  email: ["email", "e-mail", "mail", "email address"],
  phone: ["phone", "telephone", "tel", "mobile", "cell"],
  title: ["title", "job title", "position", "role"],
};
