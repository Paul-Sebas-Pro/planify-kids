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

vi.mock("./rewards.service", () => ({
  listRewardsService: vi.fn(),
  createRewardService: vi.fn(),
  updateRewardService: vi.fn(),
  deleteRewardService: vi.fn(),
  listClaimsService: vi.fn(),
  claimRewardService: vi.fn(),
  reviewClaimService: vi.fn(),
}));

import app from "../../app.js";
import * as rewardsService from "./rewards.service.js";

const mockList        = vi.mocked(rewardsService.listRewardsService);
const mockCreate      = vi.mocked(rewardsService.createRewardService);
const mockUpdate      = vi.mocked(rewardsService.updateRewardService);
const mockDelete      = vi.mocked(rewardsService.deleteRewardService);
const mockListClaims  = vi.mocked(rewardsService.listClaimsService);
const mockClaim       = vi.mocked(rewardsService.claimRewardService);
const mockReview      = vi.mocked(rewardsService.reviewClaimService);

const json = (body: unknown) => JSON.stringify(body);
const headers = { "Content-Type": "application/json", Authorization: "Bearer tok" };

const RWD_ID   = "c56a4180-65aa-42ec-a945-5fd21dec053a";
const CLAIM_ID = "c56a4180-65aa-42ec-a945-5fd21dec053b";
const MBR_ID   = "c56a4180-65aa-42ec-a945-5fd21dec053c";

const fakeReward = { id: RWD_ID, familyId: "fam-1", name: "Cinéma", icon: "🎬", pointsCost: 50 };
const fakeClaim  = { id: CLAIM_ID, rewardId: RWD_ID, memberId: MBR_ID, status: "PENDING" };

beforeEach(() => vi.clearAllMocks());

// ── GET /rewards ──────────────────────────────────────────────────────────────

describe("GET /rewards", () => {
  it("200 liste les récompenses", async () => {
    mockList.mockResolvedValue([fakeReward] as any);

    const res = await app.request("/rewards", { headers });

    expect(res.status).toBe(200);
    const body = await res.json() as any;
    expect(body.success).toBe(true);
    expect(body.data).toHaveLength(1);
    expect(body.data[0].name).toBe("Cinéma");
    expect(mockList).toHaveBeenCalledWith("fam-1");
  });
});

// ── POST /rewards ─────────────────────────────────────────────────────────────

describe("POST /rewards", () => {
  it("201 crée une récompense (PARENT)", async () => {
    mockCreate.mockResolvedValue(fakeReward as any);

    const res = await app.request("/rewards", {
      method: "POST",
      headers,
      body: json({ name: "Cinéma", icon: "🎬", pointsCost: 50 }),
    });

    expect(res.status).toBe(201);
    const body = await res.json() as any;
    expect(body.success).toBe(true);
    expect(body.data.pointsCost).toBe(50);
    expect(mockCreate).toHaveBeenCalledWith(
      "fam-1",
      expect.objectContaining({ name: "Cinéma", pointsCost: 50 }),
    );
  });

  it("400 si pointsCost manquant", async () => {
    const res = await app.request("/rewards", {
      method: "POST",
      headers,
      body: json({ name: "Cinéma", icon: "🎬" }),
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

    const res = await app.request("/rewards", {
      method: "POST",
      headers,
      body: json({ name: "Cinéma", icon: "🎬", pointsCost: 50 }),
    });

    expect(res.status).toBe(403);
    expect(mockCreate).not.toHaveBeenCalled();
  });
});

// ── PATCH /rewards/:id ────────────────────────────────────────────────────────

describe("PATCH /rewards/:id", () => {
  it("200 met à jour le coût en points", async () => {
    const updated = { ...fakeReward, pointsCost: 40 };
    mockUpdate.mockResolvedValue(updated as any);

    const res = await app.request(`/rewards/${RWD_ID}`, {
      method: "PATCH",
      headers,
      body: json({ pointsCost: 40 }),
    });

    expect(res.status).toBe(200);
    const body = await res.json() as any;
    expect(body.data.pointsCost).toBe(40);
    expect(mockUpdate).toHaveBeenCalledWith(RWD_ID, "fam-1", { pointsCost: 40 });
  });

  it("404 si récompense introuvable", async () => {
    const { NotFoundError } = await import("../../core/errors/AppError");
    mockUpdate.mockRejectedValue(new NotFoundError("Récompense"));

    const res = await app.request(`/rewards/${RWD_ID}`, {
      method: "PATCH",
      headers,
      body: json({ pointsCost: 40 }),
    });

    expect(res.status).toBe(404);
  });
});

// ── DELETE /rewards/:id ───────────────────────────────────────────────────────

describe("DELETE /rewards/:id", () => {
  it("200 supprime une récompense (PARENT)", async () => {
    mockDelete.mockResolvedValue(undefined as any);

    const res = await app.request(`/rewards/${RWD_ID}`, {
      method: "DELETE",
      headers,
    });

    expect(res.status).toBe(200);
    const body = await res.json() as any;
    expect(body.success).toBe(true);
    expect(mockDelete).toHaveBeenCalledWith(RWD_ID, "fam-1");
  });

  it("403 si rôle CHILD", async () => {
    const { authMiddleware } = await import("../../core/middleware/auth.middleware");
    vi.mocked(authMiddleware).mockImplementationOnce(async (c: any, next: any) => {
      c.set("user", { sub: "child-1", familyId: "fam-1", role: "CHILD" });
      await next();
    });

    const res = await app.request(`/rewards/${RWD_ID}`, {
      method: "DELETE",
      headers,
    });

    expect(res.status).toBe(403);
    expect(mockDelete).not.toHaveBeenCalled();
  });
});

// ── GET /rewards/claims ───────────────────────────────────────────────────────

describe("GET /rewards/claims", () => {
  it("200 liste les demandes (PARENT)", async () => {
    mockListClaims.mockResolvedValue([fakeClaim] as any);

    const res = await app.request("/rewards/claims", { headers });

    expect(res.status).toBe(200);
    const body = await res.json() as any;
    expect(body.success).toBe(true);
    expect(body.data).toHaveLength(1);
    expect(mockListClaims).toHaveBeenCalledWith("fam-1");
  });

  it("403 si rôle CHILD", async () => {
    const { authMiddleware } = await import("../../core/middleware/auth.middleware");
    vi.mocked(authMiddleware).mockImplementationOnce(async (c: any, next: any) => {
      c.set("user", { sub: "child-1", familyId: "fam-1", role: "CHILD" });
      await next();
    });

    const res = await app.request("/rewards/claims", { headers });

    expect(res.status).toBe(403);
    expect(mockListClaims).not.toHaveBeenCalled();
  });
});

// ── POST /rewards/:id/claim ───────────────────────────────────────────────────

describe("POST /rewards/:id/claim", () => {
  it("201 crée une demande de récompense", async () => {
    mockClaim.mockResolvedValue(fakeClaim as any);

    const res = await app.request(`/rewards/${RWD_ID}/claim`, {
      method: "POST",
      headers,
      body: json({ memberId: MBR_ID }),
    });

    expect(res.status).toBe(201);
    const body = await res.json() as any;
    expect(body.success).toBe(true);
    expect(body.data.status).toBe("PENDING");
    expect(mockClaim).toHaveBeenCalledWith(RWD_ID, "fam-1", { memberId: MBR_ID });
  });

  it("400 si points insuffisants", async () => {
    const { AppError } = await import("../../core/errors/AppError");
    mockClaim.mockRejectedValue(new AppError("Points insuffisants", 400));

    const res = await app.request(`/rewards/${RWD_ID}/claim`, {
      method: "POST",
      headers,
      body: json({ memberId: MBR_ID }),
    });

    expect(res.status).toBe(400);
  });

  it("400 si memberId absent du body", async () => {
    const res = await app.request(`/rewards/${RWD_ID}/claim`, {
      method: "POST",
      headers,
      body: json({}),
    });

    expect(res.status).toBe(400);
    expect(mockClaim).not.toHaveBeenCalled();
  });
});

// ── PATCH /rewards/claims/:claimId ────────────────────────────────────────────

describe("PATCH /rewards/claims/:claimId", () => {
  it("200 approuve une demande (PARENT)", async () => {
    const approved = { ...fakeClaim, status: "APPROVED" };
    mockReview.mockResolvedValue(approved as any);

    const res = await app.request(`/rewards/claims/${CLAIM_ID}`, {
      method: "PATCH",
      headers,
      body: json({ status: "APPROVED" }),
    });

    expect(res.status).toBe(200);
    const body = await res.json() as any;
    expect(body.data.status).toBe("APPROVED");
    expect(mockReview).toHaveBeenCalledWith(CLAIM_ID, "fam-1", { status: "APPROVED" });
  });

  it("200 rejette une demande (PARENT)", async () => {
    const rejected = { ...fakeClaim, status: "REJECTED" };
    mockReview.mockResolvedValue(rejected as any);

    const res = await app.request(`/rewards/claims/${CLAIM_ID}`, {
      method: "PATCH",
      headers,
      body: json({ status: "REJECTED" }),
    });

    expect(res.status).toBe(200);
    const body = await res.json() as any;
    expect(body.data.status).toBe("REJECTED");
  });

  it("400 si statut invalide", async () => {
    const res = await app.request(`/rewards/claims/${CLAIM_ID}`, {
      method: "PATCH",
      headers,
      body: json({ status: "PENDING" }),
    });

    expect(res.status).toBe(400);
    expect(mockReview).not.toHaveBeenCalled();
  });

  it("400 si demande déjà traitée", async () => {
    const { AppError } = await import("../../core/errors/AppError");
    mockReview.mockRejectedValue(new AppError("Cette demande a déjà été traitée", 400));

    const res = await app.request(`/rewards/claims/${CLAIM_ID}`, {
      method: "PATCH",
      headers,
      body: json({ status: "APPROVED" }),
    });

    expect(res.status).toBe(400);
  });

  it("403 si rôle CHILD", async () => {
    const { authMiddleware } = await import("../../core/middleware/auth.middleware");
    vi.mocked(authMiddleware).mockImplementationOnce(async (c: any, next: any) => {
      c.set("user", { sub: "child-1", familyId: "fam-1", role: "CHILD" });
      await next();
    });

    const res = await app.request(`/rewards/claims/${CLAIM_ID}`, {
      method: "PATCH",
      headers,
      body: json({ status: "APPROVED" }),
    });

    expect(res.status).toBe(403);
    expect(mockReview).not.toHaveBeenCalled();
  });
});
