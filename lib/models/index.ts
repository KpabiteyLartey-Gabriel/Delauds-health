import mongoose, { Schema, model, models } from "mongoose";

const StoreItemSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 200 },
    category: {
      type: String,
      required: true,
      enum: ["toiletries", "bedding", "towels", "amenities", "other"],
    },
    quantity: { type: Number, required: true, min: 0, default: 0 },
    unit: { type: String, required: true, trim: true, maxlength: 50 },
    priceGhs: { type: Number, min: 0 },
    description: { type: String, trim: true, maxlength: 500 },
    lowStockThreshold: { type: Number, required: true, min: 0, default: 5 },
  },
  { timestamps: true },
);

const UserSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 320,
    },
    passwordHash: { type: String, required: true, select: false },
    role: {
      type: String,
      required: true,
      enum: ["admin", "receptionist", "client"],
    },
    fullName: { type: String, required: true, trim: true, maxlength: 200 },
    phone: { type: String, trim: true, maxlength: 40 },
  },
  { timestamps: true },
);

UserSchema.index({ email: 1 });

const RoomSchema = new Schema(
  {
    roomNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      maxlength: 20,
    },
    priceGhs: { type: Number, required: true, min: 0 },
    kind: {
      type: String,
      enum: ["guest", "conference"],
      default: "guest",
    },
  },
  { timestamps: true },
);

const GuestDetailsSchema = new Schema(
  {
    fullName: { type: String, required: true },
    nationality: { type: String, required: true },
    passportNumber: { type: String },
    permanentAddress: { type: String, required: true },
    dateOfBirth: { type: String, required: true },
    occupation: { type: String, required: true },
    maritalStatus: { type: String, required: true },
    travelCompanionsSpouseName: { type: String },
    travelCompanionsChildrenCount: { type: Number },
    phone: { type: String, required: true },
    email: { type: String, required: true },
    checkInDateTime: { type: String, required: true },
    checkOutDateTime: { type: String, required: true },
    idType: {
      type: String,
      required: true,
      enum: ["ghana_card", "passport", "drivers_license"],
    },
    idNumber: { type: String, required: true },
    idPhotoUrl: { type: String, required: true },
    eta: { type: String, required: true },
    paymentMethod: { type: String, required: true, enum: ["momo", "cash"] },
    paymentStatus: { type: String, required: true, enum: ["pending", "paid"] },
    paymentNote: { type: String },
  },
  { _id: false, strict: true },
);

const BookingSchema = new Schema(
  {
    room: {
      type: Schema.Types.ObjectId,
      ref: "Room",
      required: true,
      index: true,
    },
    clientUser: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    checkInDate: { type: String, required: true },
    checkOutDate: { type: String, required: true },
    status: {
      type: String,
      required: true,
      enum: ["booked", "checked_in", "checked_out", "cancelled"],
      default: "booked",
    },
    guestDetails: { type: GuestDetailsSchema, required: true },
  },
  { timestamps: true },
);

const AuditLogSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    userEmail: { type: String, required: true, maxlength: 320 },
    role: { type: String, required: true },
    action: { type: String, required: true, maxlength: 120 },
    detail: { type: String, required: true, maxlength: 4000 },
  },
  { timestamps: true },
);

AuditLogSchema.index({ createdAt: -1 });

const SupplyRequestItemSchema = new Schema(
  {
    storeItemId: {
      type: Schema.Types.ObjectId,
      ref: "StoreItem",
      required: true,
    },
    itemName: { type: String, required: true, maxlength: 200 },
    quantity: { type: Number, required: true, min: 1 },
  },
  { _id: false },
);

const SupplyRequestSchema = new Schema(
  {
    room: {
      type: Schema.Types.ObjectId,
      ref: "Room",
      required: true,
      index: true,
    },
    roomNumber: { type: String, required: true },
    items: { type: [SupplyRequestItemSchema], required: true },
    status: {
      type: String,
      required: true,
      enum: ["pending", "fulfilled"],
      default: "pending",
    },
    requestedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    requestedByEmail: { type: String, required: true },
    notes: { type: String, maxlength: 500 },
    fulfilledBy: { type: Schema.Types.ObjectId, ref: "User" },
    fulfilledByEmail: { type: String },
  },
  { timestamps: true },
);
SupplyRequestSchema.index({ status: 1, createdAt: -1 });

export const User = models.User || model("User", UserSchema);
export const Room = models.Room || model("Room", RoomSchema);
export const Booking = models.Booking || model("Booking", BookingSchema);
export const AuditLog = models.AuditLog || model("AuditLog", AuditLogSchema);
export const StoreItem =
  models.StoreItem || model("StoreItem", StoreItemSchema);
export const SupplyRequest =
  models.SupplyRequest || model("SupplyRequest", SupplyRequestSchema);
