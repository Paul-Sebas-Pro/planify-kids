import { describe, it, expect, vi, beforeEach } from "vitest";

const { tx, mockTransaction } = vi.hoisted(() => {
  const tx = {
    scheduleItem: { updateMany: vi.fn(), findUnique: vi.fn() },
    familyMember: { update: vi.fn() },
  };
  return {
    tx,
    mockTransaction: vi.fn(async (fn: (t: typeof tx) => unknown) => fn(tx)),
  };
});

vi.mock("../../config/database", () => ({
  prisma: { $transaction: mockTransaction },
}));

import { updateScheduleItemWithPoints } from "./planning.repository.js";

const T0 = new Date("2026-10-09T10:00:00.123Z");

beforeEach(() => {
  vi.clearAllMocks();
  tx.scheduleItem.findUnique.mockResolvedValue({ id: "item-1" });
  tx.familyMember.update.mockResolvedValue({ id: "member-1", points: 60 });
});

describe("updateScheduleItemWithPoints (statut + points atomiques)", () => {
  it("statut et points écrits dans la MÊME transaction", async () => {
    tx.scheduleItem.updateMany.mockResolvedValue({ count: 1 });

    const result = await updateScheduleItemWithPoints(
      "item-1",
      { status: "PENDING", updatedAt: T0 },
      "COMPLETED",
      { memberId: "member-1", delta: 10 },
    );

    expect(mockTransaction).toHaveBeenCalledOnce();
    expect(tx.scheduleItem.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "item-1", status: "PENDING", updatedAt: T0 },
      }),
    );
    expect(tx.familyMember.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "member-1" },
        data: { points: { increment: 10 } },
      }),
    );
    expect(result).toEqual({
      item: { id: "item-1" },
      member: { id: "member-1", points: 60 },
    });
  });

  it("item modifié entre-temps (0 ligne) — null, aucun point touché", async () => {
    tx.scheduleItem.updateMany.mockResolvedValue({ count: 0 });

    const result = await updateScheduleItemWithPoints(
      "item-1",
      { status: "PENDING", updatedAt: T0 },
      "COMPLETED",
      { memberId: "member-1", delta: 10 },
    );

    expect(result).toBeNull();
    expect(tx.familyMember.update).not.toHaveBeenCalled();
  });

  it("erreur sur les points — propagée (la transaction annule le statut)", async () => {
    tx.scheduleItem.updateMany.mockResolvedValue({ count: 1 });
    tx.familyMember.update.mockRejectedValue(new Error("EMAXCONNSESSION"));

    await expect(
      updateScheduleItemWithPoints(
        "item-1",
        { status: "PENDING", updatedAt: T0 },
        "COMPLETED",
        { memberId: "member-1", delta: 10 },
      ),
    ).rejects.toThrow("EMAXCONNSESSION");
  });
});
