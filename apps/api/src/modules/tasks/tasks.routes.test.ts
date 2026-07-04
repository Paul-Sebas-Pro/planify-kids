import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../config/env", () => ({
  env: {
    NODE_ENV: "test",
    PORT: 3000,
    DATABASE_URL: "postgresql://test",
    MONGODB_URI: "mongodb://test",
    JWT_SECRET: "test-secret-key-min-32-chars-long",
    JWT_EXPIRES_IN: "15m",
    JWT_REFRESH_EXPIRES_IN: "7d",
    CORS_ORIGINS: "http://localhost:5173",
  },
}));

vi.mock("../../config/database", () => ({ prisma: {} }));
vi.mock("../../config/mongo", () => ({ connectMongo: vi.fn(), disconnectMongo: vi.fn() }));

vi.mock("../../core/middleware/auth.middleware", () => ({
  authMiddleware: vi.fn(async (c: any, next: any) => {
    c.set("user", { sub: "user-1", familyId: "fam-1", role: "PARENT" });
    await next();
  }),
  requireRole: vi.fn((...roles: string[]) => async (c: any, next: any) => {
    const u = c.get("user");
    if (!roles.includes(u.role)) return c.json({ error: "Rôle insuffisant" }, 403);
    await next();
  }),
}));

vi.mock("./tasks.service", () => ({
  listTasksService: vi.fn(),
  createTaskService: vi.fn(),
  updateTaskService: vi.fn(),
  deleteTaskService: vi.fn(),
}));

import app from "../../app.js";
import * as tasksService from "./tasks.service.js";

const mockList   = vi.mocked(tasksService.listTasksService);
const mockCreate = vi.mocked(tasksService.createTaskService);
const mockUpdate = vi.mocked(tasksService.updateTaskService);
const mockDelete = vi.mocked(tasksService.deleteTaskService);

const json = (body: unknown) => JSON.stringify(body);
const headers = { "Content-Type": "application/json", Authorization: "Bearer tok" };

const TASK_ID = "c56a4180-65aa-42ec-a945-5fd21dec0539";

const fakeTask = {
  id: TASK_ID,
  familyId: "fam-1",
  name: "Ranger sa chambre",
  icon: "🛏️",
  difficulty: 2,
  duration: 15,
  points: 10,
  frequency: "daily",
  isMandatory: false,
  isActive: true,
};

const validCreateBody = {
  name: "Ranger sa chambre",
  icon: "🛏️",
  difficulty: 2,
  duration: 15,
  points: 10,
  frequency: "daily",
  isMandatory: false,
};

beforeEach(() => vi.clearAllMocks());

// ── GET /tasks ────────────────────────────────────────────────────────────────

describe("GET /tasks", () => {
  it("200 retourne tâches actives par défaut", async () => {
    mockList.mockResolvedValue([fakeTask] as any);

    const res = await app.request("/tasks", { headers });

    expect(res.status).toBe(200);
    const body = await res.json() as any;
    expect(body.success).toBe(true);
    expect(body.data).toHaveLength(1);
    expect(mockList).toHaveBeenCalledWith("fam-1", true);
  });

  it("200 all=true désactive le filtre actives", async () => {
    mockList.mockResolvedValue([fakeTask, { ...fakeTask, isActive: false }] as any);

    const res = await app.request("/tasks?all=true", { headers });

    expect(res.status).toBe(200);
    expect(mockList).toHaveBeenCalledWith("fam-1", false);
  });

  it("200 accessible par rôle CHILD", async () => {
    const { authMiddleware } = await import("../../core/middleware/auth.middleware");
    vi.mocked(authMiddleware).mockImplementationOnce(async (c: any, next: any) => {
      c.set("user", { sub: "child-1", familyId: "fam-1", role: "CHILD" });
      await next();
    });
    mockList.mockResolvedValue([] as any);

    const res = await app.request("/tasks", { headers });

    expect(res.status).toBe(200);
  });
});

// ── POST /tasks ───────────────────────────────────────────────────────────────

describe("POST /tasks", () => {
  it("201 crée une tâche (PARENT)", async () => {
    mockCreate.mockResolvedValue(fakeTask as any);

    const res = await app.request("/tasks", {
      method: "POST",
      headers,
      body: json(validCreateBody),
    });

    expect(res.status).toBe(201);
    const body = await res.json() as any;
    expect(body.success).toBe(true);
    expect(body.data.name).toBe("Ranger sa chambre");
    expect(mockCreate).toHaveBeenCalledWith(
      "fam-1",
      expect.objectContaining({ name: "Ranger sa chambre", frequency: "daily" }),
    );
  });

  it("400 si champ manquant (frequency absent)", async () => {
    const { frequency: _, ...noFreq } = validCreateBody;
    const res = await app.request("/tasks", {
      method: "POST",
      headers,
      body: json(noFreq),
    });

    expect(res.status).toBe(400);
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("400 si difficulty hors plage (0 invalide)", async () => {
    const res = await app.request("/tasks", {
      method: "POST",
      headers,
      body: json({ ...validCreateBody, difficulty: 0 }),
    });

    expect(res.status).toBe(400);
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("403 si rôle CHILD", async () => {
    const { authMiddleware } = await import("../../core/middleware/auth.middleware");
    vi.mocked(authMiddleware).mockImplementationOnce(async (c: any, next: any) => {
      c.set("user", { sub: "child-1", familyId: "fam-1", role: "CHILD" });
      await next();
    });

    const res = await app.request("/tasks", {
      method: "POST",
      headers,
      body: json(validCreateBody),
    });

    expect(res.status).toBe(403);
    expect(mockCreate).not.toHaveBeenCalled();
  });
});

// ── PATCH /tasks/:id ──────────────────────────────────────────────────────────

describe("PATCH /tasks/:id", () => {
  it("200 met à jour les points", async () => {
    const updated = { ...fakeTask, points: 20 };
    mockUpdate.mockResolvedValue(updated as any);

    const res = await app.request(`/tasks/${TASK_ID}`, {
      method: "PATCH",
      headers,
      body: json({ points: 20 }),
    });

    expect(res.status).toBe(200);
    const body = await res.json() as any;
    expect(body.data.points).toBe(20);
    expect(mockUpdate).toHaveBeenCalledWith(TASK_ID, "fam-1", { points: 20 });
  });

  it("404 si tâche introuvable", async () => {
    const { NotFoundError } = await import("../../core/errors/AppError");
    mockUpdate.mockRejectedValue(new NotFoundError("Tâche"));

    const res = await app.request(`/tasks/${TASK_ID}`, {
      method: "PATCH",
      headers,
      body: json({ name: "X" }),
    });

    expect(res.status).toBe(404);
  });

  it("403 si rôle CHILD", async () => {
    const { authMiddleware } = await import("../../core/middleware/auth.middleware");
    vi.mocked(authMiddleware).mockImplementationOnce(async (c: any, next: any) => {
      c.set("user", { sub: "child-1", familyId: "fam-1", role: "CHILD" });
      await next();
    });

    const res = await app.request(`/tasks/${TASK_ID}`, {
      method: "PATCH",
      headers,
      body: json({ name: "X" }),
    });

    expect(res.status).toBe(403);
    expect(mockUpdate).not.toHaveBeenCalled();
  });
});

// ── DELETE /tasks/:id ─────────────────────────────────────────────────────────

describe("DELETE /tasks/:id", () => {
  it("200 supprime une tâche", async () => {
    mockDelete.mockResolvedValue(undefined as any);

    const res = await app.request(`/tasks/${TASK_ID}`, {
      method: "DELETE",
      headers,
    });

    expect(res.status).toBe(200);
    const body = await res.json() as any;
    expect(body.success).toBe(true);
    expect(mockDelete).toHaveBeenCalledWith(TASK_ID, "fam-1");
  });

  it("404 si tâche introuvable", async () => {
    const { NotFoundError } = await import("../../core/errors/AppError");
    mockDelete.mockRejectedValue(new NotFoundError("Tâche"));

    const res = await app.request(`/tasks/${TASK_ID}`, {
      method: "DELETE",
      headers,
    });

    expect(res.status).toBe(404);
  });

  it("403 si rôle CHILD", async () => {
    const { authMiddleware } = await import("../../core/middleware/auth.middleware");
    vi.mocked(authMiddleware).mockImplementationOnce(async (c: any, next: any) => {
      c.set("user", { sub: "child-1", familyId: "fam-1", role: "CHILD" });
      await next();
    });

    const res = await app.request(`/tasks/${TASK_ID}`, {
      method: "DELETE",
      headers,
    });

    expect(res.status).toBe(403);
    expect(mockDelete).not.toHaveBeenCalled();
  });
});
