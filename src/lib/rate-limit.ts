// In-memory rate limiter — one layer of brute-force / abuse protection.
//
// Deliberately dependency-free and process-local: on cPanel/Passenger the app is
// a single long-lived Node process, so a shared Map is an honest first layer
// (defense in depth — not the only control). If the app is ever scaled to
// multiple processes, back this with Redis; the call sites don't change.
//
// Pure logic (no `server-only`, no I/O) so it unit-tests with an injectable clock.

export interface RateLimitResult {
  ok: boolean;
  /** Seconds until the caller may retry (0 when ok). */
  retryAfter: number;
}

interface Bucket {
  count: number;
  windowStart: number;
  blockedUntil: number;
}

const buckets = new Map<string, Bucket>();
let lastSweep = 0;
const STALE_MS = 3_600_000; // drop idle buckets after an hour

function sweep(now: number): void {
  if (now - lastSweep < 60_000) return;
  lastSweep = now;
  for (const [k, b] of buckets) {
    if (b.blockedUntil > now) continue;
    if (now - b.windowStart > STALE_MS) buckets.delete(k);
  }
}

/**
 * Fixed-window limiter with a cooldown. Every call counts; exceeding `limit`
 * within `windowMs` blocks the key for `blockMs` (default: the window). Returns
 * `{ ok: false, retryAfter }` while blocked or over the limit.
 *
 * `now` is injectable purely so tests are deterministic — callers omit it.
 */
export function checkRateLimit(
  key: string,
  opts: { limit: number; windowMs: number; blockMs?: number },
  now: number = Date.now()
): RateLimitResult {
  sweep(now);
  const b = buckets.get(key);

  if (b && b.blockedUntil > now) {
    return { ok: false, retryAfter: Math.ceil((b.blockedUntil - now) / 1000) };
  }
  if (!b || now - b.windowStart >= opts.windowMs) {
    buckets.set(key, { count: 1, windowStart: now, blockedUntil: 0 });
    return { ok: true, retryAfter: 0 };
  }
  b.count += 1;
  if (b.count > opts.limit) {
    b.blockedUntil = now + (opts.blockMs ?? opts.windowMs);
    return { ok: false, retryAfter: Math.ceil((b.blockedUntil - now) / 1000) };
  }
  return { ok: true, retryAfter: 0 };
}

/** Clear a key (e.g. after a successful login) or everything (tests). */
export function resetRateLimit(key?: string): void {
  if (key === undefined) buckets.clear();
  else buckets.delete(key);
}

/** Human retry hint, rounded up to whole minutes/seconds. */
export function retryMessage(retryAfter: number): string {
  if (retryAfter >= 60) {
    const m = Math.ceil(retryAfter / 60);
    return `Too many attempts. Try again in ${m} minute${m === 1 ? "" : "s"}.`;
  }
  return `Too many attempts. Try again in ${Math.max(1, retryAfter)} seconds.`;
}
