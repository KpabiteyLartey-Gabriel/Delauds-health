import { NextResponse } from "next/server"
import { loginSchema } from "@/lib/server/validation"
import { findUserByEmailForLogin, recordAudit } from "@/lib/server/hotel-service"
import { verifyPassword } from "@/lib/server/auth/password"
import { setSessionCookie } from "@/lib/server/auth/session-cookie"
import { rateLimitLogin, clientIp } from "@/lib/server/rate-limit"
import { ApiError } from "@/lib/server/api-error"
import type { SessionPayload } from "@/lib/server/auth/jwt"
import type { UserRole } from "@/lib/hotel/types"

export const dynamic = "force-dynamic"

export async function POST(req: Request) {
  const ip = clientIp(req)
  const limited = rateLimitLogin(`login:${ip}`)
  if (!limited.ok) {
    return NextResponse.json(
      { error: "Too many login attempts. Try again later." },
      { status: 429, headers: { "Retry-After": String(limited.retryAfterSec) } },
    )
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const parsed = loginSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid email or password." }, { status: 400 })
  }

  const email = parsed.data.email
  const password = parsed.data.password

  try {
    const user = await findUserByEmailForLogin(email)
    if (!user || !user.passwordHash) {
      return NextResponse.json({ error: "Invalid email or password." }, { status: 401 })
    }
    const ok = await verifyPassword(password, user.passwordHash as string)
    if (!ok) {
      return NextResponse.json({ error: "Invalid email or password." }, { status: 401 })
    }

    const payload: SessionPayload = {
      sub: user._id.toString(),
      email: user.email,
      role: user.role as UserRole,
    }

    const res = NextResponse.json({ ok: true, role: payload.role })
    setSessionCookie(res, payload)

    try {
      await recordAudit(payload, "login", `${payload.role} login`)
    } catch {
      /* audit failure should not block login */
    }

    return res
  } catch (e) {
    if (e instanceof ApiError) {
      return NextResponse.json({ error: e.message }, { status: e.status })
    }
    console.error("[auth/login]", e)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
