import { NextResponse } from "next/server"
import { getSessionFromCookies } from "@/lib/server/auth/session-cookie"
import { createRoomSchema } from "@/lib/server/validation"
import { addRoom } from "@/lib/server/hotel-service"
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

  const parsed = createRoomSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid room payload" }, { status: 400 })
  }

  try {
    await addRoom(s, parsed.data.roomNumber, parsed.data.priceGhs)
    return NextResponse.json({ ok: true }, { status: 201 })
  } catch (e) {
    if (e instanceof ApiError) {
      return NextResponse.json({ error: e.message }, { status: e.status })
    }
    console.error("[rooms]", e)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
