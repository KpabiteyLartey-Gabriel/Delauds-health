/**
 * Seeds MongoDB with staff accounts and walk-in placeholder.
 * Rooms are added by admin in the dashboard — not seeded here.
 * Usage: npm run db:seed   (requires MONGODB_URI in .env)
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

  const adminPassword = process.env.SEED_ADMIN_PASSWORD?.trim();
  const receptionPassword = process.env.SEED_RECEPTION_PASSWORD?.trim();
  const walkinPassword = process.env.SEED_WALKIN_PASSWORD?.trim();

  if (!adminPassword || !receptionPassword || !walkinPassword) {
    console.error(
      "Set SEED_ADMIN_PASSWORD, SEED_RECEPTION_PASSWORD, and SEED_WALKIN_PASSWORD in .env before seeding.",
    );
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
    /* collection may not exist yet */
  }

  console.info("Creating staff users…");
  const adminHash = await hash(adminPassword);
  const receptionHash = await hash(receptionPassword);
  const walkinHash = await hash(walkinPassword);

  await User.create([
    {
      email: process.env.SEED_ADMIN_EMAIL?.trim() || "info.waterhouselodge@gmail.com",
      passwordHash: adminHash,
      role: "admin",
      fullName: "System Admin",
    },
    {
      email:
        process.env.SEED_RECEPTION_EMAIL?.trim() || "waterhouse.logde@gmail.com",
      passwordHash: receptionHash,
      role: "receptionist",
      fullName: "Front Desk",
    },
    {
      email: WALKIN_EMAIL,
      passwordHash: walkinHash,
      role: "client",
      fullName: "Walk-in guest (lobby)",
    },
  ]);

  console.info(
    "Done. No demo rooms or guest accounts were created — add rooms in the admin portal.",
  );
  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
