import cron from "node-cron";
import { prisma } from "../config/database.js";
import { generatePlanningService } from "../modules/planning/planning.service.js";
import {
  notifyTasksReminder,
  notifyTasksForgotten,
} from "../modules/notifications/notifications.service.js";
import { syncCalendarZone } from "./school-calendar.js";
import {
  familyTimezone,
  localDayKey,
  localHour,
  scheduleDayRange,
} from "./timezone.js";

function nextWeekRange(): { startDate: string; endDate: string } {
  const today = new Date();
  const dow = today.getDay(); // 0=dim
  const daysToMonday = ((7 - ((dow + 6) % 7)) % 7) || 7;
  const monday = new Date(today);
  monday.setDate(today.getDate() + daysToMonday);
  monday.setHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return {
    startDate: monday.toISOString().slice(0, 10),
    endDate: sunday.toISOString().slice(0, 10),
  };
}

// Les tâches planifiées sont des fonctions exportées : appelées par node-cron
// en local/Docker (start*Cron ci-dessous) et par les routes /cron/* sur
// Vercel, où node-cron ne tourne pas (serverless — cf. modules/cron).

/** Génère le planning de la semaine suivante pour chaque famille qui n'en a
 *  pas encore. Idempotent : relancer ne crée pas de doublon. */
export async function runPlanningGeneration(): Promise<{ created: number }> {
  console.log("[cron] Génération auto-planning semaine suivante…");
  const { startDate, endDate } = nextWeekRange();
  const start = new Date(startDate);
  const end = new Date(endDate);

  const families = await prisma.family.findMany({ select: { id: true } });

  let created = 0;
  for (const family of families) {
    try {
      const existing = await prisma.schedule.findFirst({
        where: {
          familyId: family.id,
          startDate: { lte: end },
          endDate: { gte: start },
        },
      });

      if (!existing) {
        await generatePlanningService(family.id, { startDate, endDate });
        created += 1;
        console.log(`[cron] Planning créé — famille ${family.id}`);
      }
    } catch (err) {
      // Erreur isolée par famille (pas de tâches, pas d'enfants, etc.)
      console.warn(`[cron] Ignoré famille ${family.id}:`, (err as Error).message);
    }
  }

  console.log("[cron] Terminé.");
  return { created };
}

export function startPlanningCron(): void {
  // Tous les jours à 00:01
  cron.schedule("1 0 * * *", () => runPlanningGeneration());
  console.log("⏰ Cron planning auto démarré (quotidien 00:01)");
}

// Heures locales (chez chaque famille) des notifications quotidiennes.
export const REMINDER_LOCAL_HOUR = 8;
export const FORGOTTEN_LOCAL_HOUR = 20;

/**
 * Notifie les tâches du jour encore à faire, pour les seules familles où il
 * est `localHourTarget` heures CHEZ ELLES (fuseau déduit de la zone scolaire).
 * Le cron tourne une fois par heure UTC (vercel.json) : chaque famille est
 * donc notifiée une seule fois par jour, à son heure locale — y compris dans
 * les DOM-TOM. « Aujourd'hui » est le jour civil local de la famille.
 */
async function notifyPendingTasksAtLocalHour(
  localHourTarget: number,
  notify: (memberId: string, familyId: string, count: number) => Promise<void>,
  now: Date,
): Promise<number> {
  const families = await prisma.family.findMany({
    select: { id: true, schoolZone: true, timezone: true },
  });

  // Familles concernées, regroupées par jour local (fuseaux différents).
  const familyIdsByDay = new Map<string, string[]>();
  for (const family of families) {
    const tz = familyTimezone(family);
    if (localHour(now, tz) !== localHourTarget) continue;
    const day = localDayKey(now, tz);
    familyIdsByDay.set(day, [...(familyIdsByDay.get(day) ?? []), family.id]);
  }

  let notified = 0;
  for (const [day, familyIds] of familyIdsByDay) {
    const { start, end } = scheduleDayRange(day);
    const items = await prisma.scheduleItem.findMany({
      where: {
        status: "PENDING",
        date: { gte: start, lte: end },
        schedule: { familyId: { in: familyIds } },
      },
      select: { assignedToMemberId: true, schedule: { select: { familyId: true } } },
    });

    const counts = new Map<string, { familyId: string; count: number }>();
    for (const item of items) {
      const entry = counts.get(item.assignedToMemberId);
      if (entry) entry.count += 1;
      else counts.set(item.assignedToMemberId, { familyId: item.schedule.familyId, count: 1 });
    }

    for (const [memberId, { familyId, count }] of counts) {
      try {
        await notify(memberId, familyId, count);
      } catch (err) {
        console.warn(`[cron] Notif ignorée membre ${memberId}:`, (err as Error).message);
      }
    }
    notified += counts.size;
  }

  return notified;
}

/** Rappel du matin (8 h locale) : tâches du jour encore à faire. */
export async function runTaskReminders(
  now: Date = new Date(),
): Promise<{ notified: number }> {
  console.log("[cron] Rappel tâches du jour…");
  const notified = await notifyPendingTasksAtLocalHour(
    REMINDER_LOCAL_HOUR,
    notifyTasksReminder,
    now,
  );
  console.log(`[cron] Rappel envoyé à ${notified} membre(s).`);
  return { notified };
}

/** Alerte du soir (20 h locale) : tâches du jour toujours pas faites. */
export async function runForgottenTasks(
  now: Date = new Date(),
): Promise<{ notified: number }> {
  console.log("[cron] Alerte tâches oubliées…");
  const notified = await notifyPendingTasksAtLocalHour(
    FORGOTTEN_LOCAL_HOUR,
    notifyTasksForgotten,
    now,
  );
  console.log(`[cron] Alerte envoyée à ${notified} membre(s).`);
  return { notified };
}

export function startTaskReminderCron(): void {
  // Toutes les heures : chaque famille est notifiée à 8 h dans SON fuseau
  cron.schedule("0 * * * *", () => runTaskReminders());
  console.log("⏰ Cron rappel tâches démarré (horaire, 8 h locale par famille)");
}

export function startForgottenTaskCron(): void {
  // Toutes les heures : chaque famille est alertée à 20 h dans SON fuseau
  cron.schedule("0 * * * *", () => runForgottenTasks());
  console.log("⏰ Cron tâches oubliées démarré (horaire, 20 h locale par famille)");
}

/** Rafraîchit le cache jours fériés/vacances pour chaque zone réellement
 *  utilisée par une famille (le lazy-fill de school-calendar.ts reste le
 *  filet de sécurité pour une zone jamais synchronisée). */
export async function runCalendarSync(): Promise<{ zones: number }> {
  console.log("[cron] Sync calendrier jours fériés/vacances…");
  const zones = await prisma.family.findMany({
    where: { schoolZone: { not: null } },
    select: { schoolZone: true },
    distinct: ["schoolZone"],
  });

  let synced = 0;
  for (const { schoolZone } of zones) {
    if (!schoolZone) continue;
    try {
      await syncCalendarZone(schoolZone);
      synced += 1;
      console.log(`[cron] Zone synchronisée — ${schoolZone}`);
    } catch (err) {
      console.warn(`[cron] Échec sync zone ${schoolZone}:`, (err as Error).message);
    }
  }

  console.log("[cron] Sync calendrier terminée.");
  return { zones: synced };
}

export function startCalendarSyncCron(): void {
  // Tous les dimanches à 03:00
  cron.schedule("0 3 * * 0", () => runCalendarSync());
  console.log("⏰ Cron sync calendrier démarré (hebdomadaire, dimanche 03:00)");
}
