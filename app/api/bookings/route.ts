import { NextResponse } from "next/server"
import { getSessionFromCookies } from "@/lib/server/auth/session-cookie"
import { createBookingSchema } from "@/lib/server/validation"
import { createBooking } from "@/lib/server/hotel-service"
import { ApiError } from "@/lib/server/api-error"

export const dynamic = "force-dynamic"

export async function POST(req: Request) {
  const s = getSessionFromCookies()
  if (!s) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const parsed = createBookingSchema.safeParse(body)
  if (!parsed.success) {
    const msg = parsed.error.flatten().fieldErrors
    const first = Object.values(msg)[0]?.[0] ?? "Invalid input"
    return NextResponse.json({ error: first }, { status: 400 })
  }

  try {
    await createBooking(s, {
      roomId: parsed.data.roomId,
      clientUserId: parsed.data.clientUserId,
      checkInDate: parsed.data.checkInDate,
      checkOutDate: parsed.data.checkOutDate,
      guestDetails: parsed.data.guestDetails,
    })
    return NextResponse.json({ ok: true }, { status: 201 })
  } catch (e) {
    if (e instanceof ApiError) {
      return NextResponse.json({ error: e.message }, { status: e.status })
    }
    console.error("[bookings]", e)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
