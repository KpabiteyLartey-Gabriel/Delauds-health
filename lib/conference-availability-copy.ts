export type ConferenceAvailabilityFields = {
  conferenceTotal: number;
  conferenceAvailable: number;
  conferenceState: "none" | "available" | "booked" | "occupied";
};

export function conferenceAvailabilityLabel(
  data: ConferenceAvailabilityFields,
): string | null {
  if (data.conferenceTotal <= 0) return null;
  if (data.conferenceTotal > 1) {
    return `${data.conferenceAvailable} of ${data.conferenceTotal} available`;
  }
  if (data.conferenceState === "available") return "Available";
  if (data.conferenceState === "booked") return "Booked";
  if (data.conferenceState === "occupied") return "In use";
  return null;
}

export function conferenceAvailabilityHeading(
  data: ConferenceAvailabilityFields,
): string {
  return data.conferenceTotal === 1 ? "Conference room" : "Conference spaces";
}

export function conferenceSlotFree(
  data: ConferenceAvailabilityFields,
): boolean {
  return data.conferenceAvailable > 0;
}
