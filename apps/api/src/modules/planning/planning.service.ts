import type { FamilyMember } from "@prisma/client";
import { AppError, NotFoundError } from "../../core/errors/AppError.js";
import { getTasksByFamily } from "../tasks/tasks.repository.js";
import { getMembersByFamily } from "../members/members.repository.js";
import { generatePlanningGreedy } from "../../services/planning-greedy.js";
import {
  createScheduleWithItems,
  getSchedulesByFamily,
  getScheduleWithItems,
  getScheduleItemWithTask,
  getMemberLoadHistory,
  updateScheduleItem,
  deleteSchedule,
} from "./planning.repository.js";
import {
  awardPointsForTask,
  revokePointsForTask,
} from "../../services/gamification.js";
import { notifyTaskCompleted, notifyTasksAssigned } from "../notifications/notifications.service.js";
import { sseEmit } from "../../services/sse.service.js";
import type {
  GeneratePlanningInput,
  UpdateScheduleItemInput,
} from "./planning.schema.js";

export async function generatePlanningService(
  familyId: string,
  input: GeneratePlanningInput,
) {
  const startDate = new Date(input.startDate);
  const endDate = new Date(input.endDate);

  if (endDate < startDate) {
    throw new AppError("La date de fin doit être après la date de début", 400);
  }

  const tasks = await getTasksByFamily(familyId, true);
  const members = await getMembersByFamily(familyId);
  const children = members.filter((m: FamilyMember) => m.role === "CHILD");

  if (children.length === 0) {
    throw new AppError("Aucun enfant dans la famille", 400);
  }

  if (tasks.length === 0) {
    throw new AppError("Aucune tâche active dans la famille", 400);
  }

  const initialLoad = await getMemberLoadHistory(familyId, startDate);
  const assignments = generatePlanningGreedy(
    tasks,
    children,
    startDate,
    endDate,
    initialLoad,
  );
  const schedule = await createScheduleWithItems(familyId, startDate, endDate, assignments);

  // Notifie chaque enfant du nombre de tâches qui lui sont assignées
  const countByMember = new Map<string, number>();
  for (const a of assignments) {
    countByMember.set(a.assignedToMemberId, (countByMember.get(a.assignedToMemberId) ?? 0) + 1);
  }
  await Promise.all(
    [...countByMember.entries()].map(([memberId, count]) =>
      notifyTasksAssigned(memberId, familyId, count),
    ),
  );

  return schedule;
}

export function listSchedulesService(familyId: string, limit: number) {
  return getSchedulesByFamily(familyId, limit);
}

export async function getScheduleService(scheduleId: string, familyId: string) {
  const schedule = await getScheduleWithItems(scheduleId, familyId);
  if (!schedule) throw new NotFoundError("Planning");
  return schedule;
}

export async function updateScheduleItemService(
  itemId: string,
  input: UpdateScheduleItemInput,
) {
  const before = await getScheduleItemWithTask(itemId);
  const updated = await updateScheduleItem(itemId, input);

  if (before && input.status === "COMPLETED" && before.status !== "COMPLETED") {
    await awardPointsForTask(before.assignedToMemberId, before.task.points);
    await notifyTaskCompleted(
      before.schedule.familyId,
      before.member.name,
      before.task.name,
    );
    sseEmit(before.schedule.familyId, "task_completed", {
      memberName: before.member.name,
      taskName: before.task.name,
      points: before.task.points,
    });
  } else if (
    before &&
    input.status !== "COMPLETED" &&
    before.status === "COMPLETED"
  ) {
    // Retour en arrière (undo) depuis COMPLETED — retire les points crédités à tort
    await revokePointsForTask(before.assignedToMemberId, before.task.points);
  }

  return updated;
}

export async function deleteScheduleService(
  scheduleId: string,
  familyId: string,
) {
  const result = await deleteSchedule(scheduleId, familyId);
  if (result.count === 0) throw new NotFoundError("Planning");
}
