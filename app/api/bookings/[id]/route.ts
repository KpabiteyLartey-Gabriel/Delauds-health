import { NextResponse } from "next/server"
import { getSessionFromCookies } from "@/lib/server/auth/session-cookie"
import {
  cancelBooking,
  checkInBooking,
  checkOutBooking,
  confirmPendingCashBooking,
  resendCashPaymentEmails,
} from "@/lib/server/hotel-service"
import { ApiError } from "@/lib/server/api-error"
import { z } from "zod"

export const dynamic = "force-dynamic"

const patchSchema = z.object({
  action: z.enum(["cancel", "check_in", "check_out", "confirm_payment", "resend_cash_email"]),
  cashAmountGhs: z.number().positive().optional(),
})

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
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

  const parsed = patchSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  }

  const id = params.id
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 })

  try {
    if (parsed.data.action === "cancel") {
      await cancelBooking(s, id)
    } else if (parsed.data.action === "check_in") {
      await checkInBooking(s, id)
    } else if (parsed.data.action === "confirm_payment") {
      if (parsed.data.cashAmountGhs === undefined) {
        return NextResponse.json(
          { error: "cashAmountGhs is required for cash payment confirmation" },
          { status: 400 },
        )
      }
      await confirmPendingCashBooking(s, id, parsed.data.cashAmountGhs)
    } else if (parsed.data.action === "resend_cash_email") {
      await resendCashPaymentEmails(s, id)
    } else {
      await checkOutBooking(s, id)
    }
    return NextResponse.json({ ok: true })
  } catch (e) {
    if (e instanceof ApiError) {
      return NextResponse.json({ error: e.message }, { status: e.status })
    }
    console.error("[bookings/id]", e)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
