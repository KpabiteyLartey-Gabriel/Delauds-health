import { NextResponse } from "next/server";
import { confirmPaystackBookingPayment } from "@/lib/server/hotel-service";
import { verifyPaystackTransaction } from "@/lib/server/paystack";

export const dynamic = "force-dynamic";

function redirectWithStatus(
  reqUrl: string,
  path: string,
  status: string,
  message: string,
) {
  const url = new URL(path, reqUrl);
  url.searchParams.set("payment", status);
  url.searchParams.set("message", message);
  return NextResponse.redirect(url);
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const reference = url.searchParams.get("reference")?.trim();
  if (!reference) {
    return redirectWithStatus(
      req.url,
      "/client",
      "failed",
      "Missing payment reference",
    );
  }

  try {
    const tx = await verifyPaystackTransaction(reference);
    if (tx.status !== "success") {
      return redirectWithStatus(
        req.url,
        "/client",
        "failed",
        "Payment not successful",
      );
    }

    const csvBookingIds = tx.metadata?.bookingIdsCsv
      ?.split(",")
      .map((id) => id.trim())
      .filter(Boolean) ?? [];
    const rawBookingIds = tx.metadata?.bookingIds;
    const metadataBookingIds = Array.isArray(rawBookingIds)
      ? rawBookingIds.map((id) => String(id).trim()).filter(Boolean)
      : typeof rawBookingIds === "string"
        ? rawBookingIds
            .split(",")
            .map((id) => id.trim())
            .filter(Boolean)
        : [];
    const singleBookingId = tx.metadata?.bookingId?.trim();
    const targets = csvBookingIds.length > 0
      ? csvBookingIds
      : metadataBookingIds.length > 0
        ? metadataBookingIds
      : singleBookingId
        ? [singleBookingId]
        : [];

    if (targets.length === 0) {
      return redirectWithStatus(
        req.url,
        "/client",
        "failed",
        "Missing booking metadata",
      );
    }

    await Promise.all(
      targets.map((bookingId) => confirmPaystackBookingPayment(bookingId, reference)),
    );
    const msg =
      targets.length > 1
        ? `Payment confirmed for ${targets.length} bookings`
        : "Payment confirmed";
    return redirectWithStatus(req.url, "/client", "success", msg);
  } catch (e) {
    console.error("[paystack/callback]", e);
    return redirectWithStatus(
      req.url,
      "/client",
      "failed",
      "Could not verify payment",
    );
  }
}
