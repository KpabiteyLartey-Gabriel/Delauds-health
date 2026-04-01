import { NextResponse } from "next/server";
import { getSessionFromCookies } from "@/lib/server/auth/session-cookie";
import { addStoreItem } from "@/lib/server/hotel-service";
import { ApiError } from "@/lib/server/api-error";
import type { StoreCategory } from "@/lib/hotel/types";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const s = getSessionFromCookies();
  if (!s) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const {
    name,
    category,
    quantity,
    unit,
    priceGhs,
    description,
    lowStockThreshold,
  } = body as Record<string, unknown>;

  if (!name || typeof name !== "string" || !name.trim()) {
    return NextResponse.json(
      { error: "Item name is required." },
      { status: 400 },
    );
  }
  if (
    !category ||
    !["toiletries", "bedding", "towels", "amenities", "other"].includes(
      category as string,
    )
  ) {
    return NextResponse.json(
      { error: "Valid category is required." },
      { status: 400 },
    );
  }
  if (typeof quantity !== "number" || quantity < 0) {
    return NextResponse.json(
      { error: "Quantity must be a non-negative number." },
      { status: 400 },
    );
  }
  if (!unit || typeof unit !== "string" || !unit.trim()) {
    return NextResponse.json(
      { error: "Unit is required (e.g. pieces, rolls)." },
      { status: 400 },
    );
  }

  try {
    const doc = await addStoreItem(s, {
      name: name as string,
      category: category as StoreCategory,
      quantity: quantity as number,
      unit: unit as string,
      priceGhs: typeof priceGhs === "number" ? priceGhs : undefined,
      description: typeof description === "string" ? description : undefined,
      lowStockThreshold:
        typeof lowStockThreshold === "number" ? lowStockThreshold : 5,
    });
    return NextResponse.json(
      { ok: true, id: doc._id.toString() },
      { status: 201 },
    );
  } catch (e) {
    if (e instanceof ApiError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    console.error("[store POST]", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
