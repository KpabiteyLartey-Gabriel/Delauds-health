import { NextResponse } from "next/server"
import { getSessionFromCookies } from "@/lib/server/auth/session-cookie"
import { guestRegisterCsv } from "@/lib/server/hotel-service"
import { ApiError } from "@/lib/server/api-error"
import { todayISO } from "@/lib/hotel/dates"

export const dynamic = "force-dynamic"

export async function GET() {
  const s = getSessionFromCookies()
  if (!s) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  if (s.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  try {
    const csv = await guestRegisterCsv()
    const filename = `guest-register-${todayISO()}.csv`
    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    })
  } catch (e) {
    if (e instanceof ApiError) {
      return NextResponse.json({ error: e.message }, { status: e.status })
    }
    console.error("[export]", e)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
