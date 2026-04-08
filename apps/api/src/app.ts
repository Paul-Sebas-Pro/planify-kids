import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { env } from "./config/env.js";
import { errorMiddleware } from "./core/middleware/error.middleware.js";

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
app.get("/health", (c) => c.json({ status: "ok", env: env.NODE_ENV }));

// ─── Routes (à monter au fur et à mesure) ─────────────────────
// app.route("/auth", authRoutes);
// app.route("/family", familyRoutes);
// app.route("/tasks", taskRoutes);
// app.route("/planning", planningRoutes);

// ─── Gestion d'erreurs ────────────────────────────────────────
app.onError((err, c) => errorMiddleware(err, c));
app.notFound((c) => c.json({ error: "Route introuvable" }, 404));

export default app;
