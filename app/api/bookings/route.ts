import { NextResponse } from "next/server"
import { getSessionFromCookies } from "@/lib/server/auth/session-cookie"
import { createBookingSchema } from "@/lib/server/validation"
import { createBooking } from "@/lib/server/hotel-service"
import {
  getPaystackCallbackUrl,
  initializePaystackTransaction,
} from "@/lib/server/paystack"
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
    const requestedRoomIds = parsed.data.roomIds?.length
      ? parsed.data.roomIds
      : parsed.data.roomId
        ? [parsed.data.roomId]
        : []

    if (requestedRoomIds.length === 0) {
      return NextResponse.json({ error: "roomId or roomIds is required" }, { status: 400 })
    }

    const roomIds = [...new Set(requestedRoomIds)]

    const createdList = [] as Array<{
      bookingId: string
      amountKobo: number
      paymentMethod: string
      requiresOnlinePayment: boolean
    }>

    for (const roomId of roomIds) {
      const created = await createBooking(s, {
        roomId,
        clientUserId: parsed.data.clientUserId,
        checkInDate: parsed.data.checkInDate,
        checkOutDate: parsed.data.checkOutDate,
        guestDetails: parsed.data.guestDetails,
      })
      createdList.push(created)
    }

    const firstCreated = createdList[0]
    if (!firstCreated) {
      return NextResponse.json({ error: "No rooms selected" }, { status: 400 })
    }

    if (!firstCreated.requiresOnlinePayment) {
      return NextResponse.json(
        {
          ok: true,
          bookingId: firstCreated.bookingId,
          bookingIds: createdList.map((b) => b.bookingId),
          status: "pending_payment",
          paymentMethod: firstCreated.paymentMethod,
        },
        { status: 201 },
      )
    }

    const totalAmountKobo = createdList.reduce((sum, b) => sum + b.amountKobo, 0)
    const reference =
      createdList.length > 1
        ? `WB_MULTI_${Date.now()}`
        : `WB_${firstCreated.bookingId}_${Date.now()}`
    const payment = await initializePaystackTransaction({
      email: parsed.data.guestDetails.email,
      amountKobo: totalAmountKobo,
      reference,
      callbackUrl: getPaystackCallbackUrl(),
      metadata: {
        bookingId: firstCreated.bookingId,
        bookingIds: createdList.map((b) => b.bookingId),
        bookingIdsCsv: createdList.map((b) => b.bookingId).join(","),
        roomIds,
        clientUserId: parsed.data.clientUserId,
        paymentMethod: parsed.data.guestDetails.paymentMethod,
      },
    })

    return NextResponse.json(
      {
        ok: true,
        bookingId: firstCreated.bookingId,
        bookingIds: createdList.map((b) => b.bookingId),
        status: "pending_payment",
        paymentMethod: firstCreated.paymentMethod,
        paystackAuthorizationUrl: payment.authorization_url,
        paystackReference: payment.reference,
      },
      { status: 201 },
    )
  } catch (e) {
    if (e instanceof ApiError) {
      return NextResponse.json({ error: e.message }, { status: e.status })
    }
    if (e instanceof Error) {
      return NextResponse.json(
        { error: `Payment setup failed: ${e.message}` },
        { status: 502 },
      )
    }
    console.error("[bookings]", e)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
