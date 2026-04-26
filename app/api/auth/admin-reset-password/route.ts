import { NextResponse } from "next/server";
import { getSessionFromCookies } from "@/lib/server/auth/session-cookie";
import { adminResetPortalSchema } from "@/lib/server/validation";
import { adminResetStaffPassword } from "@/lib/server/auth/password-reset";
import { recordAudit } from "@/lib/server/hotel-service";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const session = getSessionFromCookies();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = adminResetPortalSchema.safeParse(body);
  if (!parsed.success) {
    const msg = parsed.error.flatten().fieldErrors;
    const first = Object.values(msg)[0]?.[0] ?? "Invalid input.";
    return NextResponse.json({ error: first }, { status: 400 });
  }

  try {
    const result = await adminResetStaffPassword({
      actorUserId: session.sub,
      actorEmail: session.email,
      actorRole: session.role,
      targetUserId: parsed.data.userId,
      nextPassword: parsed.data.password,
    });

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    try {
      await recordAudit(
        session,
        "staff_password_reset",
        `Password reset in admin portal for ${result.target.email} (${result.target.role}).`,
      );
    } catch {
      // Non-fatal audit failure.
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[auth/admin-reset-password]", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
