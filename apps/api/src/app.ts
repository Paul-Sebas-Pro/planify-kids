import { Hono } from "hono";
import type { Context } from "hono";
import { cors } from "hono/cors";
import mongoose from "mongoose";
import { env } from "./config/env.js";
import { prisma } from "./config/database.js";
import { errorMiddleware } from "./core/middleware/error.middleware.js";
import { requestLogger } from "./core/middleware/request-logger.js";
import { captureException } from "./config/sentry.js";
import { authRoutes } from "./modules/auth/auth.routes.js";
import { membersRoutes } from "./modules/members/members.routes.js";
import { tasksRoutes } from "./modules/tasks/tasks.routes.js";
import { planningRoutes } from "./modules/planning/planning.routes.js";
import { familyStatsRoutes } from "./modules/members/family.stats.routes.js";
import { familySettingsRoutes } from "./modules/members/family.settings.routes.js";
import { familyReportRoutes } from "./modules/members/family.report.routes.js";
import { exchangesRoutes } from "./modules/exchanges/exchanges.routes.js";
import { rewardsRoutes } from "./modules/rewards/rewards.routes.js";
import { badgesRoutes } from "./modules/badges/badges.routes.js";
import { notificationsRoutes } from "./modules/notifications/notifications.routes.js";
import { logsRoutes } from "./modules/logs/logs.routes.js";
import { eventsRoutes } from "./modules/events/events.routes.js";
import { challengesRoutes } from "./modules/challenges/challenges.routes.js";

const app = new Hono();

// ─── Middlewares globaux ──────────────────────────────────────
app.use("*", requestLogger);
app.use(
  "*",
  cors({
    origin: env.CORS_ORIGINS.split(","),
    allowMethods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
  }),
);

// ─── Health check ─────────────────────────────────────────────
app.get("/health", async (c: Context) => {
  const [dbResult, mongoResult] = await Promise.allSettled([
    prisma.$queryRawUnsafe("SELECT 1"),
    Promise.resolve(mongoose.connection.readyState === 1),
  ]);
  const db = dbResult.status === "fulfilled" ? "ok" : "error";
  const mongo =
    mongoResult.status === "fulfilled" && mongoResult.value ? "ok" : "error";
  const healthy = db === "ok" && mongo === "ok";
  return c.json(
    { status: healthy ? "ok" : "degraded", env: env.NODE_ENV, db, mongo },
    healthy ? 200 : 503,
  );
});

// ─── Routes ───────────────────────────────────────────────────
app.route("/auth", authRoutes);
app.route("/family/members", membersRoutes);
app.route("/tasks", tasksRoutes);
app.route("/planning", planningRoutes);
app.route("/family/stats", familyStatsRoutes);
app.route("/family/report", familyReportRoutes);
app.route("/family", familySettingsRoutes);
app.route("/exchanges", exchangesRoutes);
app.route("/rewards", rewardsRoutes);
app.route("/badges", badgesRoutes);
app.route("/notifications", notificationsRoutes);
app.route("/logs", logsRoutes);
app.route("/events", eventsRoutes);
app.route("/challenges", challengesRoutes);

// ─── Gestion d'erreurs ────────────────────────────────────────
app.onError((err: unknown, c: Context) => {
  captureException(err, { path: c.req.path, method: c.req.method });
  return errorMiddleware(err, c);
});
app.notFound((c: Context) => c.json({ error: "Route introuvable" }, 404));

export default app;
