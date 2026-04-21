import { z } from "zod";

export const proposeExchangeSchema = z.object({
  scheduleItemId: z.string().uuid(),
  fromMemberId: z.string().uuid(),
  toMemberId: z.string().uuid(),
});

export const respondExchangeSchema = z.object({
  status: z.enum(["ACCEPTED", "REFUSED"]),
});

export type ProposeExchangeInput = z.infer<typeof proposeExchangeSchema>;
export type RespondExchangeInput = z.infer<typeof respondExchangeSchema>;
