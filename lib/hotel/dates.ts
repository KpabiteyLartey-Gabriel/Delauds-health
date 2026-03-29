import { parseISO, format, startOfDay, addDays, isBefore } from "date-fns"

/** Half-open interval [checkIn, checkOut) on calendar dates. */
export function bookingsOverlap(
  aIn: string,
  aOut: string,
  bIn: string,
  bOut: string,
): boolean {
  const aStart = startOfDay(parseISO(aIn))
  const aEnd = startOfDay(parseISO(aOut))
  const bStart = startOfDay(parseISO(bIn))
  const bEnd = startOfDay(parseISO(bOut))
  return isBefore(aStart, bEnd) && isBefore(bStart, aEnd)
}

export function formatGhs(n: number): string {
  return `GHS ${n.toFixed(2)}`
}

export function todayISO(): string {
  return format(new Date(), "yyyy-MM-dd")
}

export function tomorrowISO(): string {
  return format(addDays(new Date(), 1), "yyyy-MM-dd")
}
