import cron from "node-cron";
import { prisma } from "../config/database.js";
import { generatePlanningService } from "../modules/planning/planning.service.js";
import {
  notifyTasksReminder,
  notifyTasksForgotten,
} from "../modules/notifications/notifications.service.js";
import { syncCalendarZone } from "./school-calendar.js";

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

// Bornes du jour courant en heure LOCALE (pas de setHours+toISOString — voir
// piège timezone documenté : le serveur tourne en Europe/Paris, pas en UTC).
function todayRange(): { start: Date; end: Date } {
  const now = new Date();
  return {
    start: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0),
    end: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999),
  };
}

async function notifyPendingTasksForToday(
  notify: (memberId: string, familyId: string, count: number) => Promise<void>,
): Promise<number> {
  const { start, end } = todayRange();

  const items = await prisma.scheduleItem.findMany({
    where: { status: "PENDING", date: { gte: start, lte: end } },
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

  return counts.size;
}

/** Rappel du matin : tâches du jour encore à faire. */
export async function runTaskReminders(): Promise<{ notified: number }> {
  console.log("[cron] Rappel tâches du jour…");
  const notified = await notifyPendingTasksForToday(notifyTasksReminder);
  console.log(`[cron] Rappel envoyé à ${notified} membre(s).`);
  return { notified };
}

/** Alerte du soir : tâches du jour toujours pas faites. */
export async function runForgottenTasks(): Promise<{ notified: number }> {
  console.log("[cron] Alerte tâches oubliées…");
  const notified = await notifyPendingTasksForToday(notifyTasksForgotten);
  console.log(`[cron] Alerte envoyée à ${notified} membre(s).`);
  return { notified };
}

export function startTaskReminderCron(): void {
  // Tous les jours à 08:00 — rappel des tâches du jour
  cron.schedule("0 8 * * *", () => runTaskReminders());
  console.log("⏰ Cron rappel tâches démarré (quotidien 08:00)");
}

export function startForgottenTaskCron(): void {
  // Tous les jours à 20:00 — alerte tâches du jour toujours pas faites
  cron.schedule("0 20 * * *", () => runForgottenTasks());
  console.log("⏰ Cron tâches oubliées démarré (quotidien 20:00)");
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
