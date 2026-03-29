import { NextResponse } from "next/server"
import mongoose from "mongoose"
import { connectDb } from "@/lib/mongodb/connect"
import { User } from "@/lib/models"
import { getSessionFromCookies } from "@/lib/server/auth/session-cookie"

export const dynamic = "force-dynamic"

export async function GET() {
  const s = getSessionFromCookies()
  if (!s) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  if (!mongoose.isValidObjectId(s.sub)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  await connectDb()
  const u = await User.findById(s.sub)
    .select({ email: 1, role: 1, fullName: 1, phone: 1 })
    .lean()

  if (!u) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  return NextResponse.json({
    user: {
      id: u._id.toString(),
      email: u.email,
      role: u.role,
      fullName: u.fullName,
      phone: u.phone ?? undefined,
    },
    session: { userId: s.sub, email: s.email, role: s.role },
  })
}
