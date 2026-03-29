import { getSessionFromCookies } from "@/lib/server/auth/session-cookie"
import { ApiError } from "@/lib/server/api-error"
import type { SessionPayload } from "@/lib/server/auth/jwt"

export function requireAuth(): SessionPayload {
  const s = getSessionFromCookies()
  if (!s) throw new ApiError(401, "Unauthorized")
  return s
}
