import { NextResponse } from "next/server";
import { getSessionFromCookies } from "@/lib/server/auth/session-cookie";
import { fulfillSupplyRequest } from "@/lib/server/hotel-service";
import { ApiError } from "@/lib/server/api-error";

export const dynamic = "force-dynamic";

export async function PATCH(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const s = getSessionFromCookies();
  if (!s) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    await fulfillSupplyRequest(s, params.id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof ApiError)
      return NextResponse.json({ error: e.message }, { status: e.status });
    console.error("[supplies PATCH]", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
