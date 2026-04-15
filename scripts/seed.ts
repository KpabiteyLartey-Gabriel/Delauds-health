/**
 * Seeds MongoDB with demo users, rooms, and walk-in account.
 * Usage: npm run db:seed   (requires MONGODB_URI in .env or environment)
 */
import "dotenv/config";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { connectDb } from "../lib/mongodb/connect";
import { User, Room, Booking, AuditLog } from "../lib/models";
import { WALKIN_EMAIL } from "../lib/server/constants";

const ROUNDS = 12;

async function hash(pw: string) {
  return bcrypt.hash(pw, ROUNDS);
}

async function main() {
  if (!process.env.MONGODB_URI?.trim()) {
    console.error("Set MONGODB_URI in .env or environment (see .env.example).");
    process.exit(1);
  }

  await connectDb();
  console.info("Clearing collections…");
  await Booking.deleteMany({});
  await AuditLog.deleteMany({});
  await Room.deleteMany({});
  await User.deleteMany({});

  console.info("Dropping stale indexes…");
  try {
    await User.collection.dropIndexes();
  } catch {
    /* collection may not exist yet — safe to ignore */
  }

  console.info("Creating users…");
  const adminHash = await hash("Mamavi882020!");
  const receptionHash = await hash("1,2,3rep");
  const clientHash = await hash("1,2,3cli");

  await User.create([
    {
      email: "info.waterhouselodge@gmail.com",
      passwordHash: adminHash,
      role: "admin",
      fullName: "System Admin",
    },
    {
      email: "waterhouse.logde@gmail.com",
      passwordHash: receptionHash,
      role: "receptionist",
      fullName: "Front Desk",
    },
    {
      email: "guest@waterhouselodge.com",
      passwordHash: clientHash,
      role: "client",
      fullName: "Demo Guest",
      phone: "0240000000",
    },
    {
      email: WALKIN_EMAIL,
      passwordHash: clientHash,
      role: "client",
      fullName: "Walk-in guest (lobby)",
    },
  ]);

  console.info("Creating rooms…");
  const prices = [450, 520, 380, 600, 410];
  await Room.insertMany([
    ...prices.map((priceGhs, i) => ({
      roomNumber: String(100 + i + 1),
      priceGhs,
      kind: "guest" as const,
    })),
    { roomNumber: "106", priceGhs: 490, kind: "guest" as const },
    { roomNumber: "CONF-1", priceGhs: 2500, kind: "conference" as const },
  ]);
  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
