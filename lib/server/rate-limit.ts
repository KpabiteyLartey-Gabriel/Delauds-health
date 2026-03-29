/**
 * Simple in-memory rate limiter — OK for single Node dev server.
 * For serverless multi-instance production, use Redis/Upstash or edge rate limits.
 */
type Bucket = { count: number; resetAt: number }

const loginBuckets = new Map<string, Bucket>()

const LOGIN_MAX = 20
const LOGIN_WINDOW_MS = 15 * 60 * 1000

function prune(key: string, now: number): Bucket {
  const b = loginBuckets.get(key)
  if (!b || now > b.resetAt) {
    const fresh: Bucket = { count: 0, resetAt: now + LOGIN_WINDOW_MS }
    loginBuckets.set(key, fresh)
    return fresh
  }
  return b
}

export function rateLimitLogin(key: string): { ok: true } | { ok: false; retryAfterSec: number } {
  const now = Date.now()
  const b = prune(key, now)
  if (b.count >= LOGIN_MAX) {
    const retryAfterSec = Math.ceil((b.resetAt - now) / 1000)
    return { ok: false, retryAfterSec: Math.max(1, retryAfterSec) }
  }
  b.count += 1
  return { ok: true }
}

export function clientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for")
  if (xff) return xff.split(",")[0]!.trim() || "unknown"
  const realIp = req.headers.get("x-real-ip")
  if (realIp) return realIp.trim()
  return "unknown"
}
