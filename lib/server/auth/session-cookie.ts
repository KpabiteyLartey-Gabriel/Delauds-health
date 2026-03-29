import type { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { SESSION_COOKIE } from "@/lib/server/constants"
import { verifySessionToken, signSessionToken, type SessionPayload } from "@/lib/server/auth/jwt"

const COOKIE_MAX_AGE_SEC = 60 * 60 * 24 * 7

export function setSessionCookie(res: NextResponse, payload: SessionPayload): void {
  const token = signSessionToken(payload, COOKIE_MAX_AGE_SEC)
  const secure = process.env.NODE_ENV === "production"
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: COOKIE_MAX_AGE_SEC,
  })
}

export function clearSessionCookie(res: NextResponse): void {
  const secure = process.env.NODE_ENV === "production"
  res.cookies.set(SESSION_COOKIE, "", {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  })
}

export function getSessionFromCookies(): SessionPayload | null {
  const raw = cookies().get(SESSION_COOKIE)?.value
  if (!raw) return null
  return verifySessionToken(raw)
}
