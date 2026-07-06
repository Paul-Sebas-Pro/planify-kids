import { prisma } from "../../config/database.js";
import type { Prisma } from "@prisma/client";
import type { GreedyAssignment } from "../../services/planning-greedy.js";
import type { UpdateScheduleItemInput } from "./planning.schema.js";

export function getSchedulesByFamily(familyId: string, limit = 20) {
  return prisma.schedule.findMany({
    where: { familyId },
    orderBy: { startDate: "desc" },
    take: limit,
    select: {
      id: true,
      familyId: true,
      startDate: true,
      endDate: true,
      generatedByAI: true,
      createdAt: true,
      _count: { select: { items: true } },
    },
  });
}

export function getScheduleWithItems(scheduleId: string, familyId: string) {
  return prisma.schedule.findFirst({
    where: { id: scheduleId, familyId },
    include: {
      items: {
        orderBy: { date: "asc" },
        include: {
          task: {
            select: { name: true, icon: true, points: true, difficulty: true },
          },
          member: {
            select: { name: true, color: true, avatar: true },
          },
        },
      },
    },
  });
}

export function createScheduleWithItems(
  familyId: string,
  startDate: Date,
  endDate: Date,
  assignments: GreedyAssignment[],
) {
  return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const schedule = await tx.schedule.create({
      data: { familyId, startDate, endDate, generatedByAI: true },
    });

    if (assignments.length > 0) {
      await tx.scheduleItem.createMany({
        data: assignments.map((a) => ({
          scheduleId: schedule.id,
          taskTemplateId: a.taskTemplateId,
          assignedToMemberId: a.assignedToMemberId,
          date: a.date,
          status: "PENDING",
        })),
      });
    }

    return schedule;
  });
}

const LOAD_HISTORY_WINDOW_DAYS = 28;

export async function getMemberLoadHistory(
  familyId: string,
  beforeDate: Date,
): Promise<Map<string, number>> {
  const since = new Date(beforeDate);
  since.setDate(since.getDate() - LOAD_HISTORY_WINDOW_DAYS);

  const items = await prisma.scheduleItem.findMany({
    where: {
      schedule: { familyId },
      date: { gte: since, lt: beforeDate },
    },
    select: {
      assignedToMemberId: true,
      task: { select: { points: true } },
    },
  });

  const load = new Map<string, number>();
  for (const item of items) {
    load.set(
      item.assignedToMemberId,
      (load.get(item.assignedToMemberId) ?? 0) + item.task.points,
    );
  }
  return load;
}

export function getScheduleItemWithTask(itemId: string) {
  return prisma.scheduleItem.findUnique({
    where: { id: itemId },
    select: {
      status: true,
      assignedToMemberId: true,
      task: { select: { points: true, name: true } },
      member: { select: { name: true } },
      schedule: { select: { familyId: true } },
    },
  });
}

export function updateScheduleItem(
  itemId: string,
  input: UpdateScheduleItemInput,
) {
  return prisma.scheduleItem.update({
    where: { id: itemId },
    data: {
      status: input.status,
      completedAt: input.status === "COMPLETED" ? new Date() : null,
    },
  });
}

export function deleteSchedule(scheduleId: string, familyId: string) {
  return prisma.schedule.deleteMany({
    where: { id: scheduleId, familyId },
  });
}
