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
  getFamilySchoolZone,
  updateScheduleItem,
  deleteSchedule,
} from "./planning.repository.js";
import { classifyDays, getCalendarEntries } from "../../services/school-calendar.js";
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

// Règle métier 5 (cahier des charges) : 80% de la charge de tâches va aux enfants.
const CHILD_SHARE = 0.8;

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
  const parents = members.filter((m: FamilyMember) => m.role === "PARENT");

  if (children.length === 0) {
    throw new AppError("Aucun enfant dans la famille", 400);
  }

  if (tasks.length === 0) {
    throw new AppError("Aucune tâche active dans la famille", 400);
  }

  // Règle métier 5 (cahier des charges) : répartition 80% enfants / 20% parents.
  // Poids relatif par membre = part du groupe divisée par sa taille, comparé
  // ensuite à la charge cumulée dans generatePlanningGreedy (charge / poids).
  const childWeight = CHILD_SHARE / children.length;
  const parentWeight = parents.length > 0 ? (1 - CHILD_SHARE) / parents.length : 0;
  const pool = [
    ...children.map((c) => ({ id: c.id, weight: childWeight })),
    ...parents.map((p) => ({ id: p.id, weight: parentWeight })),
  ];

  const initialLoad = await getMemberLoadHistory(familyId, startDate);

  // Créneau midi+soir les jours sans école (weekend, férié, vacances) —
  // uniquement si la famille a renseigné sa zone (Paramètres) ; sinon
  // comportement historique (1 créneau/jour, le soir).
  const schoolZone = await getFamilySchoolZone(familyId);
  const dayTypes = schoolZone
    ? await classifyDays(schoolZone, startDate, endDate)
    : new Map<string, "SCHOOL_DAY" | "OFF_DAY">();

  const assignments = generatePlanningGreedy(
    tasks,
    pool,
    startDate,
    endDate,
    initialLoad,
    dayTypes,
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

// Jours fériés/vacances de la zone scolaire famille — [] si aucune zone configurée.
export async function getSchoolCalendarService(
  familyId: string,
  startDate: string,
  endDate: string,
) {
  const schoolZone = await getFamilySchoolZone(familyId);
  if (!schoolZone) return [];
  return getCalendarEntries(schoolZone, new Date(startDate), new Date(endDate));
}

export async function updateScheduleItemService(
  itemId: string,
  familyId: string,
  input: UpdateScheduleItemInput,
) {
  const before = await getScheduleItemWithTask(itemId);
  // Multi-tenant : un item d'une autre famille est traité comme inexistant
  // (404, ne révèle pas son existence) — sinon n'importe quel compte pourrait
  // créditer/retirer des points dans une autre famille.
  if (!before || before.schedule.familyId !== familyId) {
    throw new NotFoundError("Tâche planifiée");
  }
  const updated = await updateScheduleItem(itemId, input);

  if (input.status === "COMPLETED" && before.status !== "COMPLETED") {
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
  } else if (input.status !== "COMPLETED" && before.status === "COMPLETED") {
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
