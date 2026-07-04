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

vi.mock("./auth.service", () => ({
  registerService: vi.fn(),
  loginService: vi.fn(),
}));

vi.mock("../../core/middleware/auth.middleware", () => ({
  authMiddleware: vi.fn(async (c: any, next: any) => {
    c.set("user", { sub: "user-1", familyId: "family-1", role: "PARENT" });
    await next();
  }),
  requireRole: vi.fn(() => async (_c: any, next: any) => await next()),
}));

import app from "../../app.js";
import * as authService from "./auth.service.js";

const mockRegister = vi.mocked(authService.registerService);
const mockLogin = vi.mocked(authService.loginService);

const fakeTokens = { accessToken: "access-tok", refreshToken: "refresh-tok" };
const fakeUser = { id: "user-1", email: "parent@test.com" };
const fakeFamily = { id: "fam-1", name: "Famille Test" };
const fakeMember = { id: "mem-1", name: "Parent", role: "PARENT" };

const json = (body: unknown) => JSON.stringify(body);
const headers = { "Content-Type": "application/json" };

beforeEach(() => vi.clearAllMocks());

// ── POST /auth/register ───────────────────────────────────────────────────────

describe("POST /auth/register", () => {
  it("201 avec corps valide", async () => {
    mockRegister.mockResolvedValue({
      tokens: fakeTokens,
      user: fakeUser,
      family: fakeFamily,
      member: fakeMember,
    } as any);

    const res = await app.request("/auth/register", {
      method: "POST",
      headers,
      body: json({
        email: "parent@test.com",
        password: "password123",
        familyName: "Famille Test",
        parentName: "Parent",
        timezone: "Europe/Paris",
        locale: "fr",
      }),
    });

    expect(res.status).toBe(201);
    const body = await res.json() as any;
    expect(body.success).toBe(true);
    expect(body.data.tokens.accessToken).toBe("access-tok");
    expect(mockRegister).toHaveBeenCalledOnce();
  });

  it("400 si champ manquant (email absent)", async () => {
    const res = await app.request("/auth/register", {
      method: "POST",
      headers,
      body: json({ password: "pass", familyName: "Test", parentName: "P" }),
    });

    expect(res.status).toBe(400);
    expect(mockRegister).not.toHaveBeenCalled();
  });

  it("409 si email déjà utilisé", async () => {
    const { ConflictError } = await import("../../core/errors/AppError");
    mockRegister.mockRejectedValue(new ConflictError("Email existant"));

    const res = await app.request("/auth/register", {
      method: "POST",
      headers,
      body: json({
        email: "exist@test.com",
        password: "password123",
        familyName: "Test",
        parentName: "P",
        timezone: "Europe/Paris",
        locale: "fr",
      }),
    });

    expect(res.status).toBe(409);
  });
});

// ── POST /auth/login ──────────────────────────────────────────────────────────

describe("POST /auth/login", () => {
  it("200 avec credentials valides", async () => {
    mockLogin.mockResolvedValue({
      tokens: fakeTokens,
      user: fakeUser,
      family: fakeFamily,
      member: fakeMember,
    } as any);

    const res = await app.request("/auth/login", {
      method: "POST",
      headers,
      body: json({ email: "parent@test.com", password: "password123" }),
    });

    expect(res.status).toBe(200);
    const body = await res.json() as any;
    expect(body.success).toBe(true);
    expect(body.data.tokens.accessToken).toBe("access-tok");
  });

  it("400 si body invalide (email malformé)", async () => {
    const res = await app.request("/auth/login", {
      method: "POST",
      headers,
      body: json({ email: "pas-un-email", password: "x" }),
    });

    expect(res.status).toBe(400);
    expect(mockLogin).not.toHaveBeenCalled();
  });

  it("401 si service lève UnauthorizedError", async () => {
    const { UnauthorizedError } = await import("../../core/errors/AppError");
    mockLogin.mockRejectedValue(new UnauthorizedError("Mauvais mdp"));

    const res = await app.request("/auth/login", {
      method: "POST",
      headers,
      body: json({ email: "parent@test.com", password: "mauvais" }),
    });

    expect(res.status).toBe(401);
  });
});

// ── GET /auth/me ──────────────────────────────────────────────────────────────

describe("GET /auth/me", () => {
  it("200 et retourne le payload JWT injecté par le middleware", async () => {
    const res = await app.request("/auth/me", {
      headers: { Authorization: "Bearer any-token" },
    });

    expect(res.status).toBe(200);
    const body = await res.json() as any;
    expect(body.data.sub).toBe("user-1");
    expect(body.data.familyId).toBe("family-1");
    expect(body.data.role).toBe("PARENT");
  });
});
