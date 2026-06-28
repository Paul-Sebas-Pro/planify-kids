import { prisma } from "../../config/database.js";
import type { CreateChallengeInput } from "./challenges.schema.js";

export function getChallengesByFamily(familyId: string) {
  return prisma.familyChallenge.findMany({
    where: { familyId },
    orderBy: { startDate: "desc" },
  });
}

export function getChallengeById(id: string, familyId: string) {
  return prisma.familyChallenge.findFirst({ where: { id, familyId } });
}

export function createChallenge(familyId: string, input: CreateChallengeInput) {
  return prisma.familyChallenge.create({
    data: {
      familyId,
      title: input.title,
      ...(input.description !== undefined && { description: input.description }),
      targetPoints: input.targetPoints,
      bonusPoints: input.bonusPoints,
      startDate: new Date(input.startDate),
      endDate: new Date(input.endDate),
    },
  });
}

export function updateChallengeStatus(
  id: string,
  status: "ACTIVE" | "FAILED" | "COMPLETED",
  completedAt?: Date,
) {
  return prisma.familyChallenge.update({
    where: { id },
    data: { status, ...(completedAt !== undefined && { completedAt }) },
  });
}

export function getActiveChallengesForFamily(familyId: string, date: Date) {
  return prisma.familyChallenge.findMany({
    where: {
      familyId,
      status: "ACTIVE",
      startDate: { lte: date },
      endDate: { gte: date },
    },
  });
}

export async function sumPointsInPeriod(
  familyId: string,
  start: Date,
  end: Date,
): Promise<number> {
  const items = await prisma.scheduleItem.findMany({
    where: {
      status: "COMPLETED",
      date: { gte: start, lte: new Date(end.toISOString().replace("T00:00:00.000Z", "T23:59:59.999Z")) },
      schedule: { familyId },
    },
    include: { task: { select: { points: true } } },
  });
  return items.reduce(
    (sum: number, item: { task: { points: number } }) => sum + item.task.points,
    0,
  );
}

export function awardBonusToAllMembers(familyId: string, bonusPoints: number) {
  return prisma.familyMember.updateMany({
    where: { familyId, role: "CHILD" },
    data: { points: { increment: bonusPoints } },
  });
}
