// Per-IP sliding-window rate limit, in-memory.
// Single-instance only — fine for the prototype. If this is ever deployed to
// multiple regions/instances, swap for Vercel KV / Upstash Redis without
// changing the call sites.

const WINDOW_MS = 60_000;
const LIMIT = 15;

const hits = new Map<string, number[]>();
let lastSweep = Date.now();

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  retryAfterMs: number;
};

export function checkRateLimit(ip: string): RateLimitResult {
  const now = Date.now();

  // Periodic GC so the map doesn't grow unbounded under attack.
  if (now - lastSweep > WINDOW_MS) {
    for (const [key, timestamps] of hits) {
      const fresh = timestamps.filter((t) => now - t < WINDOW_MS);
      if (fresh.length === 0) hits.delete(key);
      else hits.set(key, fresh);
    }
    lastSweep = now;
  }

  const fresh = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);

  if (fresh.length >= LIMIT) {
    const oldest = fresh[0];
    return {
      allowed: false,
      remaining: 0,
      retryAfterMs: Math.max(0, WINDOW_MS - (now - oldest))
    };
  }

  fresh.push(now);
  hits.set(ip, fresh);
  return { allowed: true, remaining: LIMIT - fresh.length, retryAfterMs: 0 };
}

export function clientIp(req: Request): string {
  const fwd = req.headers.get('x-forwarded-for');
  if (fwd) return fwd.split(',')[0].trim();
  const real = req.headers.get('x-real-ip');
  if (real) return real.trim();
  return 'unknown';
}
