// A tiny, dependency-free server-side validation toolkit (master-prompt §18).
// Actions build a cleaned object from raw input; any bad field throws a
// ValidationError with a friendly message, which `validated()` turns into a
// normal { ok:false, error } result. Pure — unit-tested.
//
// This is defense in depth: the DB layer also caps lengths and enum values, but
// validating at the action boundary rejects junk early with a clear message and
// keeps overlong/malformed input from ever reaching a query.

export class ValidationError extends Error {}

export function vString(label: string, raw: unknown, opts: { required?: boolean; min?: number; max?: number } = {}): string {
  const s = typeof raw === "string" ? raw.trim() : raw == null ? "" : String(raw).trim();
  if (!s) {
    if (opts.required) throw new ValidationError(`${label} is required.`);
    return "";
  }
  if (opts.min != null && s.length < opts.min) throw new ValidationError(`${label} is too short.`);
  if (opts.max != null && s.length > opts.max) throw new ValidationError(`${label} is too long (max ${opts.max} characters).`);
  return s;
}

export function vEmail(label: string, raw: unknown, opts: { required?: boolean } = {}): string {
  const s = vString(label, raw, { required: opts.required, max: 190 }).toLowerCase();
  if (s && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(s)) throw new ValidationError(`${label} isn't a valid email address.`);
  return s;
}

export function vInt(label: string, raw: unknown, opts: { required?: boolean; min?: number; max?: number } = {}): number | null {
  if (raw === "" || raw == null) {
    if (opts.required) throw new ValidationError(`${label} is required.`);
    return null;
  }
  const n = Math.trunc(Number(raw));
  if (!Number.isFinite(n)) throw new ValidationError(`${label} must be a number.`);
  if (opts.min != null && n < opts.min) throw new ValidationError(`${label} must be at least ${opts.min}.`);
  if (opts.max != null && n > opts.max) throw new ValidationError(`${label} must be at most ${opts.max}.`);
  return n;
}

/** Allow only a value from the allowlist; fall back if given, else reject. */
export function vEnum<T extends string>(label: string, raw: unknown, allowed: readonly T[], opts: { fallback?: T } = {}): T {
  const s = typeof raw === "string" ? raw : "";
  if ((allowed as readonly string[]).includes(s)) return s as T;
  if (opts.fallback !== undefined) return opts.fallback;
  throw new ValidationError(`${label} is invalid.`);
}

/** Run a builder, converting a ValidationError into a result object. */
export function validated<T>(build: () => T): { ok: true; value: T } | { ok: false; error: string } {
  try {
    return { ok: true, value: build() };
  } catch (e) {
    if (e instanceof ValidationError) return { ok: false, error: e.message };
    throw e;
  }
}
