import { z } from "zod";

export const createRewardSchema = z.object({
  name: z.string().min(1).max(100),
  icon: z.string().min(1),
  pointsCost: z.number().int().positive(),
});

export const updateRewardSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  icon: z.string().min(1).optional(),
  pointsCost: z.number().int().positive().optional(),
});

export const claimRewardSchema = z.object({
  memberId: z.uuid(),
});

export const reviewClaimSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED"]),
});

export type CreateRewardInput = z.infer<typeof createRewardSchema>;
export type UpdateRewardInput = z.infer<typeof updateRewardSchema>;
export type ClaimRewardInput = z.infer<typeof claimRewardSchema>;
export type ReviewClaimInput = z.infer<typeof reviewClaimSchema>;
