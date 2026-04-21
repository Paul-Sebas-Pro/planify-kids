import { prisma } from "../../config/database";
import type { ProposeExchangeInput } from "./exchanges.schema";

const exchangeInclude = {
  scheduleItem: {
    select: {
      date: true,
      task: { select: { name: true, icon: true, points: true } },
    },
  },
};

export function getExchangesByFamily(familyId: string) {
  return prisma.taskExchange.findMany({
    where: { scheduleItem: { schedule: { familyId } } },
    include: exchangeInclude,
    orderBy: { createdAt: "desc" },
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

export function createExchange(input: ProposeExchangeInput) {
  return prisma.taskExchange.create({
    data: {
      scheduleItemId: input.scheduleItemId,
      fromMemberId: input.fromMemberId,
      toMemberId: input.toMemberId,
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
