import { z } from "zod";

export const generatePlanningSchema = z.object({
  startDate: z.iso.date(),
  endDate: z.iso.date(),
});

const taskStatusSchema = z.enum(["PENDING", "COMPLETED", "SKIPPED"]);

export const updateScheduleItemSchema = z.object({
  status: taskStatusSchema,
  // Statut que le client avait sous les yeux avant sa modification (envoyé
  // par la tablette pour les écritures hors ligne). S'il ne correspond plus
  // au serveur, quelqu'un a modifié l'item entre-temps → 409, le serveur
  // garde la décision la plus récente (stratégie de conflit validée : A).
  expectedStatus: taskStatusSchema.optional(),
});

export const calendarQuerySchema = z.object({
  startDate: z.iso.date(),
  endDate: z.iso.date(),
});

export type GeneratePlanningInput = z.infer<typeof generatePlanningSchema>;
export type UpdateScheduleItemInput = z.infer<typeof updateScheduleItemSchema>;
export type CalendarQueryInput = z.infer<typeof calendarQuerySchema>;
