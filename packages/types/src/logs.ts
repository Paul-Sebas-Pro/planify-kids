export type GamificationLogType = "POINTS_EARNED" | "BADGE_EARNED";

export interface GamificationEvent {
  _id: string;
  type: GamificationLogType;
  memberId: string;
  familyId: string;
  data: Record<string, unknown>;
  ts: string;
}
