import { NextResponse } from "next/server"
import { getSessionFromCookies } from "@/lib/server/auth/session-cookie"
import { buildHotelState } from "@/lib/server/hotel-service"
import { ApiError } from "@/lib/server/api-error"

export const dynamic = "force-dynamic"

export async function GET() {
  const s = getSessionFromCookies()
  if (!s) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const state = await buildHotelState(s)
    return NextResponse.json({
      session: { userId: s.sub, email: s.email, role: s.role },
      ...state,
    })
  } catch (e) {
    if (e instanceof ApiError) {
      return NextResponse.json({ error: e.message }, { status: e.status })
    }
    console.error("[state]", e)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
