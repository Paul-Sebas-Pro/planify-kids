import { Schema, model, models } from "mongoose";

export type GamificationLogType = "POINTS_EARNED" | "BADGE_EARNED";

export interface IGamificationLog {
  type: GamificationLogType;
  memberId: string;
  familyId: string;
  data: Record<string, unknown>;
  ts: Date;
}

const schema = new Schema<IGamificationLog>(
  {
    type: { type: String, required: true },
    memberId: { type: String, required: true, index: true },
    familyId: { type: String, required: true, index: true },
    data: { type: Schema.Types.Mixed, required: true },
    ts: { type: Date, default: Date.now, index: true },
  },
  { collection: "gamification_logs" },
);

export const GamificationLog =
  (models["GamificationLog"] as ReturnType<typeof model<IGamificationLog>>) ??
  model<IGamificationLog>("GamificationLog", schema);
