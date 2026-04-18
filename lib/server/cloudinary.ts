import { v2 as cloudinary } from "cloudinary";
import {
  getCloudinaryCloudName,
  getCloudinaryApiKey,
  getCloudinaryApiSecret,
} from "./env";

// Configure Cloudinary with credentials
cloudinary.config({
  cloud_name: getCloudinaryCloudName(),
  api_key: getCloudinaryApiKey(),
  api_secret: getCloudinaryApiSecret(),
});

/**
 * Upload ID photo to Cloudinary
 * @param base64Data Base64 encoded image data (e.g., "data:image/jpeg;base64,...")
 * @param bookingId Booking ID for organizing uploads
 * @returns URL of the uploaded image
 */
export async function uploadIdPhoto(
  base64Data: string,
  bookingId: string,
): Promise<string> {
  try {
    const result = await cloudinary.uploader.upload(base64Data, {
      folder: `hotel/booking-ids/${bookingId}`,
      resource_type: "auto",
      public_id: `id-photo-${Date.now()}`,
      overwrite: false,
    });

    return result.secure_url;
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    throw new Error("Failed to upload ID photo. Please try again.");
  }
}

/**
 * Upload a room image to Cloudinary
 */
export async function uploadRoomImage(
  base64Data: string,
  roomId: string,
): Promise<string> {
  try {
    const result = await cloudinary.uploader.upload(base64Data, {
      folder: `hotel/rooms/${roomId}`,
      resource_type: "auto",
      public_id: `room-${Date.now()}`,
      overwrite: false,
    });
    return result.secure_url;
  } catch (error) {
    console.error("Cloudinary room image upload error:", error);
    throw new Error("Failed to upload room image. Please try again.");
  }
}

/**
 * Delete ID photo from Cloudinary
 * @param publicId Public ID of the image in Cloudinary
 */
export async function deleteIdPhoto(publicId: string): Promise<void> {
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error("Cloudinary delete error:", error);
    // Don't throw - this is non-critical
  }
}
