import { prisma } from "../../config/database.js";
import type { ProposeExchangeInput } from "./exchanges.schema.js";

const exchangeInclude = {
  scheduleItem: {
    select: {
      date: true,
      assignedToMemberId: true,
      task: { select: { name: true, icon: true, points: true } },
    },
  },
};

export function getExchangesByFamily(
  familyId: string,
  limit = 50,
  status?: "PENDING" | "ACCEPTED" | "REFUSED",
) {
  return prisma.taskExchange.findMany({
    where: {
      scheduleItem: { schedule: { familyId } },
      ...(status !== undefined && { status }),
    },
    include: exchangeInclude,
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

export function getExchangeById(id: string) {
  return prisma.taskExchange.findUnique({
    where: { id },
    include: {
      ...exchangeInclude,
      scheduleItem: {
        select: {
          date: true,
          assignedToMemberId: true,
          schedule: { select: { familyId: true } },
          task: { select: { name: true, icon: true, points: true } },
        },
      },
    },
  });
}

export function getPendingExchangeForItem(scheduleItemId: string) {
  return prisma.taskExchange.findFirst({
    where: { scheduleItemId, status: "PENDING" },
  });
}

export function createExchange(input: ProposeExchangeInput, familyId: string) {
  return prisma.taskExchange.create({
    data: {
      scheduleItemId: input.scheduleItemId,
      fromMemberId: input.fromMemberId,
      toMemberId: input.toMemberId,
      familyId,
    },
    include: exchangeInclude,
  });
}

export function updateExchangeStatus(
  id: string,
  status: "ACCEPTED" | "REFUSED",
) {
  return prisma.taskExchange.update({ where: { id }, data: { status } });
}

export function reassignScheduleItem(
  scheduleItemId: string,
  toMemberId: string,
) {
  return prisma.scheduleItem.update({
    where: { id: scheduleItemId },
    data: { assignedToMemberId: toMemberId },
  });
}
