import { prisma } from "../../config/database";
import {
  getNotifications,
  createNotification,
  createManyNotifications,
  markRead,
  markAllRead,
} from "./notifications.repository";

export function listNotificationsService(memberId: string, familyId: string) {
  return getNotifications(memberId, familyId);
}

export function markReadService(id: string, memberId: string, familyId: string) {
  return markRead(id, memberId);
}

export function markAllReadService(memberId: string, familyId: string) {
  return markAllRead(memberId, familyId);
}

export async function notifyTaskCompleted(
  familyId: string,
  childName: string,
  taskName: string,
) {
  const parents = await prisma.familyMember.findMany({
    where: { familyId, role: "PARENT" },
    select: { id: true },
  });
  await createManyNotifications(
    parents.map((p) => ({
      memberId: p.id,
      familyId,
      type: "TASK_COMPLETED" as const,
      message: `${childName} a complété "${taskName}" ✓`,
    })),
  );
}

export async function notifyClaimReviewed(
  memberId: string,
  familyId: string,
  rewardName: string,
  approved: boolean,
) {
  await createNotification(
    memberId,
    familyId,
    approved ? "CLAIM_APPROVED" : "CLAIM_REJECTED",
    approved
      ? `Ta demande pour "${rewardName}" a été approuvée ! 🎉`
      : `Ta demande pour "${rewardName}" a été refusée.`,
  );
}
