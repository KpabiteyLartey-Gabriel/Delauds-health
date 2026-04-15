import { NextResponse } from "next/server"
import { getSessionFromCookies } from "@/lib/server/auth/session-cookie"
import { buildHotelState } from "@/lib/server/hotel-service"
import { ApiError } from "@/lib/server/api-error"

export const dynamic = "force-dynamic"

const anonymousState = {
  session: null as const,
  profile: undefined,
  users: [],
  rooms: [],
  bookings: [],
  auditLog: [],
  occupancy: [],
  walkInClientId: undefined as string | undefined,
  storeItems: [],
  supplyRequests: [],
}

export async function GET() {
  const s = getSessionFromCookies()
  if (!s) {
    return NextResponse.json(anonymousState)
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
