import { prisma } from "../../config/database.js";
import { sendPushNotification } from "../../config/firebase.js";
import {
  getNotifications,
  createNotification,
  createManyNotifications,
  markRead,
  markAllRead,
} from "./notifications.repository.js";

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

export async function notifyBadgeEarned(
  memberId: string,
  familyId: string,
  badgeName: string,
) {
  const message = `Nouveau badge débloqué : "${badgeName}" 🏅`;

  await createNotification(memberId, familyId, "BADGE_EARNED", message);

  const member = await prisma.familyMember.findUnique({
    where: { id: memberId },
    select: { fcmToken: true },
  });

  if (member?.fcmToken) {
    await sendPushNotification(
      member.fcmToken,
      "Badge débloqué 🏅",
      message,
      { type: "BADGE_EARNED", familyId },
    );
  }
}

export async function notifyTasksReminder(
  memberId: string,
  familyId: string,
  count: number,
) {
  const message = `Tu as ${count} tâche${count > 1 ? "s" : ""} à faire aujourd'hui !`;

  await createNotification(memberId, familyId, "TASKS_REMINDER", message);

  const member = await prisma.familyMember.findUnique({
    where: { id: memberId },
    select: { fcmToken: true },
  });

  if (member?.fcmToken) {
    await sendPushNotification(
      member.fcmToken,
      "Tâches du jour ☀️",
      message,
      { type: "TASKS_REMINDER", familyId },
    );
  }
}

export async function notifyTasksForgotten(
  memberId: string,
  familyId: string,
  count: number,
) {
  const message = `${count} tâche${count > 1 ? "s" : ""} pas encore faite${count > 1 ? "s" : ""} aujourd'hui !`;

  await createNotification(memberId, familyId, "TASKS_FORGOTTEN", message);

  const member = await prisma.familyMember.findUnique({
    where: { id: memberId },
    select: { fcmToken: true },
  });

  if (member?.fcmToken) {
    await sendPushNotification(
      member.fcmToken,
      "Tâches oubliées ⏰",
      message,
      { type: "TASKS_FORGOTTEN", familyId },
    );
  }
}

export async function notifyTasksAssigned(
  memberId: string,
  familyId: string,
  count: number,
) {
  const message = `Tu as ${count} nouvelle${count > 1 ? "s" : ""} tâche${count > 1 ? "s" : ""} cette semaine !`;

  await createNotification(memberId, familyId, "TASKS_ASSIGNED", message);

  const member = await prisma.familyMember.findUnique({
    where: { id: memberId },
    select: { fcmToken: true },
  });

  if (member?.fcmToken) {
    await sendPushNotification(
      member.fcmToken,
      "Nouveau planning 📋",
      message,
      { type: "TASKS_ASSIGNED", familyId },
    );
  }
}
