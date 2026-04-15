import mongoose from "mongoose";
import { connectDb } from "@/lib/mongodb/connect";
import {
  User,
  Room,
  Booking as BookingModel,
  AuditLog,
  StoreItem as StoreItemModel,
  SupplyRequest as SupplyRequestModel,
} from "@/lib/models";
import { bookingsOverlap } from "@/lib/hotel/dates";
import type {
  Booking,
  BookingStatus,
  GuestDetailsGhana,
  HotelState,
  HotelUserPublic,
  OccupancyRecord,
  Room as RoomDTO,
  RoomKind,
  RoomStatus,
  AuditEntry,
  UserRole,
  StoreItem,
  StoreCategory,
  SupplyRequest,
  SupplyRequestStatus,
} from "@/lib/hotel/types";
import type { SessionPayload } from "@/lib/server/auth/jwt";
import { ApiError } from "@/lib/server/api-error";
import {
  AUDIT_LIMIT,
  MAX_AUDIT_DETAIL_LEN,
  WALKIN_EMAIL,
} from "@/lib/server/constants";
import { uploadIdPhoto } from "./cloudinary";

export function normalizeRoomKind(raw: unknown): RoomKind {
  return raw === "conference" ? "conference" : "guest";
}

function requireObjectId(id: string, label = "id"): mongoose.Types.ObjectId {
  if (!mongoose.isValidObjectId(id)) {
    throw new ApiError(400, `Invalid ${label}`);
  }
  return new mongoose.Types.ObjectId(id);
}

function activeBookingStatuses(): BookingStatus[] {
  return ["booked", "checked_in"];
}

function applyRoomStatuses(rooms: RoomDTO[], bookings: Booking[]): RoomDTO[] {
  return rooms.map((room) => {
    const relevant = bookings.filter(
      (b) => b.roomId === room.id && activeBookingStatuses().includes(b.status),
    );
    if (relevant.some((b) => b.status === "checked_in")) {
      return { ...room, status: "occupied" as RoomStatus };
    }
    if (relevant.some((b) => b.status === "booked")) {
      return { ...room, status: "booked" as RoomStatus };
    }
    return { ...room, status: "available" as RoomStatus };
  });
}

function bookingLeanToDTO(doc: {
  _id: mongoose.Types.ObjectId;
  room: mongoose.Types.ObjectId;
  clientUser: mongoose.Types.ObjectId;
  checkInDate: string;
  checkOutDate: string;
  status: BookingStatus;
  guestDetails: GuestDetailsGhana;
  createdAt?: Date;
}): Booking {
  return {
    id: doc._id.toString(),
    roomId: doc.room.toString(),
    clientUserId: doc.clientUser.toString(),
    checkInDate: doc.checkInDate,
    checkOutDate: doc.checkOutDate,
    status: doc.status,
    guestDetails: doc.guestDetails,
    createdAt: doc.createdAt
      ? doc.createdAt.toISOString()
      : new Date().toISOString(),
  };
}

async function audit(auth: SessionPayload, action: string, detail: string) {
  const safeDetail = detail.slice(0, MAX_AUDIT_DETAIL_LEN);
  await AuditLog.create({
    user: requireObjectId(auth.sub),
    userEmail: auth.email.slice(0, 320),
    role: auth.role,
    action: action.slice(0, 120),
    detail: safeDetail,
  });
}

export async function recordAudit(
  auth: SessionPayload,
  action: string,
  detail: string,
) {
  await connectDb();
  await audit(auth, action, detail);
}

function isRoomFreeForDates(
  bookings: Booking[],
  roomId: string,
  checkInDate: string,
  checkOutDate: string,
  ignoreBookingId?: string,
): boolean {
  return !bookings.some((b) => {
    if (b.roomId !== roomId) return false;
    if (b.status === "cancelled" || b.status === "checked_out") return false;
    if (ignoreBookingId && b.id === ignoreBookingId) return false;
    return bookingsOverlap(
      checkInDate,
      checkOutDate,
      b.checkInDate,
      b.checkOutDate,
    );
  });
}

export async function findUserByEmailForLogin(email: string) {
  await connectDb();
  return User.findOne({ email: email.toLowerCase().trim() })
    .select("+passwordHash")
    .lean();
}

export async function buildHotelState(
  auth: SessionPayload,
): Promise<HotelState> {
  await connectDb();
  const self = await User.findById(requireObjectId(auth.sub))
    .select({ email: 1, role: 1, fullName: 1, phone: 1 })
    .lean();
  if (!self) {
    throw new ApiError(401, "Unauthorized");
  }
  const profile: HotelUserPublic = {
    id: self._id.toString(),
    email: self.email,
    role: self.role as UserRole,
    fullName: self.fullName,
    phone: self.phone ?? undefined,
  };

  const roomsDocs = await Room.find().sort({ roomNumber: 1 }).lean();
  const roomDtos: RoomDTO[] = roomsDocs.map((r) => ({
    id: r._id.toString(),
    roomNumber: r.roomNumber,
    priceGhs: r.priceGhs,
    kind: normalizeRoomKind((r as { kind?: string }).kind),
    status: "available",
  }));

  const allBookingsDocs = await BookingModel.find()
    .sort({ createdAt: -1 })
    .lean();
  const allBookingDtos = allBookingsDocs.map((d) =>
    bookingLeanToDTO(d as Parameters<typeof bookingLeanToDTO>[0]),
  );
  const rooms = applyRoomStatuses(roomDtos, allBookingDtos);

  const bookings =
    auth.role === "client"
      ? allBookingDtos.filter((b) => b.clientUserId === auth.sub)
      : allBookingDtos;

  const occupancy: OccupancyRecord[] = allBookingDtos.map((b) => ({
    id: b.id,
    roomId: b.roomId,
    checkInDate: b.checkInDate,
    checkOutDate: b.checkOutDate,
    status: b.status,
  }));

  let users: HotelUserPublic[] = [];
  let auditLog: AuditEntry[] = [];
  let walkInClientId: string | undefined;
  let storeItems: StoreItem[] = [];
  let supplyRequests: SupplyRequest[] = [];

  if (auth.role === "admin") {
    const allUserDocs = await User.find()
      .select({ email: 1, role: 1, fullName: 1, phone: 1 })
      .lean();
    users = allUserDocs
      .filter((u) => u.email !== WALKIN_EMAIL)
      .map((u) => ({
        id: u._id.toString(),
        email: u.email,
        role: u.role as HotelUserPublic["role"],
        fullName: u.fullName,
        phone: u.phone ?? undefined,
      }));

    const storeDocs = await StoreItemModel.find()
      .sort({ category: 1, name: 1 })
      .lean();
    storeItems = storeDocs.map((s) => ({
      id: s._id.toString(),
      name: s.name,
      category: s.category as StoreCategory,
      quantity: s.quantity,
      unit: s.unit,
      priceGhs: s.priceGhs ?? undefined,
      description: s.description ?? undefined,
      lowStockThreshold: s.lowStockThreshold ?? 5,
    }));

    const audits = await AuditLog.find()
      .sort({ createdAt: -1 })
      .limit(AUDIT_LIMIT)
      .lean();
    auditLog = audits.map((a) => ({
      id: a._id.toString(),
      at: a.createdAt ? a.createdAt.toISOString() : new Date().toISOString(),
      userId: a.user.toString(),
      userEmail: a.userEmail,
      role: a.role as HotelUserPublic["role"],
      action: a.action,
      detail: a.detail,
    }));
  }

  if (auth.role === "admin" || auth.role === "receptionist") {
    // Load store items for receptionist to view during supply requests
    if (auth.role === "receptionist" && storeItems.length === 0) {
      const storeDocs = await StoreItemModel.find()
        .sort({ category: 1, name: 1 })
        .lean();
      storeItems = storeDocs.map((s) => ({
        id: s._id.toString(),
        name: s.name,
        category: s.category as StoreCategory,
        quantity: s.quantity,
        unit: s.unit,
        priceGhs: s.priceGhs ?? undefined,
        description: s.description ?? undefined,
        lowStockThreshold: s.lowStockThreshold ?? 5,
      }));
    }

    const w = await User.findOne({ email: WALKIN_EMAIL }).select("_id").lean();
    walkInClientId = w ? w._id.toString() : undefined;

    const supplyDocs = await SupplyRequestModel.find()
      .sort({ createdAt: -1 })
      .lean();
    supplyRequests = supplyDocs.map((s) => ({
      id: s._id.toString(),
      roomId: s.room.toString(),
      roomNumber: s.roomNumber as string,
      items: (
        s.items as Array<{
          storeItemId: { toString(): string };
          itemName: string;
          quantity: number;
        }>
      ).map((it) => ({
        storeItemId: it.storeItemId.toString(),
        itemName: it.itemName,
        quantity: it.quantity,
      })),
      status: s.status as SupplyRequestStatus,
      requestedBy: s.requestedBy.toString(),
      requestedByEmail: s.requestedByEmail as string,
      notes: s.notes ?? undefined,
      fulfilledBy: s.fulfilledBy?.toString() ?? undefined,
      fulfilledByEmail: s.fulfilledByEmail ?? undefined,
      createdAt: s.createdAt
        ? s.createdAt.toISOString()
        : new Date().toISOString(),
    }));
  }

  return {
    profile,
    users,
    rooms,
    bookings,
    auditLog,
    occupancy,
    walkInClientId,
    storeItems,
    supplyRequests,
  };
}

/** Live counts for marketing / public widgets (no auth). */
export async function getPublicRoomAvailabilitySummary(): Promise<{
  total: number;
  available: number;
  guestAvailable: number;
  conferenceAvailable: number;
  /** How many conference-type spaces exist (typically 1). */
  conferenceTotal: number;
  /** Single conference unit status when conferenceTotal > 0. */
  conferenceState: "none" | "available" | "booked" | "occupied";
  booked: number;
  occupied: number;
}> {
  await connectDb();
  const roomsDocs = await Room.find().sort({ roomNumber: 1 }).lean();
  const roomDtos: RoomDTO[] = roomsDocs.map((r) => ({
    id: r._id.toString(),
    roomNumber: r.roomNumber,
    priceGhs: r.priceGhs,
    kind: normalizeRoomKind((r as { kind?: string }).kind),
    status: "available",
  }));
  const allBookingsDocs = await BookingModel.find()
    .sort({ createdAt: -1 })
    .lean();
  const allBookingDtos = allBookingsDocs.map((d) =>
    bookingLeanToDTO(d as Parameters<typeof bookingLeanToDTO>[0]),
  );
  const rooms = applyRoomStatuses(roomDtos, allBookingDtos);
  const available = rooms.filter((r) => r.status === "available").length;
  const guestAvailable = rooms.filter(
    (r) => r.kind === "guest" && r.status === "available",
  ).length;
  const conferenceRooms = rooms.filter((r) => r.kind === "conference");
  const conferenceTotal = conferenceRooms.length;
  const conferenceAvailable = conferenceRooms.filter(
    (r) => r.status === "available",
  ).length;
  let conferenceState: "none" | "available" | "booked" | "occupied" = "none";
  if (conferenceTotal === 1) {
    const s = conferenceRooms[0]!.status;
    conferenceState =
      s === "available" ? "available" : s === "booked" ? "booked" : "occupied";
  } else if (conferenceTotal > 1) {
    conferenceState = conferenceAvailable > 0 ? "available" : "occupied";
  }
  return {
    total: rooms.length,
    available,
    guestAvailable,
    conferenceAvailable,
    conferenceTotal,
    conferenceState,
    booked: rooms.filter((r) => r.status === "booked").length,
    occupied: rooms.filter((r) => r.status === "occupied").length,
  };
}

export async function registerClientUser(input: {
  email: string;
  passwordHash: string;
  fullName: string;
  phone: string;
}) {
  await connectDb();
  const email = input.email.toLowerCase().trim();
  const exists = await User.findOne({ email }).lean();
  if (exists)
    throw new ApiError(409, "An account with this email already exists.");
  const doc = await User.create({
    email,
    passwordHash: input.passwordHash,
    role: "client",
    fullName: input.fullName.trim(),
    phone: input.phone.trim(),
  });
  return doc;
}

export async function createBooking(
  auth: SessionPayload,
  input: {
    roomId: string;
    clientUserId: string;
    checkInDate: string;
    checkOutDate: string;
    guestDetails: GuestDetailsGhana;
  },
) {
  await connectDb();
  if (input.checkInDate >= input.checkOutDate) {
    throw new ApiError(400, "Check-out must be after check-in.");
  }

  let clientUserId = input.clientUserId;
  if (auth.role === "client") {
    if (clientUserId !== auth.sub) {
      throw new ApiError(403, "Forbidden");
    }
  } else if (auth.role !== "admin" && auth.role !== "receptionist") {
    throw new ApiError(403, "Forbidden");
  }

  const roomOid = requireObjectId(input.roomId, "roomId");
  const userOid = requireObjectId(clientUserId, "clientUserId");

  const room = await Room.findById(roomOid).lean();
  if (!room) throw new ApiError(404, "Room not found");

  const userExists = await User.findById(userOid).lean();
  if (!userExists) throw new ApiError(400, "Client user not found");

  const existing = await BookingModel.find({
    room: roomOid,
    status: { $in: ["booked", "checked_in"] },
  }).lean();

  const existingDtos = existing.map((d) =>
    bookingLeanToDTO(d as Parameters<typeof bookingLeanToDTO>[0]),
  );
  if (
    !isRoomFreeForDates(
      existingDtos,
      roomOid.toString(),
      input.checkInDate,
      input.checkOutDate,
    )
  ) {
    throw new ApiError(409, "Room is not available for these dates.");
  }

  const created = await BookingModel.create({
    room: roomOid,
    clientUser: userOid,
    checkInDate: input.checkInDate,
    checkOutDate: input.checkOutDate,
    status: "booked",
    guestDetails: input.guestDetails,
  });

  // Upload ID photo to Cloudinary if it's a data URL
  if (input.guestDetails.idPhotoUrl.startsWith("data:")) {
    try {
      const uploadedUrl = await uploadIdPhoto(
        input.guestDetails.idPhotoUrl,
        created._id.toString(),
      );
      await BookingModel.updateOne(
        { _id: created._id },
        { $set: { "guestDetails.idPhotoUrl": uploadedUrl } },
      );
    } catch (uploadError) {
      // Delete the booking if upload fails
      await BookingModel.deleteOne({ _id: created._id });
      console.error("Cloudinary upload error:", uploadError);
      throw new ApiError(500, "Failed to upload ID photo. Please try again.");
    }
  }

  await audit(
    auth,
    "booking_created",
    `Booking ${created._id.toString()} for room ${room.roomNumber}, ${input.checkInDate}–${input.checkOutDate}`,
  );
}

export async function cancelBooking(auth: SessionPayload, bookingId: string) {
  await connectDb();
  const oid = requireObjectId(bookingId, "bookingId");
  const b = await BookingModel.findById(oid).lean();
  if (!b) throw new ApiError(404, "Booking not found");

  const dto = bookingLeanToDTO(b as Parameters<typeof bookingLeanToDTO>[0]);
  if (auth.role === "client" && dto.clientUserId !== auth.sub) {
    throw new ApiError(403, "Forbidden");
  }

  if (dto.status === "checked_in")
    throw new ApiError(400, "Cannot cancel after check-in.");
  if (dto.status === "checked_out")
    throw new ApiError(400, "Already checked out.");
  if (dto.status === "cancelled") throw new ApiError(400, "Already cancelled.");

  await BookingModel.updateOne({ _id: oid }, { $set: { status: "cancelled" } });
  await audit(auth, "booking_cancelled", `Booking ${bookingId} cancelled`);
}

export async function checkInBooking(auth: SessionPayload, bookingId: string) {
  if (auth.role !== "admin" && auth.role !== "receptionist") {
    throw new ApiError(403, "Forbidden");
  }
  await connectDb();
  const oid = requireObjectId(bookingId, "bookingId");
  const b = await BookingModel.findById(oid).lean();
  if (!b) throw new ApiError(404, "Booking not found");
  const dto = bookingLeanToDTO(b as Parameters<typeof bookingLeanToDTO>[0]);
  if (dto.status !== "booked")
    throw new ApiError(400, "Only booked stays can be checked in.");

  // Note: ID photo verification would be done by reception staff during check-in
  // They compare the uploaded ID photo with the guest in person
  const guestDetails = b.guestDetails as GuestDetailsGhana;
  if (!guestDetails.idPhotoUrl) {
    throw new ApiError(
      400,
      "No ID photo on file. Guest must upload ID photo before check-in.",
    );
  }

  const room = await Room.findById(b.room).lean();
  await BookingModel.updateOne(
    { _id: oid },
    { $set: { status: "checked_in" } },
  );
  await audit(
    auth,
    "check_in",
    `Checked in booking ${bookingId}, room ${room?.roomNumber?.toString() ?? String(b.room)}, verified with ID photo`,
  );
}

export async function checkOutBooking(auth: SessionPayload, bookingId: string) {
  if (auth.role !== "admin" && auth.role !== "receptionist") {
    throw new ApiError(403, "Forbidden");
  }
  await connectDb();
  const oid = requireObjectId(bookingId, "bookingId");
  const b = await BookingModel.findById(oid).lean();
  if (!b) throw new ApiError(404, "Booking not found");
  const dto = bookingLeanToDTO(b as Parameters<typeof bookingLeanToDTO>[0]);
  if (dto.status !== "checked_in")
    throw new ApiError(400, "Guest must be checked in first.");

  const room = await Room.findById(b.room).lean();
  await BookingModel.updateOne(
    { _id: oid },
    { $set: { status: "checked_out" } },
  );
  await audit(
    auth,
    "check_out",
    `Checked out booking ${bookingId}, room ${room?.roomNumber?.toString() ?? String(b.room)}`,
  );
}

export async function addRoom(
  auth: SessionPayload,
  roomNumber: string,
  priceGhs: number,
  kind: RoomKind = "guest",
) {
  if (auth.role !== "admin") throw new ApiError(403, "Forbidden");
  await connectDb();
  const num = roomNumber.trim();
  const exists = await Room.findOne({ roomNumber: num }).lean();
  if (exists) throw new ApiError(409, "Room number already exists.");
  const k = normalizeRoomKind(kind);
  await Room.create({ roomNumber: num, priceGhs, kind: k });
  await audit(
    auth,
    "room_added",
    `Room ${num} (${k}) at GHS ${priceGhs}`,
  );
}

export async function updateRoom(
  auth: SessionPayload,
  roomId: string,
  patch: { roomNumber?: string; priceGhs?: number; kind?: RoomKind },
) {
  if (auth.role !== "admin") throw new ApiError(403, "Forbidden");
  await connectDb();
  const oid = requireObjectId(roomId, "roomId");
  const room = await Room.findById(oid).lean();
  if (!room) throw new ApiError(404, "Room not found");

  if (patch.roomNumber !== undefined) {
    const n = patch.roomNumber.trim();
    const clash = await Room.findOne({
      roomNumber: n,
      _id: { $ne: oid },
    }).lean();
    if (clash) throw new ApiError(409, "Room number already in use.");
  }

  await Room.updateOne(
    { _id: oid },
    {
      $set: {
        ...(patch.roomNumber !== undefined && {
          roomNumber: patch.roomNumber.trim(),
        }),
        ...(patch.priceGhs !== undefined && {
          priceGhs: Math.max(0, patch.priceGhs),
        }),
        ...(patch.kind !== undefined && {
          kind: normalizeRoomKind(patch.kind),
        }),
      },
    },
  );
  await audit(auth, "room_updated", `Room ${roomId} updated`);
}

export async function deleteRoom(auth: SessionPayload, roomId: string) {
  if (auth.role !== "admin") throw new ApiError(403, "Forbidden");
  await connectDb();
  const oid = requireObjectId(roomId, "roomId");
  const busy = await BookingModel.findOne({
    room: oid,
    status: { $in: ["booked", "checked_in"] },
  }).lean();
  if (busy) throw new ApiError(409, "Room has active bookings.");

  const room = await Room.findById(oid).lean();
  await Room.deleteOne({ _id: oid });
  await audit(
    auth,
    "room_deleted",
    `Removed room ${room?.roomNumber ?? roomId}`,
  );
}

export async function guestRegisterCsv(): Promise<string> {
  await connectDb();
  const roomsDocs = await Room.find().lean();
  const roomMap = new Map(
    roomsDocs.map((r) => [r._id.toString(), r.roomNumber]),
  );
  const bookings = await BookingModel.find({ status: { $ne: "cancelled" } })
    .sort({ createdAt: -1 })
    .lean();

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
    "id_photo_url",
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
  for (const b of bookings) {
    const g = b.guestDetails as GuestDetailsGhana;
    const roomNum = roomMap.get(b.room.toString()) ?? "";
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
        esc(g.idPhotoUrl ?? ""),
        esc(g.eta),
        esc(g.paymentMethod),
        esc(g.paymentStatus),
        esc(g.paymentNote),
        esc(b.createdAt ? b.createdAt.toISOString() : ""),
      ].join(","),
    );
  }
  return lines.join("\n");
}

// ─── Store keeping ───────────────────────────────────────────────────────────

export async function addStoreItem(
  auth: SessionPayload,
  input: {
    name: string;
    category: StoreCategory;
    quantity: number;
    unit: string;
    priceGhs?: number;
    description?: string;
    lowStockThreshold?: number;
  },
) {
  if (auth.role !== "admin") throw new ApiError(403, "Forbidden");
  await connectDb();
  const exists = await StoreItemModel.findOne({
    name: input.name.trim(),
  }).lean();
  if (exists) throw new ApiError(409, "An item with this name already exists.");
  const doc = await StoreItemModel.create({
    name: input.name.trim(),
    category: input.category,
    quantity: Math.max(0, input.quantity),
    unit: input.unit.trim(),
    priceGhs: input.priceGhs,
    description: input.description?.trim(),
    lowStockThreshold: input.lowStockThreshold ?? 5,
  });
  await audit(
    auth,
    "store_item_added",
    `Added store item: ${doc.name} (${doc.category}), qty ${doc.quantity}`,
  );
  return doc;
}

export async function updateStoreItem(
  auth: SessionPayload,
  itemId: string,
  patch: {
    name?: string;
    category?: StoreCategory;
    quantity?: number;
    unit?: string;
    priceGhs?: number;
    description?: string;
    lowStockThreshold?: number;
  },
) {
  if (auth.role !== "admin") throw new ApiError(403, "Forbidden");
  await connectDb();
  const oid = requireObjectId(itemId, "itemId");
  const item = await StoreItemModel.findById(oid).lean();
  if (!item) throw new ApiError(404, "Store item not found.");

  if (patch.name !== undefined) {
    const clash = await StoreItemModel.findOne({
      name: patch.name.trim(),
      _id: { $ne: oid },
    }).lean();
    if (clash)
      throw new ApiError(409, "An item with this name already exists.");
  }

  await StoreItemModel.updateOne(
    { _id: oid },
    {
      $set: {
        ...(patch.name !== undefined && { name: patch.name.trim() }),
        ...(patch.category !== undefined && { category: patch.category }),
        ...(patch.quantity !== undefined && {
          quantity: Math.max(0, patch.quantity),
        }),
        ...(patch.unit !== undefined && { unit: patch.unit.trim() }),
        ...(patch.priceGhs !== undefined && { priceGhs: patch.priceGhs }),
        ...(patch.description !== undefined && {
          description: patch.description.trim(),
        }),
        ...(patch.lowStockThreshold !== undefined && {
          lowStockThreshold: Math.max(0, patch.lowStockThreshold),
        }),
      },
    },
  );
  await audit(auth, "store_item_updated", `Updated store item ${itemId}`);
}

export async function deleteStoreItem(auth: SessionPayload, itemId: string) {
  if (auth.role !== "admin") throw new ApiError(403, "Forbidden");
  await connectDb();
  const oid = requireObjectId(itemId, "itemId");
  const item = await StoreItemModel.findById(oid).lean();
  if (!item) throw new ApiError(404, "Store item not found.");
  await StoreItemModel.deleteOne({ _id: oid });
  await audit(auth, "store_item_deleted", `Deleted store item: ${item.name}`);
}

export async function createSupplyRequest(
  auth: SessionPayload,
  input: {
    roomId: string;
    items: Array<{ storeItemId: string; itemName: string; quantity: number }>;
    notes?: string;
  },
) {
  if (auth.role !== "admin" && auth.role !== "receptionist")
    throw new ApiError(403, "Forbidden");
  await connectDb();
  const roomOid = requireObjectId(input.roomId, "roomId");
  const room = await Room.findById(roomOid).lean();
  if (!room) throw new ApiError(404, "Room not found");
  if (!input.items.length)
    throw new ApiError(400, "At least one item required.");

  const doc = await SupplyRequestModel.create({
    room: roomOid,
    roomNumber: room.roomNumber,
    items: input.items.map((it) => ({
      storeItemId: requireObjectId(it.storeItemId, "storeItemId"),
      itemName: it.itemName,
      quantity: it.quantity,
    })),
    status: "pending",
    requestedBy: requireObjectId(auth.sub),
    requestedByEmail: auth.email,
    notes: input.notes?.trim(),
  });

  await audit(
    auth,
    "supply_requested",
    `Room ${room.roomNumber}: ${input.items.map((i) => `${i.quantity}x ${i.itemName}`).join(", ")}`,
  );
  return doc;
}

export async function fulfillSupplyRequest(
  auth: SessionPayload,
  requestId: string,
) {
  if (auth.role !== "admin")
    throw new ApiError(403, "Only admin can fulfill supply requests.");
  await connectDb();
  const oid = requireObjectId(requestId, "requestId");
  const req = await SupplyRequestModel.findById(oid).lean();
  if (!req) throw new ApiError(404, "Supply request not found.");
  if (req.status === "fulfilled") throw new ApiError(400, "Already fulfilled.");

  // deduct each item from store
  const items = req.items as Array<{
    storeItemId: { toString(): string };
    itemName: string;
    quantity: number;
  }>;
  for (const it of items) {
    const storeOid = new mongoose.Types.ObjectId(it.storeItemId.toString());
    const storeItem = await StoreItemModel.findById(storeOid).lean();
    if (storeItem) {
      const newQty = Math.max(0, (storeItem.quantity as number) - it.quantity);
      await StoreItemModel.updateOne(
        { _id: storeOid },
        { $set: { quantity: newQty } },
      );
    }
  }

  await SupplyRequestModel.updateOne(
    { _id: oid },
    {
      $set: {
        status: "fulfilled",
        fulfilledBy: requireObjectId(auth.sub),
        fulfilledByEmail: auth.email,
      },
    },
  );

  await audit(
    auth,
    "supply_fulfilled",
    `Fulfilled supply request ${requestId} for room ${req.roomNumber}`,
  );
}

export async function restockStoreItem(
  auth: SessionPayload,
  itemId: string,
  delta: number,
) {
  if (auth.role !== "admin") throw new ApiError(403, "Forbidden");
  await connectDb();
  const oid = requireObjectId(itemId, "itemId");
  const item = await StoreItemModel.findById(oid).lean();
  if (!item) throw new ApiError(404, "Store item not found.");
  const newQty = Math.max(0, (item.quantity as number) + delta);
  await StoreItemModel.updateOne({ _id: oid }, { $set: { quantity: newQty } });
  const action = delta >= 0 ? "store_restock" : "store_deduct";
  await audit(
    auth,
    action,
    `${item.name}: ${delta >= 0 ? "+" : ""}${delta} → qty ${newQty}`,
  );
}
