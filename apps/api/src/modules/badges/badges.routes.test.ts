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

vi.mock("../../config/database", () => ({
  prisma: {
    badge: { findMany: vi.fn() },
    memberBadge: { findMany: vi.fn() },
  },
}));

vi.mock("../../config/mongo", () => ({ connectMongo: vi.fn(), disconnectMongo: vi.fn() }));

vi.mock("../../core/middleware/auth.middleware", () => ({
  authMiddleware: vi.fn(async (c: any, next: any) => {
    c.set("user", { sub: "user-1", familyId: "fam-1", role: "CHILD" });
    await next();
  }),
  requireRole: vi.fn((...roles: string[]) => async (c: any, next: any) => {
    const u = c.get("user");
    if (!roles.includes(u.role)) return c.json({ error: "Rôle insuffisant" }, 403);
    await next();
  }),
}));

import app from "../../app.js";
import { prisma } from "../../config/database.js";

const mockBadgeFindMany       = vi.mocked((prisma.badge as any).findMany);
const mockMemberBadgeFindMany = vi.mocked((prisma.memberBadge as any).findMany);

const headers = { Authorization: "Bearer tok" };

const MBR_ID = "c56a4180-65aa-42ec-a945-5fd21dec053c";

const fakeBadge = {
  id: "badge-1",
  name: "Premiers pas",
  icon: "🌟",
  description: "Compléter 1 tâche",
  conditionType: "TASKS_COMPLETED",
  conditionValue: 1,
};

const fakeMemberBadge = {
  id: "mb-1",
  memberId: MBR_ID,
  badgeId: "badge-1",
  earnedAt: new Date("2026-06-16"),
  badge: fakeBadge,
};

beforeEach(() => vi.clearAllMocks());

// ── GET /badges ───────────────────────────────────────────────────────────────

describe("GET /badges", () => {
  it("200 liste tous les badges disponibles", async () => {
    mockBadgeFindMany.mockResolvedValue([fakeBadge]);

    const res = await app.request("/badges", { headers });

    expect(res.status).toBe(200);
    const body = await res.json() as any;
    expect(body.success).toBe(true);
    expect(body.data).toHaveLength(1);
    expect(body.data[0].name).toBe("Premiers pas");
    expect(mockBadgeFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: { conditionValue: "asc" } }),
    );
  });

  it("401 sans token", async () => {
    const { authMiddleware } = await import("../../core/middleware/auth.middleware");
    vi.mocked(authMiddleware).mockImplementationOnce(async (c: any) => {
      return c.json({ error: "Token manquant" }, 401);
    });

    const res = await app.request("/badges");

    expect(res.status).toBe(401);
    expect(mockBadgeFindMany).not.toHaveBeenCalled();
  });
});

// ── GET /badges/member/:memberId ──────────────────────────────────────────────

describe("GET /badges/member/:memberId", () => {
  it("200 retourne les badges gagnés par un membre", async () => {
    mockMemberBadgeFindMany.mockResolvedValue([fakeMemberBadge]);

    const res = await app.request(`/badges/member/${MBR_ID}`, { headers });

    expect(res.status).toBe(200);
    const body = await res.json() as any;
    expect(body.success).toBe(true);
    expect(body.data).toHaveLength(1);
    expect(body.data[0].badge.name).toBe("Premiers pas");
    expect(mockMemberBadgeFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { memberId: MBR_ID, member: { familyId: "fam-1" } },
      }),
    );
  });

  it("200 retourne tableau vide si aucun badge gagné", async () => {
    mockMemberBadgeFindMany.mockResolvedValue([]);

    const res = await app.request(`/badges/member/${MBR_ID}`, { headers });

    expect(res.status).toBe(200);
    const body = await res.json() as any;
    expect(body.data).toHaveLength(0);
  });
});
