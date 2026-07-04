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

vi.mock("./members.service", () => ({
  listMembersService: vi.fn(),
  createMemberService: vi.fn(),
  updateMemberService: vi.fn(),
  deleteMemberService: vi.fn(),
}));

import app from "../../app.js";
import * as membersService from "./members.service.js";

const mockList   = vi.mocked(membersService.listMembersService);
const mockCreate = vi.mocked(membersService.createMemberService);
const mockUpdate = vi.mocked(membersService.updateMemberService);
const mockDelete = vi.mocked(membersService.deleteMemberService);

const json = (body: unknown) => JSON.stringify(body);
const headers = { "Content-Type": "application/json", Authorization: "Bearer tok" };

const MBR_ID = "c56a4180-65aa-42ec-a945-5fd21dec0538";

const fakeMember = {
  id: MBR_ID,
  familyId: "fam-1",
  name: "Alice",
  role: "CHILD",
  color: "#FF6584",
  points: 0,
};

beforeEach(() => vi.clearAllMocks());

// ── GET /family/members ───────────────────────────────────────────────────────

describe("GET /family/members", () => {
  it("200 liste les membres de la famille", async () => {
    mockList.mockResolvedValue([fakeMember] as any);

    const res = await app.request("/family/members", { headers });

    expect(res.status).toBe(200);
    const body = await res.json() as any;
    expect(body.success).toBe(true);
    expect(body.data).toHaveLength(1);
    expect(body.data[0].name).toBe("Alice");
    expect(mockList).toHaveBeenCalledWith("fam-1");
  });

  it("200 accessible par un rôle CHILD", async () => {
    const { authMiddleware } = await import("../../core/middleware/auth.middleware");
    vi.mocked(authMiddleware).mockImplementationOnce(async (c: any, next: any) => {
      c.set("user", { sub: "child-1", familyId: "fam-1", role: "CHILD" });
      await next();
    });
    mockList.mockResolvedValue([] as any);

    const res = await app.request("/family/members", { headers });

    expect(res.status).toBe(200);
  });
});

// ── POST /family/members ──────────────────────────────────────────────────────

describe("POST /family/members", () => {
  it("201 crée un membre (PARENT)", async () => {
    mockCreate.mockResolvedValue(fakeMember as any);

    const res = await app.request("/family/members", {
      method: "POST",
      headers,
      body: json({ name: "Alice", role: "CHILD", color: "#FF6584" }),
    });

    expect(res.status).toBe(201);
    const body = await res.json() as any;
    expect(body.success).toBe(true);
    expect(body.data.name).toBe("Alice");
    expect(mockCreate).toHaveBeenCalledWith(
      "fam-1",
      expect.objectContaining({ name: "Alice", role: "CHILD" }),
    );
  });

  it("400 si champ obligatoire manquant (role absent)", async () => {
    const res = await app.request("/family/members", {
      method: "POST",
      headers,
      body: json({ name: "Alice" }),
    });

    expect(res.status).toBe(400);
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("400 si couleur hex invalide", async () => {
    const res = await app.request("/family/members", {
      method: "POST",
      headers,
      body: json({ name: "Alice", role: "CHILD", color: "rouge" }),
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

    const res = await app.request("/family/members", {
      method: "POST",
      headers,
      body: json({ name: "Bob", role: "CHILD" }),
    });

    expect(res.status).toBe(403);
    expect(mockCreate).not.toHaveBeenCalled();
  });
});

// ── PATCH /family/members/:id ─────────────────────────────────────────────────

describe("PATCH /family/members/:id", () => {
  it("200 met à jour le prénom", async () => {
    const updated = { ...fakeMember, name: "Alicia" };
    mockUpdate.mockResolvedValue(updated as any);

    const res = await app.request(`/family/members/${MBR_ID}`, {
      method: "PATCH",
      headers,
      body: json({ name: "Alicia" }),
    });

    expect(res.status).toBe(200);
    const body = await res.json() as any;
    expect(body.data.name).toBe("Alicia");
    expect(mockUpdate).toHaveBeenCalledWith(MBR_ID, "fam-1", { name: "Alicia" });
  });

  it("404 si membre introuvable", async () => {
    const { NotFoundError } = await import("../../core/errors/AppError");
    mockUpdate.mockRejectedValue(new NotFoundError("Membre"));

    const res = await app.request(`/family/members/${MBR_ID}`, {
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

    const res = await app.request(`/family/members/${MBR_ID}`, {
      method: "PATCH",
      headers,
      body: json({ name: "X" }),
    });

    expect(res.status).toBe(403);
    expect(mockUpdate).not.toHaveBeenCalled();
  });
});

// ── DELETE /family/members/:id ────────────────────────────────────────────────

describe("DELETE /family/members/:id", () => {
  it("200 supprime un membre", async () => {
    mockDelete.mockResolvedValue(undefined as any);

    const res = await app.request(`/family/members/${MBR_ID}`, {
      method: "DELETE",
      headers,
    });

    expect(res.status).toBe(200);
    const body = await res.json() as any;
    expect(body.success).toBe(true);
    expect(mockDelete).toHaveBeenCalledWith(MBR_ID, "fam-1", "user-1");
  });

  it("403 auto-suppression bloquée", async () => {
    const { ForbiddenError } = await import("../../core/errors/AppError");
    mockDelete.mockRejectedValue(new ForbiddenError("Impossible de supprimer son propre compte"));

    const res = await app.request(`/family/members/${MBR_ID}`, {
      method: "DELETE",
      headers,
    });

    expect(res.status).toBe(403);
  });

  it("404 si membre introuvable", async () => {
    const { NotFoundError } = await import("../../core/errors/AppError");
    mockDelete.mockRejectedValue(new NotFoundError("Membre"));

    const res = await app.request(`/family/members/${MBR_ID}`, {
      method: "DELETE",
      headers,
    });

    expect(res.status).toBe(404);
  });
});
