import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockUpdate, mockFindManyBadges, mockFindManyMemberBadges, mockCount, mockCreateMany } =
  vi.hoisted(() => ({
    mockUpdate: vi.fn(),
    mockFindManyBadges: vi.fn(),
    mockFindManyMemberBadges: vi.fn(),
    mockCount: vi.fn(),
    mockCreateMany: vi.fn(),
  }));

vi.mock("../config/database", () => ({
  prisma: {
    familyMember: { update: mockUpdate },
    badge: { findMany: mockFindManyBadges },
    memberBadge: { findMany: mockFindManyMemberBadges, createMany: mockCreateMany },
    scheduleItem: { count: mockCount },
  },
}));

import { awardPointsForTask } from "./gamification";

beforeEach(() => {
  vi.clearAllMocks();
});

const fakeMember = (points: number) => ({
  id: "member-1",
  familyId: "family-1",
  name: "Alice",
  role: "CHILD",
  points,
  createdAt: new Date(),
  updatedAt: new Date(),
});

describe("awardPointsForTask", () => {
  it("incrémente les points du membre", async () => {
    mockUpdate.mockResolvedValue(fakeMember(15));
    mockFindManyBadges.mockResolvedValue([]);
    mockFindManyMemberBadges.mockResolvedValue([]);
    mockCount.mockResolvedValue(3);

    await awardPointsForTask("member-1", 10);

    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: "member-1" },
      data: { points: { increment: 10 } },
    });
  });

  it("attribue badge POINTS quand seuil atteint", async () => {
    mockUpdate.mockResolvedValue(fakeMember(100));
    mockFindManyBadges.mockResolvedValue([
      { id: "badge-pts", conditionType: "POINTS", conditionValue: 100 },
    ]);
    mockFindManyMemberBadges.mockResolvedValue([]);
    mockCount.mockResolvedValue(5);

    await awardPointsForTask("member-1", 10);

    expect(mockCreateMany).toHaveBeenCalledWith({
      data: [{ memberId: "member-1", badgeId: "badge-pts" }],
      skipDuplicates: true,
    });
  });

  it("attribue badge TASKS_COMPLETED quand seuil atteint", async () => {
    mockUpdate.mockResolvedValue(fakeMember(50));
    mockFindManyBadges.mockResolvedValue([
      { id: "badge-tasks", conditionType: "TASKS_COMPLETED", conditionValue: 10 },
    ]);
    mockFindManyMemberBadges.mockResolvedValue([]);
    mockCount.mockResolvedValue(10);

    await awardPointsForTask("member-1", 5);

    expect(mockCreateMany).toHaveBeenCalledWith({
      data: [{ memberId: "member-1", badgeId: "badge-tasks" }],
      skipDuplicates: true,
    });
  });

  it("n'attribue pas badge déjà gagné", async () => {
    mockUpdate.mockResolvedValue(fakeMember(200));
    mockFindManyBadges.mockResolvedValue([
      { id: "badge-pts", conditionType: "POINTS", conditionValue: 100 },
    ]);
    mockFindManyMemberBadges.mockResolvedValue([{ badgeId: "badge-pts" }]);
    mockCount.mockResolvedValue(0);

    await awardPointsForTask("member-1", 10);

    expect(mockCreateMany).not.toHaveBeenCalled();
  });

  it("n'attribue pas badge si seuil non atteint", async () => {
    mockUpdate.mockResolvedValue(fakeMember(50));
    mockFindManyBadges.mockResolvedValue([
      { id: "badge-pts", conditionType: "POINTS", conditionValue: 100 },
    ]);
    mockFindManyMemberBadges.mockResolvedValue([]);
    mockCount.mockResolvedValue(0);

    await awardPointsForTask("member-1", 5);

    expect(mockCreateMany).not.toHaveBeenCalled();
  });
});
