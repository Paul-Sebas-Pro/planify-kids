import { z } from "zod";

export const createChallengeSchema = z.object({
  title: z.string().min(1).max(120),
  description: z.string().max(500).optional(),
  targetPoints: z.number().int().positive(),
  bonusPoints: z.number().int().positive(),
  startDate: z.iso.date(),
  endDate: z.iso.date(),
});

export const updateChallengeSchema = z.object({
  status: z.enum(["ACTIVE", "FAILED"]).optional(),
});

export type CreateChallengeInput = z.infer<typeof createChallengeSchema>;
export type UpdateChallengeInput = z.infer<typeof updateChallengeSchema>;
