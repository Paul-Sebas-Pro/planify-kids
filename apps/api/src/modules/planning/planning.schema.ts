import { z } from "zod";

export const generatePlanningSchema = z.object({
  startDate: z.iso.date(),
  endDate: z.iso.date(),
});

export const updateScheduleItemSchema = z.object({
  status: z.enum(["PENDING", "COMPLETED", "SKIPPED"]),
});

export const calendarQuerySchema = z.object({
  startDate: z.iso.date(),
  endDate: z.iso.date(),
});

export type GeneratePlanningInput = z.infer<typeof generatePlanningSchema>;
export type UpdateScheduleItemInput = z.infer<typeof updateScheduleItemSchema>;
export type CalendarQueryInput = z.infer<typeof calendarQuerySchema>;
