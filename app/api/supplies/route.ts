import { NextResponse } from "next/server";
import { getSessionFromCookies } from "@/lib/server/auth/session-cookie";
import { createSupplyRequest } from "@/lib/server/hotel-service";
import { ApiError } from "@/lib/server/api-error";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const s = getSessionFromCookies();
  if (!s) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { roomId, items, notes } = body as Record<string, unknown>;
  if (!roomId || typeof roomId !== "string")
    return NextResponse.json({ error: "roomId required" }, { status: 400 });
  if (!Array.isArray(items) || items.length === 0)
    return NextResponse.json(
      { error: "At least one item required" },
      { status: 400 },
    );

  try {
    await createSupplyRequest(s, {
      roomId,
      items: items as Array<{
        storeItemId: string;
        itemName: string;
        quantity: number;
      }>,
      notes: typeof notes === "string" ? notes : undefined,
    });
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (e) {
    if (e instanceof ApiError)
      return NextResponse.json({ error: e.message }, { status: e.status });
    console.error("[supplies POST]", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
