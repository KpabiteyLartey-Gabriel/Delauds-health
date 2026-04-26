import crypto from "crypto";
import { connectDb } from "@/lib/mongodb/connect";
import { User } from "@/lib/models";
import { hashPassword } from "@/lib/server/auth/password";
import { sendClientPasswordResetEmail } from "@/lib/server/password-reset-email";

const RESET_TTL_MS = 5 * 60 * 1000;

function hashResetToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function resolveBaseUrl(req?: Request): string {
  const fromEnv = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (fromEnv) return fromEnv.replace(/\/$/, "");
  if (!req) return "http://localhost:3000";
  const url = new URL(req.url);
  return `${url.protocol}//${url.host}`;
}

export async function requestClientPasswordReset(email: string, req?: Request) {
  await connectDb();

  const normalizedEmail = email.trim().toLowerCase();
  const user = await User.findOne({ email: normalizedEmail })
    .select({ _id: 1, email: 1, role: 1, fullName: 1 })
    .lean();

  if (!user || user.role !== "client") {
    return { ok: true as const };
  }

  const rawToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = hashResetToken(rawToken);
  const expiresAt = new Date(Date.now() + RESET_TTL_MS);

  await User.updateOne(
    { _id: user._id },
    {
      $set: {
        passwordResetTokenHash: tokenHash,
        passwordResetExpiresAt: expiresAt,
      },
    },
  );

  const baseUrl = resolveBaseUrl(req);
  const link = `${baseUrl}/reset-password?token=${encodeURIComponent(rawToken)}`;

  await sendClientPasswordResetEmail({
    toEmail: user.email,
    fullName: user.fullName,
    resetLink: link,
  });

  return { ok: true as const };
}

export async function resetClientPasswordFromToken(token: string, nextPassword: string) {
  await connectDb();

  const tokenHash = hashResetToken(token.trim());
  const now = new Date();

  const user = await User.findOne({
    role: "client",
    passwordResetTokenHash: tokenHash,
    passwordResetExpiresAt: { $gt: now },
  }).select({ _id: 1, email: 1, role: 1 });

  if (!user) {
    return { ok: false as const, error: "Invalid or expired reset link." };
  }

  const passwordHash = await hashPassword(nextPassword);

  await User.updateOne(
    { _id: user._id },
    {
      $set: { passwordHash },
      $unset: {
        passwordResetTokenHash: "",
        passwordResetExpiresAt: "",
      },
    },
  );

  return { ok: true as const };
}

export async function adminResetStaffPassword(input: {
  actorUserId: string;
  actorEmail: string;
  actorRole: string;
  targetUserId: string;
  nextPassword: string;
}) {
  await connectDb();

  const target = await User.findById(input.targetUserId)
    .select({ _id: 1, email: 1, role: 1, fullName: 1 })
    .lean();

  if (!target) {
    return { ok: false as const, status: 404 as const, error: "User not found." };
  }

  if (target.role !== "admin" && target.role !== "receptionist") {
    return {
      ok: false as const,
      status: 400 as const,
      error: "Only admin and receptionist passwords can be reset from this portal.",
    };
  }

  const passwordHash = await hashPassword(input.nextPassword);

  await User.updateOne(
    { _id: target._id },
    {
      $set: { passwordHash },
      $unset: {
        passwordResetTokenHash: "",
        passwordResetExpiresAt: "",
      },
    },
  );

  return {
    ok: true as const,
    target: {
      id: target._id.toString(),
      email: target.email,
      role: target.role,
      fullName: target.fullName,
    },
  };
}
