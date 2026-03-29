/**
 * Seeds MongoDB with demo users, rooms, and walk-in account.
 * Usage: npm run db:seed   (requires MONGODB_URI in .env or environment)
 */
import "dotenv/config"
import bcrypt from "bcryptjs"
import mongoose from "mongoose"
import { connectDb } from "../lib/mongodb/connect"
import { User, Room, Booking, AuditLog } from "../lib/models"
import { WALKIN_EMAIL } from "../lib/server/constants"

const ROUNDS = 12

async function hash(pw: string) {
  return bcrypt.hash(pw, ROUNDS)
}

async function main() {
  if (!process.env.MONGODB_URI?.trim()) {
    console.error("Set MONGODB_URI in .env or environment (see .env.example).")
    process.exit(1)
  }

  await connectDb()
  console.info("Clearing collections…")
  await Booking.deleteMany({})
  await AuditLog.deleteMany({})
  await Room.deleteMany({})
  await User.deleteMany({})

  console.info("Creating users…")
  const adminHash = await hash("admin123")
  const receptionHash = await hash("reception123")
  const clientHash = await hash("client123")

  await User.create([
    {
      email: "admin@hotel.gh",
      passwordHash: adminHash,
      role: "admin",
      fullName: "System Admin",
    },
    {
      email: "reception@hotel.gh",
      passwordHash: receptionHash,
      role: "receptionist",
      fullName: "Front Desk",
    },
    {
      email: "guest@hotel.gh",
      passwordHash: clientHash,
      role: "client",
      fullName: "Kwame Demo Guest",
      phone: "0240000000",
    },
    {
      email: WALKIN_EMAIL,
      passwordHash: clientHash,
      role: "client",
      fullName: "Walk-in guest (lobby)",
    },
  ])

  console.info("Creating rooms…")
  const prices = [450, 520, 380, 600, 410]
  await Room.insertMany(
    prices.map((priceGhs, i) => ({
      roomNumber: String(100 + i + 1),
      priceGhs,
    })),
  )

  console.info("Done. Demo logins: admin@hotel.gh / admin123, reception@hotel.gh / reception123, guest@hotel.gh / client123")
  await mongoose.disconnect()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
