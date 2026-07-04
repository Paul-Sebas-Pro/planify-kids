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
    c.set("user", { sub: "user-1", familyId: "fam-1", role: "CHILD" });
    await next();
  }),
  requireRole: vi.fn((...roles: string[]) => async (c: any, next: any) => {
    const u = c.get("user");
    if (!roles.includes(u.role)) return c.json({ error: "Rôle insuffisant" }, 403);
    await next();
  }),
}));

vi.mock("./exchanges.service", () => ({
  listExchangesService: vi.fn(),
  proposeExchangeService: vi.fn(),
  respondExchangeService: vi.fn(),
}));

import app from "../../app.js";
import * as exchangesService from "./exchanges.service.js";

const mockList = vi.mocked(exchangesService.listExchangesService);
const mockPropose = vi.mocked(exchangesService.proposeExchangeService);
const mockRespond = vi.mocked(exchangesService.respondExchangeService);

const json = (body: unknown) => JSON.stringify(body);
const headers = { "Content-Type": "application/json", Authorization: "Bearer tok" };

const ITEM_ID = "c56a4180-65aa-42ec-a945-5fd21dec0538";
const FROM_ID = "c56a4180-65aa-42ec-a945-5fd21dec0539";
const TO_ID   = "c56a4180-65aa-42ec-a945-5fd21dec053a";
const EXCH_ID = "c56a4180-65aa-42ec-a945-5fd21dec053b";

const fakeExchange = {
  id: EXCH_ID,
  scheduleItemId: ITEM_ID,
  fromMemberId: FROM_ID,
  toMemberId: TO_ID,
  status: "PENDING",
};

beforeEach(() => vi.clearAllMocks());

// ── GET /exchanges ────────────────────────────────────────────────────────────

describe("GET /exchanges", () => {
  it("200 avec liste des échanges", async () => {
    mockList.mockResolvedValue([fakeExchange] as any);

    const res = await app.request("/exchanges", { headers });

    expect(res.status).toBe(200);
    const body = await res.json() as any;
    expect(body.success).toBe(true);
    expect(body.data).toHaveLength(1);
    expect(body.data[0].status).toBe("PENDING");
    expect(mockList).toHaveBeenCalledWith("fam-1", 50, undefined);
  });

  it("401 sans token", async () => {
    const { authMiddleware } = await import("../../core/middleware/auth.middleware");
    vi.mocked(authMiddleware).mockImplementationOnce(async (c: any) => {
      return c.json({ error: "Token manquant" }, 401);
    });

    const res = await app.request("/exchanges");

    expect(res.status).toBe(401);
    expect(mockList).not.toHaveBeenCalled();
  });
});

// ── POST /exchanges ───────────────────────────────────────────────────────────

describe("POST /exchanges", () => {
  it("201 avec échange proposé", async () => {
    mockPropose.mockResolvedValue(fakeExchange as any);

    const res = await app.request("/exchanges", {
      method: "POST",
      headers,
      body: json({
        scheduleItemId: ITEM_ID,
        fromMemberId: FROM_ID,
        toMemberId: TO_ID,
      }),
    });

    expect(res.status).toBe(201);
    const body = await res.json() as any;
    expect(body.success).toBe(true);
    expect(body.data.id).toBe(EXCH_ID);
    expect(mockPropose).toHaveBeenCalledWith("fam-1", expect.objectContaining({
      scheduleItemId: ITEM_ID,
      fromMemberId: FROM_ID,
      toMemberId: TO_ID,
    }));
  });

  it("400 si champ manquant (toMemberId absent)", async () => {
    const res = await app.request("/exchanges", {
      method: "POST",
      headers,
      body: json({ scheduleItemId: ITEM_ID, fromMemberId: FROM_ID }),
    });

    expect(res.status).toBe(400);
    expect(mockPropose).not.toHaveBeenCalled();
  });

  it("409 si échange déjà en attente sur cet item", async () => {
    const { ConflictError } = await import("../../core/errors/AppError");
    mockPropose.mockRejectedValue(new ConflictError("Échange déjà en attente"));

    const res = await app.request("/exchanges", {
      method: "POST",
      headers,
      body: json({
        scheduleItemId: ITEM_ID,
        fromMemberId: FROM_ID,
        toMemberId: TO_ID,
      }),
    });

    expect(res.status).toBe(409);
  });
});

// ── PATCH /exchanges/:id ──────────────────────────────────────────────────────

describe("PATCH /exchanges/:id", () => {
  it("200 acceptation de l'échange", async () => {
    const accepted = { ...fakeExchange, status: "ACCEPTED" };
    mockRespond.mockResolvedValue(accepted as any);

    const res = await app.request("/exchanges/exch-1", {
      method: "PATCH",
      headers,
      body: json({ status: "ACCEPTED" }),
    });

    expect(res.status).toBe(200);
    const body = await res.json() as any;
    expect(body.data.status).toBe("ACCEPTED");
    expect(mockRespond).toHaveBeenCalledWith("exch-1", "fam-1", { status: "ACCEPTED" });
  });

  it("200 refus de l'échange", async () => {
    const refused = { ...fakeExchange, status: "REFUSED" };
    mockRespond.mockResolvedValue(refused as any);

    const res = await app.request("/exchanges/exch-1", {
      method: "PATCH",
      headers,
      body: json({ status: "REFUSED" }),
    });

    expect(res.status).toBe(200);
    const body = await res.json() as any;
    expect(body.data.status).toBe("REFUSED");
  });

  it("400 si statut invalide", async () => {
    const res = await app.request("/exchanges/exch-1", {
      method: "PATCH",
      headers,
      body: json({ status: "ANNULE" }),
    });

    expect(res.status).toBe(400);
    expect(mockRespond).not.toHaveBeenCalled();
  });

  it("404 si échange inexistant", async () => {
    const { NotFoundError } = await import("../../core/errors/AppError");
    mockRespond.mockRejectedValue(new NotFoundError("Échange introuvable"));

    const res = await app.request("/exchanges/unknown", {
      method: "PATCH",
      headers,
      body: json({ status: "ACCEPTED" }),
    });

    expect(res.status).toBe(404);
  });
});
