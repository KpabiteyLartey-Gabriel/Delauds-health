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
      bookingIds?: string[] | string;
      bookingIdsCsv?: string;
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
  const csvBookingIds = payload.data?.metadata?.bookingIdsCsv
    ?.split(",")
    .map((id) => id.trim())
    .filter(Boolean) ?? [];
  const rawBookingIds = payload.data?.metadata?.bookingIds;
  const metadataBookingIds = Array.isArray(rawBookingIds)
    ? rawBookingIds.map((id) => String(id).trim()).filter(Boolean)
    : typeof rawBookingIds === "string"
      ? rawBookingIds
          .split(",")
          .map((id) => id.trim())
          .filter(Boolean)
      : [];
  const singleBookingId = payload.data?.metadata?.bookingId?.trim();
  const targets = csvBookingIds.length > 0
    ? csvBookingIds
    : metadataBookingIds.length > 0
      ? metadataBookingIds
    : singleBookingId
      ? [singleBookingId]
      : [];

  if (!reference || targets.length === 0) {
    return NextResponse.json({ ok: true });
  }

  try {
    await Promise.all(
      targets.map((bookingId) => confirmPaystackBookingPayment(bookingId, reference)),
    );
  } catch (err) {
    console.error("[paystack/webhook]", err);
  }

  return NextResponse.json({ ok: true });
}
