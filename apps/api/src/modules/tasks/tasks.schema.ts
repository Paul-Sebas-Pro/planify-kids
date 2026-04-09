import { z } from "zod";

const frequencyEnum = z.enum(["daily", "weekly", "monthly"]);

export const createTaskSchema = z.object({
  name: z.string().min(1, "Nom requis").max(100),
  description: z.string().max(500).optional(),
  icon: z.string().max(50).optional(),
  difficulty: z.number().int().min(1).max(3),
  duration: z.number().int().min(1).max(480, "Durée max 8h"),
  points: z.number().int().min(1).max(100),
  frequency: frequencyEnum,
  isMandatory: z.boolean().default(false),
});

export const updateTaskSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  icon: z.string().max(50).optional(),
  difficulty: z.number().int().min(1).max(3).optional(),
  duration: z.number().int().min(1).max(480).optional(),
  points: z.number().int().min(1).max(100).optional(),
  frequency: frequencyEnum.optional(),
  isMandatory: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
