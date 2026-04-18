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

    const bookingId = tx.metadata?.bookingId;
    if (!bookingId) {
      return redirectWithStatus(
        req.url,
        "/client",
        "failed",
        "Missing booking metadata",
      );
    }

    await confirmPaystackBookingPayment(bookingId, reference);
    return redirectWithStatus(req.url, "/client", "success", "Payment confirmed");
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
