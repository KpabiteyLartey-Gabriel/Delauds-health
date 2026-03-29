export type UserRole = "admin" | "receptionist" | "client"

export type RoomStatus = "available" | "booked" | "occupied"

export type BookingStatus = "booked" | "checked_in" | "checked_out" | "cancelled"

export type IdType = "ghana_card" | "passport" | "drivers_license"

export type PaymentMethod = "momo" | "cash"

export type PaymentStatus = "pending" | "paid"

/** Ghana guest-register fields (per stay / booking). */
export interface GuestDetailsGhana {
  fullName: string
  nationality: string
  /** Required for non-Ghanaian guests; optional for Ghanaians */
  passportNumber?: string
  permanentAddress: string
  dateOfBirth: string
  occupation: string
  maritalStatus: string
  travelCompanionsSpouseName?: string
  travelCompanionsChildrenCount?: number
  phone: string
  email: string
  checkInDateTime: string
  checkOutDateTime: string
  idType: IdType
  idNumber: string
  eta: string
  paymentMethod: PaymentMethod
  paymentStatus: PaymentStatus
  paymentNote?: string
}

/** Safe to return to the client / store in UI state (never include password hashes). */
export interface HotelUserPublic {
  id: string
  email: string
  role: UserRole
  fullName: string
  phone?: string
}

/** @deprecated Internal seed only — prefer API + HotelUserPublic */
export interface HotelUser extends HotelUserPublic {
  passwordHash: string
}

export interface Room {
  id: string
  roomNumber: string
  priceGhs: number
  status: RoomStatus
}

export interface Booking {
  id: string
  roomId: string
  clientUserId: string
  checkInDate: string
  checkOutDate: string
  status: BookingStatus
  guestDetails: GuestDetailsGhana
  createdAt: string
}

/** Minimal booking fields for calendar / overlap checks (API sends to all roles). */
export interface OccupancyRecord {
  id: string
  roomId: string
  checkInDate: string
  checkOutDate: string
  status: BookingStatus
}

export interface AuditEntry {
  id: string
  at: string
  userId: string
  userEmail: string
  role: UserRole
  action: string
  detail: string
}

export interface HotelState {
  /** Signed-in user profile (API). */
  profile?: HotelUserPublic
  users: HotelUserPublic[]
  rooms: Room[]
  bookings: Booking[]
  auditLog: AuditEntry[]
  /** All stays (minimal fields) for overlap checks; clients still only see their rows in `bookings`. */
  occupancy: OccupancyRecord[]
  /** Set for admin/reception API — Mongo ObjectId string for walk-in lobby account */
  walkInClientId?: string
}

export interface Session {
  userId: string
  email: string
  role: UserRole
}
