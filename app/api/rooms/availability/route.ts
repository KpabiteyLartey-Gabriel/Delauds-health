import { NextResponse } from "next/server"
import { getPublicRoomAvailabilitySummary } from "@/lib/server/hotel-service"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const summary = await getPublicRoomAvailabilitySummary()
    return NextResponse.json(summary)
  } catch (e) {
    console.error("[rooms/availability]", e)
    return NextResponse.json(
      { error: "Could not load availability" },
      { status: 503 },
    )
  }
}
