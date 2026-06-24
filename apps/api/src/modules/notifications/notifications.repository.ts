import { prisma } from "../../config/database";
import type { NotificationType } from "@prisma/client";

export function getNotifications(memberId: string, familyId: string, limit = 30) {
  return prisma.notification.findMany({
    where: { memberId, familyId },
    orderBy: [{ readAt: "asc" }, { createdAt: "desc" }],
    take: limit,
  });
}

export function countUnread(memberId: string, familyId: string) {
  return prisma.notification.count({
    where: { memberId, familyId, readAt: null },
  });
}

export function createNotification(
  memberId: string,
  familyId: string,
  type: NotificationType,
  message: string,
) {
  return prisma.notification.create({
    data: { memberId, familyId, type, message },
  });
}

export function createManyNotifications(
  data: { memberId: string; familyId: string; type: NotificationType; message: string }[],
) {
  if (data.length === 0) return Promise.resolve({ count: 0 });
  return prisma.notification.createMany({ data });
}

export function markRead(id: string, memberId: string) {
  return prisma.notification.updateMany({
    where: { id, memberId },
    data: { readAt: new Date() },
  });
}

export function markAllRead(memberId: string, familyId: string) {
  return prisma.notification.updateMany({
    where: { memberId, familyId, readAt: null },
    data: { readAt: new Date() },
  });
}
