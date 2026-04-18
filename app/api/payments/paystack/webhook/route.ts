import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { confirmPaystackBookingPayment } from "@/lib/server/hotel-service";

export const dynamic = "force-dynamic";

type PaystackWebhookEvent = {
  event?: string;
  data?: {
    reference?: string;
    metadata?: {
      bookingId?: string;
    };
  };
};

function isValidPaystackSignature(rawBody: string, signature: string) {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret) return false;

  const hash = crypto
    .createHmac("sha512", secret)
    .update(rawBody)
    .digest("hex");

  return hash === signature;
}

export async function POST(req: Request) {
  const rawBody = await req.text();
  const signature = req.headers.get("x-paystack-signature") || "";

  if (!signature || !isValidPaystackSignature(rawBody, signature)) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  let payload: PaystackWebhookEvent;
  try {
    payload = JSON.parse(rawBody) as PaystackWebhookEvent;
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  if (payload.event !== "charge.success") {
    return NextResponse.json({ ok: true });
  }

  const reference = payload.data?.reference?.trim();
  const bookingId = payload.data?.metadata?.bookingId?.trim();

  if (!reference || !bookingId) {
    return NextResponse.json({ ok: true });
  }

  try {
    await confirmPaystackBookingPayment(bookingId, reference);
  } catch (err) {
    console.error("[paystack/webhook]", err);
  }

  return NextResponse.json({ ok: true });
}
