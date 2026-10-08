import { Hono } from "hono";
import { timingSafeEqual } from "node:crypto";
import { env } from "../../config/env.js";
import {
  runPlanningGeneration,
  runTaskReminders,
  runForgottenTasks,
  runCalendarSync,
} from "../../services/planning-cron.js";

// Tâches planifiées déclenchées par Vercel Cron Jobs (vercel.json) : sur
// Vercel serverless, node-cron ne tourne jamais (pas de process permanent).
// Vercel appelle GET /api/cron/<job> avec `Authorization: Bearer <CRON_SECRET>`.
const jobs: Record<string, () => Promise<unknown>> = {
  planning: runPlanningGeneration,
  reminders: runTaskReminders,
  forgotten: runForgottenTasks,
  calendar: runCalendarSync,
};

function isAuthorized(header: string | undefined): boolean {
  const secret = env.CRON_SECRET;
  // Secret non configuré : routes fermées, jamais ouvertes par défaut.
  if (!secret || !header) return false;
  const expected = Buffer.from(`Bearer ${secret}`);
  const received = Buffer.from(header);
  return (
    expected.length === received.length && timingSafeEqual(expected, received)
  );
}

export const cronRoutes = new Hono();

// `:slot` n'est pas lu : il rend chaque chemin unique dans vercel.json (un
// cron « rappels » par heure UTC — une exécution/jour max par cron en Hobby).
cronRoutes.get("/:job/:slot?", async (c) => {
  if (!isAuthorized(c.req.header("Authorization"))) {
    return c.json({ success: false, error: "Non autorisé" }, 401);
  }
  const job = jobs[c.req.param("job")];
  if (!job) {
    return c.json({ success: false, error: "Tâche inconnue" }, 404);
  }
  const result = await job();
  return c.json({ success: true, data: result });
});
