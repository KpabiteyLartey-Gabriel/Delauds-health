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

export const forgotPasswordSchema = z.object({
  email: z.string().trim().email().max(320),
});

export const resetPasswordSchema = z.object({
  token: z.string().trim().min(32).max(512),
  password: z.string().min(8).max(128),
});

export const adminResetPortalSchema = z.object({
  userId: z.string().trim().min(1),
  password: z.string().min(8).max(128),
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
    paymentMethod: z.enum(["momo", "telecel_cash", "card", "cash"]),
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

export const createBookingSchema = z
  .object({
    roomId: z.string().trim().min(1).optional(),
    roomIds: z.array(z.string().trim().min(1)).min(1).max(10).optional(),
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
  })
  .superRefine((data, ctx) => {
    const hasRoomId = !!data.roomId;
    const hasRoomIds = Array.isArray(data.roomIds) && data.roomIds.length > 0;
    if (!hasRoomId && !hasRoomIds) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "roomId or roomIds is required",
        path: ["roomId"],
      });
    }
  });

export const patchRoomSchema = z.object({
  roomNumber: z.string().trim().min(1).max(20).optional(),
  priceGhs: z.coerce.number().min(0).optional(),
  kind: z.enum(["guest", "conference"]).optional(),
  description: z.string().trim().max(500).optional(),
  imageUrls: z.array(z.string().min(1)).max(5).optional(),
});

export const createRoomSchema = z.object({
  roomNumber: z.string().trim().min(1).max(20),
  priceGhs: z.coerce.number().min(0),
  kind: z.enum(["guest", "conference"]).optional(),
  description: z.string().trim().max(500).optional(),
  imageUrls: z.array(z.string().min(1)).max(5).optional(),
});
