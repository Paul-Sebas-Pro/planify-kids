import { describe, it, expect, vi, beforeEach } from "vitest";
import { AppError, NotFoundError } from "../../core/errors/AppError.js";

vi.mock("../notifications/notifications.service", () => ({
  notifyClaimReviewed: vi.fn(),
}));

vi.mock("./rewards.repository", () => ({
  getRewardsByFamily: vi.fn(),
  getRewardById: vi.fn(),
  createReward: vi.fn(),
  updateReward: vi.fn(),
  archiveReward: vi.fn(),
  getClaimsByFamily: vi.fn(),
  getClaimById: vi.fn(),
  createClaim: vi.fn(),
  reviewClaimAtomic: vi.fn(),
}));

vi.mock("../members/members.repository", () => ({
  getMemberById: vi.fn(),
}));

import * as repo from "./rewards.repository.js";
import * as membersRepo from "../members/members.repository.js";
import {
  updateRewardService,
  deleteRewardService,
  claimRewardService,
  reviewClaimService,
} from "./rewards.service.js";

const mockGetRewardById = vi.mocked(repo.getRewardById);
const mockUpdateReward = vi.mocked(repo.updateReward);
const mockArchiveReward = vi.mocked(repo.archiveReward);
const mockGetClaimById = vi.mocked(repo.getClaimById);
const mockCreateClaim = vi.mocked(repo.createClaim);
const mockReview = vi.mocked(repo.reviewClaimAtomic);
const mockGetMember = vi.mocked(membersRepo.getMemberById);

const fakeReward = {
  id: "reward-1",
  familyId: "family-1",
  name: "Cinéma",
  icon: "🎬",
  pointsCost: 100,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const fakeMember = (points: number) => ({
  id: "member-1",
  familyId: "family-1",
  name: "Alice",
  role: "CHILD" as const,
  points,
  createdAt: new Date(),
  updatedAt: new Date(),
});

const fakeClaim = {
  id: "claim-1",
  memberId: "member-1",
  rewardId: "reward-1",
  status: "PENDING" as const,
  claimedAt: new Date(),
  member: { familyId: "family-1", points: 100 },
  reward: { familyId: "family-1", pointsCost: 100 },
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("updateRewardService", () => {
  it("lève NotFoundError si récompense inexistante", async () => {
    mockGetRewardById.mockResolvedValue(null);

    await expect(
      updateRewardService("reward-x", "family-1", { name: "Nouveau" }),
    ).rejects.toThrow(NotFoundError);

    expect(mockUpdateReward).not.toHaveBeenCalled();
  });

  it("met à jour si la récompense appartient à la famille", async () => {
    mockGetRewardById.mockResolvedValue(fakeReward as any);
    mockUpdateReward.mockResolvedValue({ ...fakeReward, name: "Nouveau" } as any);

    const result = await updateRewardService("reward-1", "family-1", { name: "Nouveau" });

    expect(mockUpdateReward).toHaveBeenCalledWith("reward-1", { name: "Nouveau" });
    expect(result.name).toBe("Nouveau");
  });
});

describe("deleteRewardService", () => {
  it("lève NotFoundError si récompense inexistante", async () => {
    mockGetRewardById.mockResolvedValue(null);

    await expect(
      deleteRewardService("reward-x", "family-1"),
    ).rejects.toThrow(NotFoundError);

    expect(mockArchiveReward).not.toHaveBeenCalled();
  });

  it("archive (isActive=false) si la récompense appartient à la famille", async () => {
    mockGetRewardById.mockResolvedValue(fakeReward as any);
    mockArchiveReward.mockResolvedValue({ ...fakeReward, isActive: false } as any);

    await deleteRewardService("reward-1", "family-1");

    expect(mockArchiveReward).toHaveBeenCalledWith("reward-1");
  });
});

describe("claimRewardService", () => {
  const input = { memberId: "member-1" };

  it("lève NotFoundError si récompense inexistante", async () => {
    mockGetRewardById.mockResolvedValue(null);

    await expect(
      claimRewardService("reward-x", "family-1", input),
    ).rejects.toThrow(NotFoundError);
  });

  it("lève NotFoundError si récompense archivée", async () => {
    mockGetRewardById.mockResolvedValue({ ...fakeReward, isActive: false } as any);

    await expect(
      claimRewardService("reward-1", "family-1", input),
    ).rejects.toThrow(NotFoundError);

    expect(mockCreateClaim).not.toHaveBeenCalled();
  });

  it("lève NotFoundError si membre inexistant", async () => {
    mockGetRewardById.mockResolvedValue(fakeReward as any);
    mockGetMember.mockResolvedValue(null);

    await expect(
      claimRewardService("reward-1", "family-1", input),
    ).rejects.toThrow(NotFoundError);
  });

  it("lève AppError si points insuffisants", async () => {
    mockGetRewardById.mockResolvedValue(fakeReward as any);
    mockGetMember.mockResolvedValue(fakeMember(50) as any);

    await expect(
      claimRewardService("reward-1", "family-1", input),
    ).rejects.toThrow(AppError);

    expect(mockCreateClaim).not.toHaveBeenCalled();
  });

  it("crée la demande si points suffisants", async () => {
    mockGetRewardById.mockResolvedValue(fakeReward as any);
    mockGetMember.mockResolvedValue(fakeMember(150) as any);
    mockCreateClaim.mockResolvedValue(fakeClaim as any);

    await claimRewardService("reward-1", "family-1", input);

    expect(mockCreateClaim).toHaveBeenCalledWith("member-1", "reward-1");
  });
});

describe("reviewClaimService", () => {
  it("lève NotFoundError si demande inexistante", async () => {
    mockGetClaimById.mockResolvedValue(null);

    await expect(
      reviewClaimService("claim-x", "family-1", { status: "APPROVED" }),
    ).rejects.toThrow(NotFoundError);
  });

  it("lève NotFoundError si demande d'une autre famille", async () => {
    mockGetClaimById.mockResolvedValue({
      ...fakeClaim,
      reward: { familyId: "family-other", pointsCost: 100 },
    } as any);

    await expect(
      reviewClaimService("claim-1", "family-1", { status: "APPROVED" }),
    ).rejects.toThrow(NotFoundError);
  });

  it("lève AppError si demande déjà traitée", async () => {
    mockGetClaimById.mockResolvedValue({ ...fakeClaim, status: "APPROVED" } as any);

    await expect(
      reviewClaimService("claim-1", "family-1", { status: "REJECTED" }),
    ).rejects.toThrow(AppError);
  });

  it("déduit les points si APPROVED (dans la même transaction)", async () => {
    mockGetClaimById.mockResolvedValue(fakeClaim as any);
    mockReview.mockResolvedValue({ ...fakeClaim, status: "APPROVED" } as any);

    await reviewClaimService("claim-1", "family-1", { status: "APPROVED" });

    expect(mockReview).toHaveBeenCalledWith(
      "claim-1",
      { status: "APPROVED" },
      { memberId: "member-1", points: 100 },
    );
  });

  it("ne déduit pas les points si REJECTED", async () => {
    mockGetClaimById.mockResolvedValue(fakeClaim as any);
    mockReview.mockResolvedValue({ ...fakeClaim, status: "REJECTED" } as any);

    await reviewClaimService("claim-1", "family-1", { status: "REJECTED" });

    expect(mockReview).toHaveBeenCalledWith(
      "claim-1",
      { status: "REJECTED" },
      null,
    );
  });
});
