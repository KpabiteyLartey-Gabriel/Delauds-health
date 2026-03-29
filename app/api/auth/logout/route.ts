import { NextResponse } from "next/server"
import { clearSessionCookie } from "@/lib/server/auth/session-cookie"

export const dynamic = "force-dynamic"

export async function POST() {
  const res = NextResponse.json({ ok: true })
  clearSessionCookie(res)
  return res
}
