/**
 * Central env reads. Throws at runtime when DB/JWT used without configuration.
 */
export function getMongoUri(): string {
  const uri = process.env.MONGODB_URI?.trim()
  if (!uri) {
    throw new Error("MONGODB_URI is not set. Add it to .env.local (see .env.example).")
  }
  return uri
}

export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET
  if (secret && secret.length >= 32) return secret
  if (process.env.NODE_ENV === "production") {
    throw new Error("JWT_SECRET must be set and at least 32 characters in production.")
  }
  console.warn(
    "[hotel] JWT_SECRET missing or short — using insecure dev default. Set JWT_SECRET in .env.local.",
  )
  return "dev-insecure-secret-do-not-use-in-prod-32"
}
