import { NextResponse } from "next/server"
import { getSessionFromCookies } from "@/lib/server/auth/session-cookie"
import { patchRoomSchema } from "@/lib/server/validation"
import { deleteRoom, updateRoom } from "@/lib/server/hotel-service"
import { ApiError } from "@/lib/server/api-error"

export const dynamic = "force-dynamic"

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const s = getSessionFromCookies()
  if (!s) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const id = params.id
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 })

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const parsed = patchRoomSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 })
  }
  if (parsed.data.roomNumber === undefined && parsed.data.priceGhs === undefined) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 })
  }

  try {
    await updateRoom(s, id, {
      roomNumber: parsed.data.roomNumber,
      priceGhs: parsed.data.priceGhs,
    })
    return NextResponse.json({ ok: true })
  } catch (e) {
    if (e instanceof ApiError) {
      return NextResponse.json({ error: e.message }, { status: e.status })
    }
    console.error("[rooms/id patch]", e)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const s = getSessionFromCookies()
  if (!s) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const id = params.id
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 })

  try {
    await deleteRoom(s, id)
    return NextResponse.json({ ok: true })
  } catch (e) {
    if (e instanceof ApiError) {
      return NextResponse.json({ error: e.message }, { status: e.status })
    }
    console.error("[rooms/id delete]", e)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
