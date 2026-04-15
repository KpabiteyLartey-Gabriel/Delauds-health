import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().trim().email().max(320),
  password: z.string().min(1).max(200),
});

export const registerSchema = z.object({
  email: z.string().trim().email().max(320),
  password: z.string().min(8).max(128),
  fullName: z.string().trim().min(1).max(200),
  phone: z.string().trim().min(5).max(40),
});

export const guestDetailsSchema = z
  .object({
    fullName: z.string().trim().min(1).max(200),
    nationality: z.string().trim().min(1).max(120),
    passportNumber: z.string().trim().max(80).optional(),
    permanentAddress: z.string().trim().min(1).max(1000),
    dateOfBirth: z.string().trim().min(1).max(32),
    occupation: z.string().trim().min(1).max(200),
    maritalStatus: z.string().trim().min(1).max(80),
    travelCompanionsSpouseName: z.string().max(200).optional(),
    travelCompanionsChildrenCount: z.coerce
      .number()
      .int()
      .min(0)
      .max(50)
      .optional(),
    phone: z.string().trim().min(5).max(40),
    email: z.string().trim().email().max(320),
    checkInDateTime: z.string().min(1).max(50),
    checkOutDateTime: z.string().min(1).max(50),
    idType: z.enum(["ghana_card", "passport", "drivers_license"]),
    idNumber: z.string().trim().min(1).max(120),
    idPhotoUrl: z.string().trim().min(1),
    eta: z.string().trim().min(1).max(120),
    paymentMethod: z.enum(["momo", "cash"]),
    paymentStatus: z.enum(["pending", "paid"]),
    paymentNote: z.string().max(500).optional(),
  })
  .superRefine((data, ctx) => {
    if (!data.nationality.toLowerCase().includes("ghana")) {
      if (!data.passportNumber?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Passport number is required for non-Ghanaian guests.",
          path: ["passportNumber"],
        });
      }
    }
  });

export const createBookingSchema = z.object({
  roomId: z.string().trim().min(1),
  clientUserId: z.string().trim().min(1),
  checkInDate: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/),
  checkOutDate: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/),
  guestDetails: guestDetailsSchema,
});

export const patchRoomSchema = z.object({
  roomNumber: z.string().trim().min(1).max(20).optional(),
  priceGhs: z.coerce.number().min(0).optional(),
  kind: z.enum(["guest", "conference"]).optional(),
});

export const createRoomSchema = z.object({
  roomNumber: z.string().trim().min(1).max(20),
  priceGhs: z.coerce.number().min(0),
  kind: z.enum(["guest", "conference"]).optional(),
});
