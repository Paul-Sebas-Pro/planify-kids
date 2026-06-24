export type NotificationType = "TASK_COMPLETED" | "CLAIM_APPROVED" | "CLAIM_REJECTED";

export interface Notification {
  id: string;
  memberId: string;
  familyId: string;
  type: NotificationType;
  message: string;
  readAt: string | null;
  createdAt: string;
}
