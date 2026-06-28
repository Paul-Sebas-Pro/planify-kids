export type TimelineEventType = "TASK_COMPLETED" | "BADGE_EARNED" | "REWARD_CLAIMED";

export interface TimelineEvent {
  type: TimelineEventType;
  date: string;
  title: string;
  description: string | null;
  points: number | null;
  icon: string | null;
}
