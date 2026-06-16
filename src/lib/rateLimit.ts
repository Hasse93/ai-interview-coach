/**
 * Lightweight in-memory sliding-window rate limiter.
 *
 * Good enough to protect AI quota and curb abuse on a single instance / local
 * dev. NOTE: serverless runs many instances, so for real distributed limits in
 * production swap this for Upstash Redis (@upstash/ratelimit) — same call site.
 */
const buckets = new Map<string, number[]>();

export function rateLimit(
  key: string,
  limit = 20,
  windowMs = 10_000,
): { ok: boolean; retryAfter: number } {
  const now = Date.now();
  const hits = (buckets.get(key) ?? []).filter((t) => now - t < windowMs);
  if (hits.length >= limit) {
    return { ok: false, retryAfter: Math.ceil((windowMs - (now - hits[0])) / 1000) };
  }
  hits.push(now);
  buckets.set(key, hits);
  return { ok: true, retryAfter: 0 };
}

/** Best-effort client identity from proxy headers (falls back to a constant). */
export function clientKey(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  return fwd?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "local";
}

/** Convenience: returns a 429 Response when over the limit, else null. */
export function rateLimited(req: Request, limit?: number): Response | null {
  const { ok, retryAfter } = rateLimit(clientKey(req), limit);
  if (ok) return null;
  return new Response(
    JSON.stringify({ error: "Too many requests — please slow down a moment." }),
    { status: 429, headers: { "content-type": "application/json", "retry-after": String(retryAfter) } },
  );
}
