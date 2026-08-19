// Duplicate-company detection — pure functions so the matching rules are unit
// tested and identical on the server. A "group" is a set of company ids that
// collide on the same normalized signal (VAT id, web/email domain, or name).

export interface DedupeCompany {
  id: number;
  name: string;
  website: string;
  email: string;
  vatId: string;
}

export type DuplicateReason = "vat" | "domain" | "name";

export interface DuplicateGroup {
  reason: DuplicateReason;
  value: string;
  ids: number[];
}

// Common legal-form suffixes (Serbian + international) that shouldn't stop two
// records for the same firm from matching.
const LEGAL =
  /\b(d\s*o\s*o|llc|inc|incorporated|ltd|limited|gmbh|corp|corporation|co|company|kg|ag|sa|srl|bv|oy|ab|kd)\b/g;

/** Lowercase, strip legal suffixes + all punctuation/whitespace. "Acme d.o.o."
 *  and "ACME, LLC" both collapse to "acme". */
export function normalizeCompanyName(name: string): string {
  return (name || "")
    .toLowerCase()
    .replace(/[._,&/-]+/g, " ")
    .replace(LEGAL, " ")
    .replace(/[^a-z0-9]+/g, "");
}

/** Bare host from a URL or email address: no scheme, no `www.`, no path. */
export function normalizeDomain(value: string): string {
  let v = (value || "").toLowerCase().trim();
  if (!v) return "";
  if (v.includes("@")) v = v.split("@").pop() || "";
  v = v.replace(/^https?:\/\//, "").replace(/^www\./, "");
  v = v.split(/[/?#]/)[0] || "";
  return v.replace(/[^a-z0-9.-]/g, "");
}

function push(map: Map<string, number[]>, key: string, id: number): void {
  const arr = map.get(key);
  if (arr) arr.push(id);
  else map.set(key, [id]);
}

/** Find groups of companies that look like duplicates. A pair is reported once,
 *  under its strongest reason (vat > domain > name). */
export function findDuplicateGroups(companies: DedupeCompany[]): DuplicateGroup[] {
  const byVat = new Map<string, number[]>();
  const byDomain = new Map<string, number[]>();
  const byName = new Map<string, number[]>();

  for (const c of companies) {
    const v = (c.vatId || "").replace(/[^a-z0-9]/gi, "").toLowerCase();
    if (v.length >= 5) push(byVat, v, c.id);
    const d = normalizeDomain(c.website) || normalizeDomain(c.email);
    if (d && d.includes(".")) push(byDomain, d, c.id);
    const n = normalizeCompanyName(c.name);
    if (n.length >= 3) push(byName, n, c.id);
  }

  const groups: DuplicateGroup[] = [];
  const seen = new Set<string>(); // exact id-set signatures already emitted

  const collect = (map: Map<string, number[]>, reason: DuplicateReason) => {
    for (const [value, ids] of map) {
      if (ids.length < 2) continue;
      const sig = [...ids].sort((a, b) => a - b).join(",");
      if (seen.has(sig)) continue;
      seen.add(sig);
      groups.push({ reason, value, ids: [...ids].sort((a, b) => a - b) });
    }
  };

  collect(byVat, "vat");
  collect(byDomain, "domain");
  collect(byName, "name");
  return groups;
}
