import { NextResponse } from "next/server"
import { registerSchema } from "@/lib/server/validation"
import { hashPassword } from "@/lib/server/auth/password"
import { setSessionCookie } from "@/lib/server/auth/session-cookie"
import { registerClientUser, recordAudit } from "@/lib/server/hotel-service"
import { ApiError } from "@/lib/server/api-error"
import type { SessionPayload } from "@/lib/server/auth/jwt"
import type { UserRole } from "@/lib/hotel/types"

export const dynamic = "force-dynamic"

export async function POST(req: Request) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const parsed = registerSchema.safeParse(body)
  if (!parsed.success) {
    const msg = parsed.error.flatten().fieldErrors
    const first = Object.values(msg)[0]?.[0] ?? "Invalid input"
    return NextResponse.json({ error: first }, { status: 400 })
  }

  try {
    const passwordHash = await hashPassword(parsed.data.password)
    const doc = await registerClientUser({
      email: parsed.data.email,
      passwordHash,
      fullName: parsed.data.fullName,
      phone: parsed.data.phone,
    })

    const payload: SessionPayload = {
      sub: doc._id.toString(),
      email: doc.email,
      role: doc.role as UserRole,
    }
    const res = NextResponse.json({ ok: true }, { status: 201 })
    setSessionCookie(res, payload)

    try {
      await recordAudit(payload, "register", `New guest account ${doc.email}`)
    } catch {
      /* non-fatal */
    }

    return res
  } catch (e) {
    if (e instanceof ApiError) {
      return NextResponse.json({ error: e.message }, { status: e.status })
    }
    console.error("[auth/register]", e)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
