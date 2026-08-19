// Substitute {{placeholder}} tokens in an email template with recipient values.
// Known placeholders: name, first_name, company (case-insensitive, spaces ok:
// "{{ Company }}"). Unknown or missing values render as empty so a template never
// sends literal "{{foo}}" text. Pure + unit-tested.

export const TEMPLATE_VARS = ["name", "first_name", "company"] as const;

/** Max recipients per bulk/mail-merge send (enforced server-side too). */
export const BULK_MAX = 50;

export function applyTemplate(text: string, vars: Record<string, string>): string {
  return (text ?? "").replace(/\{\{\s*([a-z0-9_]+)\s*\}\}/gi, (_m, key: string) => {
    const v = vars[key.toLowerCase()];
    return typeof v === "string" ? v : "";
  });
}

/** Build the variable map for a recipient. `first_name` derives from `name`. */
export function templateVars(opts: { name?: string; company?: string }): Record<string, string> {
  const name = (opts.name ?? "").trim();
  return {
    name,
    first_name: name.split(/\s+/)[0] ?? "",
    company: (opts.company ?? "").trim(),
  };
}
