import { describe, it, expect, vi, beforeEach } from "vitest";

const { tx, mockTransaction } = vi.hoisted(() => {
  const tx = {
    rewardClaim: { updateMany: vi.fn(), findUniqueOrThrow: vi.fn() },
    familyMember: { updateMany: vi.fn() },
  };
  return {
    tx,
    mockTransaction: vi.fn(async (fn: (t: typeof tx) => unknown) => fn(tx)),
  };
});

vi.mock("../../config/database", () => ({
  prisma: { $transaction: mockTransaction },
}));

import {
  reviewClaimAtomic,
  ClaimAlreadyReviewedError,
  InsufficientPointsError,
} from "./rewards.repository.js";

beforeEach(() => {
  vi.clearAllMocks();
  tx.rewardClaim.findUniqueOrThrow.mockResolvedValue({ id: "claim-1" });
});

describe("reviewClaimAtomic", () => {
  it("approbation : statut et retrait de points dans la même transaction", async () => {
    tx.rewardClaim.updateMany.mockResolvedValue({ count: 1 });
    tx.familyMember.updateMany.mockResolvedValue({ count: 1 });

    await reviewClaimAtomic("claim-1", { status: "APPROVED" }, {
      memberId: "member-1",
      points: 100,
    });

    expect(mockTransaction).toHaveBeenCalledOnce();
    expect(tx.rewardClaim.updateMany).toHaveBeenCalledWith({
      where: { id: "claim-1", status: "PENDING" },
      data: { status: "APPROVED" },
    });
    expect(tx.familyMember.updateMany).toHaveBeenCalledWith({
      where: { id: "member-1", points: { gte: 100 } },
      data: { points: { decrement: 100 } },
    });
  });

  it("déjà traitée (double approbation) — erreur, aucun point retiré", async () => {
    tx.rewardClaim.updateMany.mockResolvedValue({ count: 0 });

    await expect(
      reviewClaimAtomic("claim-1", { status: "APPROVED" }, {
        memberId: "member-1",
        points: 100,
      }),
    ).rejects.toBeInstanceOf(ClaimAlreadyReviewedError);
    expect(tx.familyMember.updateMany).not.toHaveBeenCalled();
  });

  it("solde insuffisant — erreur (la transaction annule le statut)", async () => {
    tx.rewardClaim.updateMany.mockResolvedValue({ count: 1 });
    tx.familyMember.updateMany.mockResolvedValue({ count: 0 });

    await expect(
      reviewClaimAtomic("claim-1", { status: "APPROVED" }, {
        memberId: "member-1",
        points: 100,
      }),
    ).rejects.toBeInstanceOf(InsufficientPointsError);
  });

  it("refus : aucun mouvement de points", async () => {
    tx.rewardClaim.updateMany.mockResolvedValue({ count: 1 });

    await reviewClaimAtomic("claim-1", { status: "REJECTED" }, null);

    expect(tx.familyMember.updateMany).not.toHaveBeenCalled();
  });
});
