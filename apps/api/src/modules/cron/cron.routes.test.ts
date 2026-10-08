import { describe, it, expect, vi, beforeEach } from "vitest";

const mockEnv = vi.hoisted(() => ({
  NODE_ENV: "test",
  PORT: 3000,
  DATABASE_URL: "postgresql://test",
  MONGODB_URI: "mongodb://test",
  JWT_SECRET: "test-secret-key-min-32-chars-long",
  JWT_EXPIRES_IN: "15m",
  JWT_REFRESH_EXPIRES_IN: "7d",
  CORS_ORIGINS: "http://localhost:5173",
  CRON_SECRET: "cron-secret-0123456789" as string | undefined,
}));

vi.mock("../../config/env", () => ({ env: mockEnv }));
vi.mock("../../config/database", () => ({ prisma: {} }));
vi.mock("../../config/mongo", () => ({
  connectMongo: vi.fn(),
  disconnectMongo: vi.fn(),
}));
vi.mock("../../services/planning-cron", () => ({
  runPlanningGeneration: vi.fn(async () => ({ created: 2 })),
  runTaskReminders: vi.fn(async () => ({ notified: 3 })),
  runForgottenTasks: vi.fn(async () => ({ notified: 1 })),
  runCalendarSync: vi.fn(async () => ({ zones: 1 })),
}));

import app from "../../app.js";
import * as jobs from "../../services/planning-cron.js";

const auth = (secret: string) => ({ Authorization: `Bearer ${secret}` });

beforeEach(() => {
  vi.clearAllMocks();
  mockEnv.CRON_SECRET = "cron-secret-0123456789";
});

describe("GET /cron/:job (Vercel Cron Jobs)", () => {
  it("200 — lance la tâche avec le bon secret", async () => {
    const res = await app.request("/cron/reminders", {
      headers: auth("cron-secret-0123456789"),
    });

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ success: true, data: { notified: 3 } });
    expect(jobs.runTaskReminders).toHaveBeenCalledOnce();
  });

  it.each([
    ["planning", "runPlanningGeneration"],
    ["forgotten", "runForgottenTasks"],
    ["calendar", "runCalendarSync"],
  ] as const)("route %s → %s", async (path, fn) => {
    const res = await app.request(`/cron/${path}`, {
      headers: auth("cron-secret-0123456789"),
    });

    expect(res.status).toBe(200);
    expect(jobs[fn]).toHaveBeenCalledOnce();
  });

  it("401 sans en-tête Authorization", async () => {
    const res = await app.request("/cron/reminders");

    expect(res.status).toBe(401);
    expect(jobs.runTaskReminders).not.toHaveBeenCalled();
  });

  it("401 avec un mauvais secret", async () => {
    const res = await app.request("/cron/reminders", {
      headers: auth("mauvais-secret-000000"),
    });

    expect(res.status).toBe(401);
    expect(jobs.runTaskReminders).not.toHaveBeenCalled();
  });

  it("401 si CRON_SECRET n'est pas configuré (jamais ouvert par défaut)", async () => {
    mockEnv.CRON_SECRET = undefined;

    const res = await app.request("/cron/reminders", {
      headers: auth("undefined"),
    });

    expect(res.status).toBe(401);
    expect(jobs.runTaskReminders).not.toHaveBeenCalled();
  });

  it("404 sur une tâche inconnue", async () => {
    const res = await app.request("/cron/inconnue", {
      headers: auth("cron-secret-0123456789"),
    });

    expect(res.status).toBe(404);
  });
});
