import type { FamilyMember } from "@prisma/client";
import { AppError, NotFoundError } from "../../core/errors/AppError";
import { getTasksByFamily } from "../tasks/tasks.repository";
import { getMembersByFamily } from "../members/members.repository";
import { generatePlanningGreedy } from "../../services/planning-greedy";
import {
  createScheduleWithItems,
  getSchedulesByFamily,
  getScheduleWithItems,
  updateScheduleItem,
  deleteSchedule,
} from "./planning.repository";
import type {
  GeneratePlanningInput,
  UpdateScheduleItemInput,
} from "./planning.schema";

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

  const assignments = generatePlanningGreedy(
    tasks,
    children,
    startDate,
    endDate,
  );
  return createScheduleWithItems(familyId, startDate, endDate, assignments);
}

export function listSchedulesService(familyId: string) {
  return getSchedulesByFamily(familyId);
}

export async function getScheduleService(scheduleId: string, familyId: string) {
  const schedule = await getScheduleWithItems(scheduleId, familyId);
  if (!schedule) throw new NotFoundError("Planning");
  return schedule;
}

export function updateScheduleItemService(
  itemId: string,
  input: UpdateScheduleItemInput,
) {
  return updateScheduleItem(itemId, input);
}

export async function deleteScheduleService(
  scheduleId: string,
  familyId: string,
) {
  const result = await deleteSchedule(scheduleId, familyId);
  if (result.count === 0) throw new NotFoundError("Planning");
}
