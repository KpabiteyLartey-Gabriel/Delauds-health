import { NextResponse } from "next/server";
import { resetPasswordSchema } from "@/lib/server/validation";
import { resetClientPasswordFromToken } from "@/lib/server/auth/password-reset";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = resetPasswordSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid reset payload." }, { status: 400 });
  }

  try {
    const result = await resetClientPasswordFromToken(
      parsed.data.token,
      parsed.data.password,
    );

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[auth/reset-password]", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
