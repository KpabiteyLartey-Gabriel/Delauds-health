import { NextResponse } from "next/server";
import { uploadIdPhoto } from "@/lib/server/cloudinary";

async function uploadIdPhotoAction(
  base64Data: string,
  bookingId?: string,
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    // Validate base64 data format
    if (!base64Data.startsWith("data:image/")) {
      return { success: false, error: "Invalid image format" };
    }

    // Use temporary ID if booking not yet created
    const tempBookingId = bookingId || `temp-${Date.now()}`;

    // Upload to Cloudinary
    const url = await uploadIdPhoto(base64Data, tempBookingId);

    return { success: true, url };
  } catch (error) {
    console.error("ID photo upload error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to upload photo",
    };
  }
}

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid JSON body" }, { status: 400 });
  }

  const base64Data =
    typeof (body as { base64Data?: unknown })?.base64Data === "string"
      ? (body as { base64Data: string }).base64Data
      : "";
  const bookingId =
    typeof (body as { bookingId?: unknown })?.bookingId === "string"
      ? (body as { bookingId: string }).bookingId
      : undefined;

  if (!base64Data) {
    return NextResponse.json({ success: false, error: "base64Data is required" }, { status: 400 });
  }

  const result = await uploadIdPhotoAction(base64Data, bookingId);
  return NextResponse.json(result, { status: result.success ? 200 : 400 });
}
