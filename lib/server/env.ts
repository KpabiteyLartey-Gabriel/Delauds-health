/**
 * Central env reads. Throws at runtime when DB/JWT used without configuration.
 */
export function getMongoUri(): string {
  const uri = process.env.MONGODB_URI?.trim();
  if (!uri) {
    throw new Error(
      "MONGODB_URI is not set. Add it to .env.local (see .env.example).",
    );
  }
  return uri;
}

export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (secret && secret.length >= 32) return secret;
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "JWT_SECRET must be set and at least 32 characters in production.",
    );
  }
  console.warn(
    "[hotel] JWT_SECRET missing or short — using insecure dev default. Set JWT_SECRET in .env.local.",
  );
  return "dev-insecure-secret-do-not-use-in-prod-32";
}

export function getCloudinaryCloudName(): string {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME?.trim();
  if (!cloudName) {
    throw new Error(
      "NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME is not set. Add it to .env.local",
    );
  }
  return cloudName;
}

export function getCloudinaryApiKey(): string {
  const apiKey = process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY?.trim();
  if (!apiKey) {
    throw new Error(
      "NEXT_PUBLIC_CLOUDINARY_API_KEY is not set. Add it to .env.local",
    );
  }
  return apiKey;
}

export function getCloudinaryApiSecret(): string {
  const apiSecret = process.env.CLOUDINARY_API_SECRET?.trim();
  if (!apiSecret) {
    throw new Error(
      "CLOUDINARY_API_SECRET is not set. Add it to .env.local (server-side only)",
    );
  }
  return apiSecret;
}
