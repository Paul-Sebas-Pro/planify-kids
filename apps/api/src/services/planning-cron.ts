import cron from "node-cron";
import { prisma } from "../config/database.js";
import { generatePlanningService } from "../modules/planning/planning.service.js";

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

export function startPlanningCron(): void {
  // Tous les jours à 00:01
  cron.schedule("1 0 * * *", async () => {
    console.log("[cron] Génération auto-planning semaine suivante…");
    const { startDate, endDate } = nextWeekRange();
    const start = new Date(startDate);
    const end = new Date(endDate);

    const families = await prisma.family.findMany({ select: { id: true } });

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
          console.log(`[cron] Planning créé — famille ${family.id}`);
        }
      } catch (err) {
        // Erreur isolée par famille (pas de tâches, pas d'enfants, etc.)
        console.warn(`[cron] Ignoré famille ${family.id}:`, (err as Error).message);
      }
    }

    console.log("[cron] Terminé.");
  });

  console.log("⏰ Cron planning auto démarré (quotidien 00:01)");
}
