import { NextResponse } from "next/server"
import { getSessionFromCookies } from "@/lib/server/auth/session-cookie"
import { updateStoreItem, deleteStoreItem, restockStoreItem } from "@/lib/server/hotel-service"
import { ApiError } from "@/lib/server/api-error"
import type { StoreCategory } from "@/lib/hotel/types"

export const dynamic = "force-dynamic"

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } },
) {
  const s = getSessionFromCookies()
  if (!s) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const { action, ...patch } = body as Record<string, unknown>

  try {
    if (action === "restock") {
      const delta = patch.delta
      if (typeof delta !== "number") {
        return NextResponse.json(
          { error: "delta must be a number (positive to add, negative to deduct)." },
          { status: 400 },
        )
      }
      await restockStoreItem(s, params.id, delta)
      return NextResponse.json({ ok: true })
    }

    // general update
    await updateStoreItem(s, params.id, {
      name: typeof patch.name === "string" ? patch.name : undefined,
      category:
        patch.category &&
        ["toiletries", "bedding", "towels", "amenities", "other"].includes(
          patch.category as string,
        )
          ? (patch.category as StoreCategory)
          : undefined,
      quantity: typeof patch.quantity === "number" ? patch.quantity : undefined,
      unit: typeof patch.unit === "string" ? patch.unit : undefined,
      priceGhs: typeof patch.priceGhs === "number" ? patch.priceGhs : undefined,
      description:
        typeof patch.description === "string" ? patch.description : undefined,
      lowStockThreshold:
        typeof patch.lowStockThreshold === "number"
          ? patch.lowStockThreshold
          : undefined,
    })
    return NextResponse.json({ ok: true })
  } catch (e) {
    if (e instanceof ApiError) {
      return NextResponse.json({ error: e.message }, { status: e.status })
    }
    console.error("[store PATCH]", e)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const s = getSessionFromCookies()
  if (!s) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    await deleteStoreItem(s, params.id)
    return NextResponse.json({ ok: true })
  } catch (e) {
    if (e instanceof ApiError) {
      return NextResponse.json({ error: e.message }, { status: e.status })
    }
    console.error("[store DELETE]", e)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
