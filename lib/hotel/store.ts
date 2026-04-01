import { nanoid } from "./ids";
import type {
  AuditEntry,
  Booking,
  BookingStatus,
  GuestDetailsGhana,
  HotelState,
  HotelUserPublic,
  Room,
  RoomStatus,
  Session,
  UserRole,
} from "./types";
import { isRoomFreeForOccupancy } from "./availability";

export const STORAGE_KEY = "waterhouse-lodge-state-v1";
export const SESSION_KEY = "waterhouse-lodge-session-v1";

function seedUsersPublic(): HotelUserPublic[] {
  return [
    {
      id: "u-admin",
      email: "admin@waterhouselodge.com",
      role: "admin",
      fullName: "System Admin",
    },
    {
      id: "u-reception",
      email: "reception@waterhouselodge.com",
      role: "receptionist",
      fullName: "Front Desk",
    },
    {
      id: "u-client-demo",
      email: "guest@waterhouselodge.com",
      role: "client",
      fullName: "Demo Guest",
      phone: "0240000000",
    },
    {
      id: "u-walkin",
      email: "walkin@waterhouselodge.local",
      role: "client",
      fullName: "Walk-in guest (lobby)",
    },
  ];
}

function seedRooms(): Room[] {
  const prices = [450, 520, 380, 600, 410];
  return prices.map((priceGhs, i) => ({
    id: `room-${100 + i + 1}`,
    roomNumber: String(100 + i + 1),
    priceGhs,
    status: "available" as RoomStatus,
  }));
}

export function defaultState(): HotelState {
  return {
    users: seedUsersPublic(),
    rooms: seedRooms(),
    bookings: [],
    auditLog: [],
    occupancy: [],
    profile: undefined,
    storeItems: [],
    supplyRequests: [],
  };
}

export function loadState(): HotelState {
  if (typeof window === "undefined") return defaultState();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const s = defaultState();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
      return syncRoomStatuses(s);
    }
    const parsed = JSON.parse(raw) as HotelState;
    if (!parsed.users?.length) {
      const s = defaultState();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
      return syncRoomStatuses(s);
    }
    if (!parsed.occupancy?.length && parsed.bookings?.length) {
      parsed.occupancy = parsed.bookings.map((b) => ({
        id: b.id,
        roomId: b.roomId,
        checkInDate: b.checkInDate,
        checkOutDate: b.checkOutDate,
        status: b.status,
      }));
    }
    if (!parsed.occupancy) parsed.occupancy = [];
    if (!("profile" in parsed)) parsed.profile = undefined;
    return syncRoomStatuses(parsed);
  } catch {
    return defaultState();
  }
}

export function saveState(state: HotelState): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function loadSession(): Session | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as Session;
  } catch {
    return null;
  }
}

export function saveSession(session: Session | null): void {
  if (typeof window === "undefined") return;
  if (!session) localStorage.removeItem(SESSION_KEY);
  else localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

function activeBookingStatuses(): BookingStatus[] {
  return ["booked", "checked_in"];
}

export function syncRoomStatuses(state: HotelState): HotelState {
  const occupancy =
    state.bookings?.map((b) => ({
      id: b.id,
      roomId: b.roomId,
      checkInDate: b.checkInDate,
      checkOutDate: b.checkOutDate,
      status: b.status,
    })) ?? [];
  const rooms = state.rooms.map((room) => {
    const relevant = state.bookings.filter(
      (b) => b.roomId === room.id && activeBookingStatuses().includes(b.status),
    );
    const checkedIn = relevant.some((b) => b.status === "checked_in");
    if (checkedIn) return { ...room, status: "occupied" as RoomStatus };
    const booked = relevant.some((b) => b.status === "booked");
    if (booked) return { ...room, status: "booked" as RoomStatus };
    return { ...room, status: "available" as RoomStatus };
  });
  return { ...state, rooms, occupancy };
}

export function isRoomFreeForDates(
  bookings: Booking[],
  roomId: string,
  checkInDate: string,
  checkOutDate: string,
  ignoreBookingId?: string,
): boolean {
  const occ = bookings.map((b) => ({
    id: b.id,
    roomId: b.roomId,
    checkInDate: b.checkInDate,
    checkOutDate: b.checkOutDate,
    status: b.status,
  }));
  return isRoomFreeForOccupancy(
    occ,
    roomId,
    checkInDate,
    checkOutDate,
    ignoreBookingId,
  );
}

function pushAudit(
  state: HotelState,
  session: Session,
  action: string,
  detail: string,
): HotelState {
  const entry: AuditEntry = {
    id: nanoid(),
    at: new Date().toISOString(),
    userId: session.userId,
    userEmail: session.email,
    role: session.role,
    action,
    detail,
  };
  return { ...state, auditLog: [entry, ...state.auditLog].slice(0, 500) };
}

export function appendAudit(
  state: HotelState,
  session: Session,
  action: string,
  detail: string,
): HotelState {
  return syncRoomStatuses(pushAudit(state, session, action, detail));
}

export function registerClient(
  state: HotelState,
  email: string,
  _passwordHash: string,
  fullName: string,
  phone: string,
): { state: HotelState; user: HotelUserPublic } | { error: string } {
  const e = email.trim().toLowerCase();
  if (state.users.some((u) => u.email.toLowerCase() === e)) {
    return { error: "An account with this email already exists." };
  }
  const user: HotelUserPublic = {
    id: nanoid(),
    email: e,
    role: "client",
    fullName: fullName.trim(),
    phone: phone.trim(),
  };
  return { state: { ...state, users: [...state.users, user] }, user };
}

export function createBookingRecord(
  state: HotelState,
  session: Session,
  roomId: string,
  clientUserId: string,
  checkInDate: string,
  checkOutDate: string,
  guestDetails: GuestDetailsGhana,
): { state: HotelState; booking: Booking } | { error: string } {
  if (!isRoomFreeForDates(state.bookings, roomId, checkInDate, checkOutDate)) {
    return { error: "Room is not available for these dates." };
  }
  const booking: Booking = {
    id: nanoid(),
    roomId,
    clientUserId,
    checkInDate,
    checkOutDate,
    status: "booked",
    guestDetails,
    createdAt: new Date().toISOString(),
  };
  let next: HotelState = { ...state, bookings: [...state.bookings, booking] };
  next = syncRoomStatuses(next);
  const room = next.rooms.find((r) => r.id === roomId);
  next = pushAudit(
    next,
    session,
    "booking_created",
    `Booking ${booking.id} for room ${room?.roomNumber ?? roomId}, ${checkInDate}–${checkOutDate}`,
  );
  return { state: next, booking };
}

export function cancelBooking(
  state: HotelState,
  session: Session,
  bookingId: string,
): { state: HotelState } | { error: string } {
  const b = state.bookings.find((x) => x.id === bookingId);
  if (!b) return { error: "Booking not found." };
  if (b.status === "checked_in")
    return { error: "Cannot cancel after check-in." };
  if (b.status === "checked_out") return { error: "Already checked out." };
  if (b.status === "cancelled") return { error: "Already cancelled." };
  const bookings = state.bookings.map((x) =>
    x.id === bookingId ? { ...x, status: "cancelled" as BookingStatus } : x,
  );
  let next: HotelState = { ...state, bookings };
  next = syncRoomStatuses(next);
  next = pushAudit(
    next,
    session,
    "booking_cancelled",
    `Booking ${bookingId} cancelled`,
  );
  return { state: next };
}

export function checkIn(
  state: HotelState,
  session: Session,
  bookingId: string,
): { state: HotelState } | { error: string } {
  const b = state.bookings.find((x) => x.id === bookingId);
  if (!b) return { error: "Booking not found." };
  if (b.status !== "booked")
    return { error: "Only booked stays can be checked in." };
  const bookings = state.bookings.map((x) =>
    x.id === bookingId ? { ...x, status: "checked_in" as BookingStatus } : x,
  );
  let next: HotelState = { ...state, bookings };
  next = syncRoomStatuses(next);
  const room = next.rooms.find((r) => r.id === b.roomId);
  next = pushAudit(
    next,
    session,
    "check_in",
    `Checked in booking ${bookingId}, room ${room?.roomNumber ?? b.roomId}`,
  );
  return { state: next };
}

export function checkOut(
  state: HotelState,
  session: Session,
  bookingId: string,
): { state: HotelState } | { error: string } {
  const b = state.bookings.find((x) => x.id === bookingId);
  if (!b) return { error: "Booking not found." };
  if (b.status !== "checked_in")
    return { error: "Guest must be checked in first." };
  const bookings = state.bookings.map((x) =>
    x.id === bookingId ? { ...x, status: "checked_out" as BookingStatus } : x,
  );
  let next: HotelState = { ...state, bookings };
  next = syncRoomStatuses(next);
  const room = next.rooms.find((r) => r.id === b.roomId);
  next = pushAudit(
    next,
    session,
    "check_out",
    `Checked out booking ${bookingId}, room ${room?.roomNumber ?? b.roomId}`,
  );
  return { state: next };
}

export function addRoom(
  state: HotelState,
  session: Session,
  roomNumber: string,
  priceGhs: number,
): { state: HotelState } | { error: string } {
  if (state.rooms.some((r) => r.roomNumber === roomNumber.trim())) {
    return { error: "Room number already exists." };
  }
  const room: Room = {
    id: nanoid(),
    roomNumber: roomNumber.trim(),
    priceGhs: Math.max(0, priceGhs),
    status: "available",
  };
  let next: HotelState = { ...state, rooms: [...state.rooms, room] };
  next = pushAudit(
    next,
    session,
    "room_added",
    `Room ${room.roomNumber} at GHS ${priceGhs}`,
  );
  return { state: syncRoomStatuses(next) };
}

export function updateRoom(
  state: HotelState,
  session: Session,
  roomId: string,
  patch: Partial<Pick<Room, "roomNumber" | "priceGhs">>,
): { state: HotelState } | { error: string } {
  const room = state.rooms.find((r) => r.id === roomId);
  if (!room) return { error: "Room not found." };
  if (patch.roomNumber !== undefined && patch.roomNumber !== room.roomNumber) {
    const nextNum = patch.roomNumber.trim();
    if (state.rooms.some((r) => r.id !== roomId && r.roomNumber === nextNum)) {
      return { error: "Room number already in use." };
    }
  }
  const rooms = state.rooms.map((r) =>
    r.id === roomId
      ? {
          ...r,
          ...(patch.roomNumber !== undefined && {
            roomNumber: patch.roomNumber.trim(),
          }),
          ...(patch.priceGhs !== undefined && {
            priceGhs: Math.max(0, patch.priceGhs),
          }),
        }
      : r,
  );
  let next: HotelState = { ...state, rooms };
  next = pushAudit(next, session, "room_updated", `Room ${roomId} updated`);
  return { state: syncRoomStatuses(next) };
}

export function deleteRoom(
  state: HotelState,
  session: Session,
  roomId: string,
): { state: HotelState } | { error: string } {
  const busy = state.bookings.some(
    (b) =>
      b.roomId === roomId &&
      (b.status === "booked" || b.status === "checked_in"),
  );
  if (busy) return { error: "Room has active bookings." };
  const room = state.rooms.find((r) => r.id === roomId);
  const rooms = state.rooms.filter((r) => r.id !== roomId);
  let next: HotelState = { ...state, rooms };
  next = pushAudit(
    next,
    session,
    "room_deleted",
    `Removed room ${room?.roomNumber ?? roomId}`,
  );
  return { state: syncRoomStatuses(next) };
}

export function guestRegisterCsvRows(state: HotelState): string {
  const headers = [
    "booking_id",
    "room",
    "status",
    "check_in",
    "check_out",
    "full_name",
    "nationality",
    "passport_number",
    "permanent_address",
    "dob",
    "occupation",
    "marital_status",
    "spouse_name",
    "children_count",
    "phone",
    "email",
    "check_in_dt",
    "check_out_dt",
    "id_type",
    "id_number",
    "eta",
    "payment_method",
    "payment_status",
    "payment_note",
    "created_at",
  ];
  const esc = (v: string | number | undefined | null) => {
    const s = String(v ?? "");
    if (s.includes(",") || s.includes('"') || s.includes("\n")) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  };
  const lines = [headers.join(",")];
  for (const b of state.bookings) {
    if (b.status === "cancelled") continue;
    const room = state.rooms.find((r) => r.id === b.roomId);
    const g = b.guestDetails;
    lines.push(
      [
        esc(b.id),
        esc(room?.roomNumber),
        esc(b.status),
        esc(b.checkInDate),
        esc(b.checkOutDate),
        esc(g.fullName),
        esc(g.nationality),
        esc(g.passportNumber),
        esc(g.permanentAddress),
        esc(g.dateOfBirth),
        esc(g.occupation),
        esc(g.maritalStatus),
        esc(g.travelCompanionsSpouseName),
        esc(g.travelCompanionsChildrenCount ?? ""),
        esc(g.phone),
        esc(g.email),
        esc(g.checkInDateTime),
        esc(g.checkOutDateTime),
        esc(g.idType),
        esc(g.idNumber),
        esc(g.eta),
        esc(g.paymentMethod),
        esc(g.paymentStatus),
        esc(g.paymentNote),
        esc(b.createdAt),
      ].join(","),
    );
  }
  return lines.join("\n");
}
