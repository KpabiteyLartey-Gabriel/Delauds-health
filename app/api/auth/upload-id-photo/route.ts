import { NextResponse } from "next/server";
import { uploadIdPhoto } from "@/lib/server/cloudinary";

const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
]);

function parseDataUrl(base64Data: string): { mime: string; payload: string } | null {
  const match = /^data:([^;]+);base64,(.+)$/.exec(base64Data);
  if (!match) return null;
  const [, mime, payload] = match;
  return { mime: mime.toLowerCase(), payload };
}

function estimateBase64Bytes(payload: string): number {
  const clean = payload.replace(/\s+/g, "");
  const padding = clean.endsWith("==") ? 2 : clean.endsWith("=") ? 1 : 0;
  return Math.floor((clean.length * 3) / 4) - padding;
}

async function uploadIdPhotoAction(
  base64Data: string,
  bookingId?: string,
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    const parsed = parseDataUrl(base64Data);
    if (!parsed) {
      return { success: false, error: "Invalid image format" };
    }

    if (!ALLOWED_MIME_TYPES.has(parsed.mime)) {
      return {
        success: false,
        error: "Unsupported image type. Use JPG, PNG, WEBP, or HEIC.",
      };
    }

    const estimatedBytes = estimateBase64Bytes(parsed.payload);
    if (estimatedBytes > MAX_IMAGE_BYTES) {
      return {
        success: false,
        error: "Image is too large. Maximum size is 8MB.",
      };
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
