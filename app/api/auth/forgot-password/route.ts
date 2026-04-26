import { NextResponse } from "next/server";
import { forgotPasswordSchema } from "@/lib/server/validation";
import { requestClientPasswordReset } from "@/lib/server/auth/password-reset";

export const dynamic = "force-dynamic";

const OK_RESPONSE = {
  ok: true,
  message:
    "If an eligible client account exists for that email, a reset link has been sent.",
};

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = forgotPasswordSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(OK_RESPONSE);
  }

  try {
    await requestClientPasswordReset(parsed.data.email, req);
    return NextResponse.json(OK_RESPONSE);
  } catch (e) {
    console.error("[auth/forgot-password]", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
