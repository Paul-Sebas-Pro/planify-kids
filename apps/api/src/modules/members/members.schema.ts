import { z } from "zod";

export const createMemberSchema = z.object({
  name: z.string().min(1, "Prénom requis").max(80),
  role: z.enum(["PARENT", "CHILD"]),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Couleur hex invalide")
    .optional(),
  avatar: z.string().max(50).optional(),
  birthDate: z.string().date("Date invalide (YYYY-MM-DD)").optional(),
});

export const updateMemberSchema = z.object({
  name: z.string().min(1).max(80).optional(),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/)
    .optional(),
  avatar: z.string().max(50).optional(),
  birthDate: z.iso.date().optional(),
});

export const updatePinSchema = z.object({
  pin: z.string().regex(/^\d{4}$/, { message: "PIN doit être 4 chiffres" }),
});

export const updateFcmTokenSchema = z.object({
  fcmToken: z.string().min(1).max(4096),
});

export type CreateMemberInput = z.infer<typeof createMemberSchema>;
export type UpdateMemberInput = z.infer<typeof updateMemberSchema>;
export type UpdatePinInput = z.infer<typeof updatePinSchema>;
export type UpdateFcmTokenInput = z.infer<typeof updateFcmTokenSchema>;
