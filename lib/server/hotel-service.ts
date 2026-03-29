import mongoose from "mongoose"
import { connectDb } from "@/lib/mongodb/connect"
import { User, Room, Booking as BookingModel, AuditLog } from "@/lib/models"
import { bookingsOverlap } from "@/lib/hotel/dates"
import type {
  Booking,
  BookingStatus,
  GuestDetailsGhana,
  HotelState,
  HotelUserPublic,
  OccupancyRecord,
  Room as RoomDTO,
  RoomStatus,
  AuditEntry,
  UserRole,
} from "@/lib/hotel/types"
import type { SessionPayload } from "@/lib/server/auth/jwt"
import { ApiError } from "@/lib/server/api-error"
import { AUDIT_LIMIT, MAX_AUDIT_DETAIL_LEN, WALKIN_EMAIL } from "@/lib/server/constants"

function requireObjectId(id: string, label = "id"): mongoose.Types.ObjectId {
  if (!mongoose.isValidObjectId(id)) {
    throw new ApiError(400, `Invalid ${label}`)
  }
  return new mongoose.Types.ObjectId(id)
}

function activeBookingStatuses(): BookingStatus[] {
  return ["booked", "checked_in"]
}

function applyRoomStatuses(rooms: RoomDTO[], bookings: Booking[]): RoomDTO[] {
  return rooms.map((room) => {
    const relevant = bookings.filter(
      (b) => b.roomId === room.id && activeBookingStatuses().includes(b.status),
    )
    if (relevant.some((b) => b.status === "checked_in")) {
      return { ...room, status: "occupied" as RoomStatus }
    }
    if (relevant.some((b) => b.status === "booked")) {
      return { ...room, status: "booked" as RoomStatus }
    }
    return { ...room, status: "available" as RoomStatus }
  })
}

function bookingLeanToDTO(doc: {
  _id: mongoose.Types.ObjectId
  room: mongoose.Types.ObjectId
  clientUser: mongoose.Types.ObjectId
  checkInDate: string
  checkOutDate: string
  status: BookingStatus
  guestDetails: GuestDetailsGhana
  createdAt?: Date
}): Booking {
  return {
    id: doc._id.toString(),
    roomId: doc.room.toString(),
    clientUserId: doc.clientUser.toString(),
    checkInDate: doc.checkInDate,
    checkOutDate: doc.checkOutDate,
    status: doc.status,
    guestDetails: doc.guestDetails,
    createdAt: doc.createdAt ? doc.createdAt.toISOString() : new Date().toISOString(),
  }
}

async function audit(auth: SessionPayload, action: string, detail: string) {
  const safeDetail = detail.slice(0, MAX_AUDIT_DETAIL_LEN)
  await AuditLog.create({
    user: requireObjectId(auth.sub),
    userEmail: auth.email.slice(0, 320),
    role: auth.role,
    action: action.slice(0, 120),
    detail: safeDetail,
  })
}

export async function recordAudit(auth: SessionPayload, action: string, detail: string) {
  await connectDb()
  await audit(auth, action, detail)
}

function isRoomFreeForDates(
  bookings: Booking[],
  roomId: string,
  checkInDate: string,
  checkOutDate: string,
  ignoreBookingId?: string,
): boolean {
  return !bookings.some((b) => {
    if (b.roomId !== roomId) return false
    if (b.status === "cancelled" || b.status === "checked_out") return false
    if (ignoreBookingId && b.id === ignoreBookingId) return false
    return bookingsOverlap(checkInDate, checkOutDate, b.checkInDate, b.checkOutDate)
  })
}

export async function findUserByEmailForLogin(email: string) {
  await connectDb()
  return User.findOne({ email: email.toLowerCase().trim() }).select("+passwordHash").lean()
}

export async function buildHotelState(auth: SessionPayload): Promise<HotelState> {
  await connectDb()
  const self = await User.findById(requireObjectId(auth.sub))
    .select({ email: 1, role: 1, fullName: 1, phone: 1 })
    .lean()
  if (!self) {
    throw new ApiError(401, "Unauthorized")
  }
  const profile: HotelUserPublic = {
    id: self._id.toString(),
    email: self.email,
    role: self.role as UserRole,
    fullName: self.fullName,
    phone: self.phone ?? undefined,
  }

  const roomsDocs = await Room.find().sort({ roomNumber: 1 }).lean()
  const roomDtos: RoomDTO[] = roomsDocs.map((r) => ({
    id: r._id.toString(),
    roomNumber: r.roomNumber,
    priceGhs: r.priceGhs,
    status: "available",
  }))

  const allBookingsDocs = await BookingModel.find().sort({ createdAt: -1 }).lean()
  const allBookingDtos = allBookingsDocs.map((d) =>
    bookingLeanToDTO(d as Parameters<typeof bookingLeanToDTO>[0]),
  )
  const rooms = applyRoomStatuses(roomDtos, allBookingDtos)

  const bookings =
    auth.role === "client"
      ? allBookingDtos.filter((b) => b.clientUserId === auth.sub)
      : allBookingDtos

  const occupancy: OccupancyRecord[] = allBookingDtos.map((b) => ({
    id: b.id,
    roomId: b.roomId,
    checkInDate: b.checkInDate,
    checkOutDate: b.checkOutDate,
    status: b.status,
  }))

  let users: HotelUserPublic[] = []
  let auditLog: AuditEntry[] = []
  let walkInClientId: string | undefined

  if (auth.role === "admin") {
    const clientDocs = await User.find({ role: "client" })
      .select({ email: 1, role: 1, fullName: 1, phone: 1 })
      .lean()
    users = clientDocs
      .filter((u) => u.email !== WALKIN_EMAIL)
      .map((u) => ({
        id: u._id.toString(),
        email: u.email,
        role: u.role as HotelUserPublic["role"],
        fullName: u.fullName,
        phone: u.phone ?? undefined,
      }))
    const audits = await AuditLog.find().sort({ createdAt: -1 }).limit(AUDIT_LIMIT).lean()
    auditLog = audits.map((a) => ({
      id: a._id.toString(),
      at: a.createdAt ? a.createdAt.toISOString() : new Date().toISOString(),
      userId: a.user.toString(),
      userEmail: a.userEmail,
      role: a.role as HotelUserPublic["role"],
      action: a.action,
      detail: a.detail,
    }))
  }

  if (auth.role === "admin" || auth.role === "receptionist") {
    const w = await User.findOne({ email: WALKIN_EMAIL }).select("_id").lean()
    walkInClientId = w ? w._id.toString() : undefined
  }

  return {
    profile,
    users,
    rooms,
    bookings,
    auditLog,
    occupancy,
    walkInClientId,
  }
}

export async function registerClientUser(input: {
  email: string
  passwordHash: string
  fullName: string
  phone: string
}) {
  await connectDb()
  const email = input.email.toLowerCase().trim()
  const exists = await User.findOne({ email }).lean()
  if (exists) throw new ApiError(409, "An account with this email already exists.")
  const doc = await User.create({
    email,
    passwordHash: input.passwordHash,
    role: "client",
    fullName: input.fullName.trim(),
    phone: input.phone.trim(),
  })
  return doc
}

export async function createBooking(
  auth: SessionPayload,
  input: {
    roomId: string
    clientUserId: string
    checkInDate: string
    checkOutDate: string
    guestDetails: GuestDetailsGhana
  },
) {
  await connectDb()
  if (input.checkInDate >= input.checkOutDate) {
    throw new ApiError(400, "Check-out must be after check-in.")
  }

  let clientUserId = input.clientUserId
  if (auth.role === "client") {
    if (clientUserId !== auth.sub) {
      throw new ApiError(403, "Forbidden")
    }
  } else if (auth.role !== "admin" && auth.role !== "receptionist") {
    throw new ApiError(403, "Forbidden")
  }

  const roomOid = requireObjectId(input.roomId, "roomId")
  const userOid = requireObjectId(clientUserId, "clientUserId")

  const room = await Room.findById(roomOid).lean()
  if (!room) throw new ApiError(404, "Room not found")

  const userExists = await User.findById(userOid).lean()
  if (!userExists) throw new ApiError(400, "Client user not found")

  const existing = await BookingModel.find({
    room: roomOid,
    status: { $in: ["booked", "checked_in"] },
  }).lean()

  const existingDtos = existing.map((d) => bookingLeanToDTO(d as Parameters<typeof bookingLeanToDTO>[0]))
  if (!isRoomFreeForDates(existingDtos, roomOid.toString(), input.checkInDate, input.checkOutDate)) {
    throw new ApiError(409, "Room is not available for these dates.")
  }

  const created = await BookingModel.create({
    room: roomOid,
    clientUser: userOid,
    checkInDate: input.checkInDate,
    checkOutDate: input.checkOutDate,
    status: "booked",
    guestDetails: input.guestDetails,
  })

  await audit(
    auth,
    "booking_created",
    `Booking ${created._id.toString()} for room ${room.roomNumber}, ${input.checkInDate}–${input.checkOutDate}`,
  )
}

export async function cancelBooking(auth: SessionPayload, bookingId: string) {
  await connectDb()
  const oid = requireObjectId(bookingId, "bookingId")
  const b = await BookingModel.findById(oid).lean()
  if (!b) throw new ApiError(404, "Booking not found")

  const dto = bookingLeanToDTO(b as Parameters<typeof bookingLeanToDTO>[0])
  if (auth.role === "client" && dto.clientUserId !== auth.sub) {
    throw new ApiError(403, "Forbidden")
  }

  if (dto.status === "checked_in") throw new ApiError(400, "Cannot cancel after check-in.")
  if (dto.status === "checked_out") throw new ApiError(400, "Already checked out.")
  if (dto.status === "cancelled") throw new ApiError(400, "Already cancelled.")

  await BookingModel.updateOne({ _id: oid }, { $set: { status: "cancelled" } })
  await audit(auth, "booking_cancelled", `Booking ${bookingId} cancelled`)
}

export async function checkInBooking(auth: SessionPayload, bookingId: string) {
  if (auth.role !== "admin" && auth.role !== "receptionist") {
    throw new ApiError(403, "Forbidden")
  }
  await connectDb()
  const oid = requireObjectId(bookingId, "bookingId")
  const b = await BookingModel.findById(oid).lean()
  if (!b) throw new ApiError(404, "Booking not found")
  const dto = bookingLeanToDTO(b as Parameters<typeof bookingLeanToDTO>[0])
  if (dto.status !== "booked") throw new ApiError(400, "Only booked stays can be checked in.")

  const room = await Room.findById(b.room).lean()
  await BookingModel.updateOne({ _id: oid }, { $set: { status: "checked_in" } })
  await audit(
    auth,
    "check_in",
    `Checked in booking ${bookingId}, room ${room?.roomNumber?.toString() ?? String(b.room)}`,
  )
}

export async function checkOutBooking(auth: SessionPayload, bookingId: string) {
  if (auth.role !== "admin" && auth.role !== "receptionist") {
    throw new ApiError(403, "Forbidden")
  }
  await connectDb()
  const oid = requireObjectId(bookingId, "bookingId")
  const b = await BookingModel.findById(oid).lean()
  if (!b) throw new ApiError(404, "Booking not found")
  const dto = bookingLeanToDTO(b as Parameters<typeof bookingLeanToDTO>[0])
  if (dto.status !== "checked_in") throw new ApiError(400, "Guest must be checked in first.")

  const room = await Room.findById(b.room).lean()
  await BookingModel.updateOne({ _id: oid }, { $set: { status: "checked_out" } })
  await audit(
    auth,
    "check_out",
    `Checked out booking ${bookingId}, room ${room?.roomNumber?.toString() ?? String(b.room)}`,
  )
}

export async function addRoom(auth: SessionPayload, roomNumber: string, priceGhs: number) {
  if (auth.role !== "admin") throw new ApiError(403, "Forbidden")
  await connectDb()
  const num = roomNumber.trim()
  const exists = await Room.findOne({ roomNumber: num }).lean()
  if (exists) throw new ApiError(409, "Room number already exists.")
  await Room.create({ roomNumber: num, priceGhs })
  await audit(auth, "room_added", `Room ${num} at GHS ${priceGhs}`)
}

export async function updateRoom(
  auth: SessionPayload,
  roomId: string,
  patch: { roomNumber?: string; priceGhs?: number },
) {
  if (auth.role !== "admin") throw new ApiError(403, "Forbidden")
  await connectDb()
  const oid = requireObjectId(roomId, "roomId")
  const room = await Room.findById(oid).lean()
  if (!room) throw new ApiError(404, "Room not found")

  if (patch.roomNumber !== undefined) {
    const n = patch.roomNumber.trim()
    const clash = await Room.findOne({ roomNumber: n, _id: { $ne: oid } }).lean()
    if (clash) throw new ApiError(409, "Room number already in use.")
  }

  await Room.updateOne(
    { _id: oid },
    {
      $set: {
        ...(patch.roomNumber !== undefined && { roomNumber: patch.roomNumber.trim() }),
        ...(patch.priceGhs !== undefined && { priceGhs: Math.max(0, patch.priceGhs) }),
      },
    },
  )
  await audit(auth, "room_updated", `Room ${roomId} updated`)
}

export async function deleteRoom(auth: SessionPayload, roomId: string) {
  if (auth.role !== "admin") throw new ApiError(403, "Forbidden")
  await connectDb()
  const oid = requireObjectId(roomId, "roomId")
  const busy = await BookingModel.findOne({
    room: oid,
    status: { $in: ["booked", "checked_in"] },
  }).lean()
  if (busy) throw new ApiError(409, "Room has active bookings.")

  const room = await Room.findById(oid).lean()
  await Room.deleteOne({ _id: oid })
  await audit(auth, "room_deleted", `Removed room ${room?.roomNumber ?? roomId}`)
}

export async function guestRegisterCsv(): Promise<string> {
  await connectDb()
  const roomsDocs = await Room.find().lean()
  const roomMap = new Map(roomsDocs.map((r) => [r._id.toString(), r.roomNumber]))
  const bookings = await BookingModel.find({ status: { $ne: "cancelled" } }).sort({ createdAt: -1 }).lean()

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
  ]
  const esc = (v: string | number | undefined | null) => {
    const s = String(v ?? "")
    if (s.includes(",") || s.includes('"') || s.includes("\n")) {
      return `"${s.replace(/"/g, '""')}"`
    }
    return s
  }
  const lines = [headers.join(",")]
  for (const b of bookings) {
    const g = b.guestDetails as GuestDetailsGhana
    const roomNum = roomMap.get(b.room.toString()) ?? ""
    lines.push(
      [
        esc(b._id.toString()),
        esc(roomNum),
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
        esc(b.createdAt ? b.createdAt.toISOString() : ""),
      ].join(","),
    )
  }
  return lines.join("\n")
}
