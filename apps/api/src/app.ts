import { Hono } from "hono";
import type { Context } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { env } from "./config/env.js";
import { errorMiddleware } from "./core/middleware/error.middleware.js";
import { authRoutes } from "./modules/auth/auth.routes.js";
import { membersRoutes } from "./modules/members/members.routes.js";
import { tasksRoutes } from "./modules/tasks/tasks.routes.js";
import { planningRoutes } from "./modules/planning/planning.routes.js";

const app = new Hono();

// ─── Middlewares globaux ──────────────────────────────────────
app.use("*", logger());
app.use(
  "*",
  cors({
    origin: env.CORS_ORIGINS.split(","),
    allowMethods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
  })
);

// ─── Health check ─────────────────────────────────────────────
app.get("/health", (c: Context) => c.json({ status: "ok", env: env.NODE_ENV }));

// ─── Routes ───────────────────────────────────────────────────
app.route("/auth", authRoutes);
app.route("/family/members", membersRoutes);
app.route("/tasks", tasksRoutes);
app.route("/planning", planningRoutes);

// ─── Gestion d'erreurs ────────────────────────────────────────
app.onError((err: unknown, c: Context) => errorMiddleware(err, c));
app.notFound((c: Context) => c.json({ error: "Route introuvable" }, 404));

export default app;
