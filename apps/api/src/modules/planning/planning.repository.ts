import { prisma } from "../../config/database.js";
import type { Prisma, TaskStatus } from "@prisma/client";
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
        // date encode déjà l'heure (12h=midi, 19h=soir) — le tri chronologique suffit
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

export function getFamilySchoolZone(familyId: string) {
  return prisma.family
    .findUniqueOrThrow({ where: { id: familyId }, select: { schoolZone: true } })
    .then((f) => f.schoolZone);
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
          slot: a.slot,
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
      updatedAt: true,
      assignedToMemberId: true,
      task: { select: { points: true, name: true } },
      member: { select: { name: true } },
      schedule: { select: { familyId: true } },
    },
  });
}

export function getScheduleItem(itemId: string) {
  return prisma.scheduleItem.findUnique({ where: { id: itemId } });
}

/**
 * Change le statut d'un item ET ajuste les points de l'enfant dans une seule
 * transaction : soit les deux sont enregistrés, soit aucun. Séparées, une
 * erreur entre les deux (réseau, base saturée, timeout Vercel — vu en prod)
 * laissait une tâche « Fait » sans ses points, et le nouvel essai de la
 * tablette était refusé (date de modification changée) : points perdus.
 *
 * Écriture conditionnelle (compare-and-set) sur statut + date de
 * modification : une modification concurrente fait échouer l'écriture
 * (renvoie null, rien n'est modifié) — pas de double crédit possible.
 */
export function updateScheduleItemWithPoints(
  itemId: string,
  expected: { status: TaskStatus; updatedAt: Date },
  status: TaskStatus,
  points: { memberId: string; delta: number } | null,
) {
  return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const now = new Date();
    const { count } = await tx.scheduleItem.updateMany({
      where: { id: itemId, status: expected.status, updatedAt: expected.updatedAt },
      data: {
        status,
        completedAt: status === "COMPLETED" ? now : null,
        updatedAt: now,
      },
    });
    if (count === 0) return null;

    const member =
      points && points.delta !== 0
        ? await tx.familyMember.update({
            where: { id: points.memberId },
            data: { points: { increment: points.delta } },
            select: { id: true, points: true, familyId: true, createdAt: true },
          })
        : null;
    const item = await tx.scheduleItem.findUnique({ where: { id: itemId } });
    return { item, member };
  });
}

export function deleteSchedule(scheduleId: string, familyId: string) {
  return prisma.schedule.deleteMany({
    where: { id: scheduleId, familyId },
  });
}
