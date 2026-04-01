import jwt from "jsonwebtoken";
import { getJwtSecret } from "@/lib/server/env";
import type { UserRole } from "@/lib/hotel/types";

export type SessionPayload = {
  sub: string;
  email: string;
  role: UserRole;
};

const ISS = "waterhouse-lodge";
const AUD = "waterhouse-lodge-web";

export function signSessionToken(
  payload: SessionPayload,
  maxAgeSec = 60 * 60 * 24 * 7,
): string {
  const secret = getJwtSecret();
  return jwt.sign(
    {
      sub: payload.sub,
      email: payload.email,
      role: payload.role,
    },
    secret,
    {
      algorithm: "HS256",
      expiresIn: maxAgeSec,
      issuer: ISS,
      audience: AUD,
    },
  );
}

export function verifySessionToken(token: string): SessionPayload | null {
  try {
    const secret = getJwtSecret();
    const decoded = jwt.verify(token, secret, {
      algorithms: ["HS256"],
      issuer: ISS,
      audience: AUD,
    }) as jwt.JwtPayload & SessionPayload;
    if (
      typeof decoded.sub !== "string" ||
      typeof decoded.email !== "string" ||
      typeof decoded.role !== "string"
    ) {
      return null;
    }
    const role = decoded.role as UserRole;
    if (!["admin", "receptionist", "client"].includes(role)) return null;
    return { sub: decoded.sub, email: decoded.email, role };
  } catch {
    return null;
  }
}
