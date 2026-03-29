import { bookingsOverlap } from "@/lib/hotel/dates"
import type { OccupancyRecord } from "@/lib/hotel/types"

export function isRoomFreeForOccupancy(
  records: OccupancyRecord[],
  roomId: string,
  checkInDate: string,
  checkOutDate: string,
  ignoreBookingId?: string,
): boolean {
  return !records.some((b) => {
    if (b.roomId !== roomId) return false
    if (b.status === "cancelled" || b.status === "checked_out") return false
    if (ignoreBookingId && b.id === ignoreBookingId) return false
    return bookingsOverlap(checkInDate, checkOutDate, b.checkInDate, b.checkOutDate)
  })
}
