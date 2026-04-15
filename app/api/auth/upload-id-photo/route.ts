"use server";

import { uploadIdPhoto } from "@/lib/server/cloudinary";

/**
 * Server action to upload ID photo to Cloudinary
 * Validates the base64 data and uploads to Cloudinary
 */
export async function uploadIdPhotoAction(
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
