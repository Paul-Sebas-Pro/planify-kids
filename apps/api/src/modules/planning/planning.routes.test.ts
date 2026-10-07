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

// Middleware : injecte un parent par défaut, surchargeable par test
const mockUser = { sub: "user-1", familyId: "fam-1", role: "PARENT" as const };
vi.mock("../../core/middleware/auth.middleware", () => ({
  authMiddleware: vi.fn(async (c: any, next: any) => {
    c.set("user", mockUser);
    await next();
  }),
  requireRole: vi.fn((...roles: string[]) => async (c: any, next: any) => {
    const u = c.get("user");
    if (!roles.includes(u.role)) {
      return c.json({ error: "Rôle insuffisant" }, 403);
    }
    await next();
  }),
}));

vi.mock("./planning.service", () => ({
  generatePlanningService: vi.fn(),
  listSchedulesService: vi.fn(),
  getScheduleService: vi.fn(),
  getSchoolCalendarService: vi.fn(),
  updateScheduleItemService: vi.fn(),
  deleteScheduleService: vi.fn(),
}));

import app from "../../app.js";
import * as planningService from "./planning.service.js";

const mockGenerate = vi.mocked(planningService.generatePlanningService);
const mockList = vi.mocked(planningService.listSchedulesService);
const mockGetOne = vi.mocked(planningService.getScheduleService);
const mockGetCalendar = vi.mocked(planningService.getSchoolCalendarService);
const mockUpdateItem = vi.mocked(planningService.updateScheduleItemService);

const json = (body: unknown) => JSON.stringify(body);
const headers = { "Content-Type": "application/json", Authorization: "Bearer tok" };

const fakeSchedule = {
  id: "sched-1",
  familyId: "fam-1",
  startDate: "2026-06-16",
  endDate: "2026-06-22",
  items: [],
};

beforeEach(() => vi.clearAllMocks());

// ── POST /planning/generate ───────────────────────────────────────────────────

describe("POST /planning/generate", () => {
  it("201 avec planning généré", async () => {
    mockGenerate.mockResolvedValue(fakeSchedule as any);

    const res = await app.request("/planning/generate", {
      method: "POST",
      headers,
      body: json({ startDate: "2026-06-16", endDate: "2026-06-22" }),
    });

    expect(res.status).toBe(201);
    const body = await res.json() as any;
    expect(body.success).toBe(true);
    expect(body.data.id).toBe("sched-1");
    expect(mockGenerate).toHaveBeenCalledWith("fam-1", expect.objectContaining({ startDate: "2026-06-16" }));
  });

  it("400 si body invalide (dates manquantes)", async () => {
    const res = await app.request("/planning/generate", {
      method: "POST",
      headers,
      body: json({}),
    });

    expect(res.status).toBe(400);
    expect(mockGenerate).not.toHaveBeenCalled();
  });

  it("403 si rôle CHILD", async () => {
    const { authMiddleware } = await import("../../core/middleware/auth.middleware");
    vi.mocked(authMiddleware).mockImplementationOnce(async (c: any, next: any) => {
      c.set("user", { sub: "child-1", familyId: "fam-1", role: "CHILD" });
      await next();
    });

    const res = await app.request("/planning/generate", {
      method: "POST",
      headers,
      body: json({ startDate: "2026-06-16", endDate: "2026-06-22" }),
    });

    expect(res.status).toBe(403);
    expect(mockGenerate).not.toHaveBeenCalled();
  });

  it("401 sans token (middleware non appelé)", async () => {
    const { authMiddleware } = await import("../../core/middleware/auth.middleware");
    vi.mocked(authMiddleware).mockImplementationOnce(async (c: any) => {
      return c.json({ error: "Token manquant" }, 401);
    });

    const res = await app.request("/planning/generate", {
      method: "POST",
      body: json({ startDate: "2026-06-16", endDate: "2026-06-22" }),
    });

    expect(res.status).toBe(401);
    expect(mockGenerate).not.toHaveBeenCalled();
  });
});

// ── GET /planning ─────────────────────────────────────────────────────────────

describe("GET /planning", () => {
  it("200 avec liste des schedules", async () => {
    mockList.mockResolvedValue([fakeSchedule] as any);

    const res = await app.request("/planning", { headers });

    expect(res.status).toBe(200);
    const body = await res.json() as any;
    expect(body.success).toBe(true);
    expect(body.data).toHaveLength(1);
    expect(mockList).toHaveBeenCalledWith("fam-1", 20);
  });

  it("200 avec liste vide", async () => {
    mockList.mockResolvedValue([]);

    const res = await app.request("/planning", { headers });

    expect(res.status).toBe(200);
    const body = await res.json() as any;
    expect(body.data).toHaveLength(0);
  });
});

// ── GET /planning/calendar ────────────────────────────────────────────────────

describe("GET /planning/calendar", () => {
  it("200 avec les entrées calendrier", async () => {
    mockGetCalendar.mockResolvedValue([
      { date: "2026-06-18", type: "HOLIDAY", label: "Fête des Pères" },
    ] as any);

    const res = await app.request(
      "/planning/calendar?startDate=2026-06-16&endDate=2026-06-22",
      { headers },
    );

    expect(res.status).toBe(200);
    const body = (await res.json()) as any;
    expect(body.data).toHaveLength(1);
    expect(mockGetCalendar).toHaveBeenCalledWith("fam-1", "2026-06-16", "2026-06-22");
  });

  it("400 si startDate/endDate manquants", async () => {
    const res = await app.request("/planning/calendar", { headers });

    expect(res.status).toBe(400);
    expect(mockGetCalendar).not.toHaveBeenCalled();
  });

  it("n'est pas capturé par la route /:id (ordre de déclaration)", async () => {
    mockGetCalendar.mockResolvedValue([]);

    const res = await app.request(
      "/planning/calendar?startDate=2026-06-16&endDate=2026-06-22",
      { headers },
    );

    expect(res.status).toBe(200);
    expect(mockGetOne).not.toHaveBeenCalled();
  });
});

// ── GET /planning/:id ─────────────────────────────────────────────────────────

describe("GET /planning/:id", () => {
  it("200 avec schedule trouvé", async () => {
    mockGetOne.mockResolvedValue(fakeSchedule as any);

    const res = await app.request("/planning/sched-1", { headers });

    expect(res.status).toBe(200);
    expect(mockGetOne).toHaveBeenCalledWith("sched-1", "fam-1");
  });

  it("404 si schedule inexistant", async () => {
    const { NotFoundError } = await import("../../core/errors/AppError");
    mockGetOne.mockRejectedValue(new NotFoundError("Schedule introuvable"));

    const res = await app.request("/planning/unknown", { headers });

    expect(res.status).toBe(404);
  });
});

// ── PATCH /planning/items/:itemId ─────────────────────────────────────────────

describe("PATCH /planning/items/:itemId", () => {
  it("200 avec statut mis à jour", async () => {
    const updatedItem = { id: "item-1", status: "COMPLETED" };
    mockUpdateItem.mockResolvedValue(updatedItem as any);

    const res = await app.request("/planning/items/item-1", {
      method: "PATCH",
      headers,
      body: json({ status: "COMPLETED" }),
    });

    expect(res.status).toBe(200);
    const body = await res.json() as any;
    expect(body.data.status).toBe("COMPLETED");
    expect(mockUpdateItem).toHaveBeenCalledWith(
      "item-1",
      { familyId: "fam-1", role: "PARENT", memberId: undefined },
      { status: "COMPLETED" },
    );
  });

  it("400 si statut invalide", async () => {
    const res = await app.request("/planning/items/item-1", {
      method: "PATCH",
      headers,
      body: json({ status: "INVALID_STATUS" }),
    });

    expect(res.status).toBe(400);
    expect(mockUpdateItem).not.toHaveBeenCalled();
  });
});
