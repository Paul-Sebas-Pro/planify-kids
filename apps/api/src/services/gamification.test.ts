import { describe, it, expect, vi, beforeEach } from "vitest";

const {
  mockUpdate,
  mockFindManyBadges,
  mockFindManyMemberBadges,
  mockCount,
  mockFindManyScheduleItems,
  mockCreateMany,
} = vi.hoisted(() => ({
  mockUpdate: vi.fn(),
  mockFindManyBadges: vi.fn(),
  mockFindManyMemberBadges: vi.fn(),
  mockCount: vi.fn(),
  mockFindManyScheduleItems: vi.fn(),
  mockCreateMany: vi.fn(),
}));

vi.mock("../config/database", () => ({
  prisma: {
    familyMember: { update: mockUpdate },
    badge: { findMany: mockFindManyBadges },
    memberBadge: { findMany: mockFindManyMemberBadges, createMany: mockCreateMany },
    scheduleItem: { count: mockCount, findMany: mockFindManyScheduleItems },
  },
}));

const { mockNotifyBadgeEarned } = vi.hoisted(() => ({
  mockNotifyBadgeEarned: vi.fn(),
}));

vi.mock("../modules/notifications/notifications.service", () => ({
  notifyBadgeEarned: mockNotifyBadgeEarned,
}));

import { awardPointsForTask } from "./gamification.js";

beforeEach(() => {
  vi.clearAllMocks();
  mockFindManyScheduleItems.mockResolvedValue([]);
});

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

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
      { id: "badge-pts", name: "Champion", conditionType: "POINTS", conditionValue: 100 },
    ]);
    mockFindManyMemberBadges.mockResolvedValue([]);
    mockCount.mockResolvedValue(5);

    await awardPointsForTask("member-1", 10);

    expect(mockCreateMany).toHaveBeenCalledWith({
      data: [{ memberId: "member-1", badgeId: "badge-pts" }],
      skipDuplicates: true,
    });
    expect(mockNotifyBadgeEarned).toHaveBeenCalledWith("member-1", "family-1", "Champion");
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

  it("attribue badge STREAK quand jours consécutifs atteints", async () => {
    mockUpdate.mockResolvedValue(fakeMember(30));
    mockFindManyBadges.mockResolvedValue([
      { id: "badge-streak", name: "En feu", conditionType: "STREAK", conditionValue: 3 },
    ]);
    mockFindManyMemberBadges.mockResolvedValue([]);
    mockCount.mockResolvedValue(3);
    mockFindManyScheduleItems.mockResolvedValue([
      { completedAt: daysAgo(0) },
      { completedAt: daysAgo(1) },
      { completedAt: daysAgo(2) },
    ]);

    await awardPointsForTask("member-1", 10);

    expect(mockCreateMany).toHaveBeenCalledWith({
      data: [{ memberId: "member-1", badgeId: "badge-streak" }],
      skipDuplicates: true,
    });
  });

  it("n'attribue pas badge STREAK si la série est interrompue", async () => {
    mockUpdate.mockResolvedValue(fakeMember(30));
    mockFindManyBadges.mockResolvedValue([
      { id: "badge-streak", conditionType: "STREAK", conditionValue: 3 },
    ]);
    mockFindManyMemberBadges.mockResolvedValue([]);
    mockCount.mockResolvedValue(2);
    // Trou à J-1 : la série ne remonte qu'à aujourd'hui (1 jour), pas 3
    mockFindManyScheduleItems.mockResolvedValue([
      { completedAt: daysAgo(0) },
      { completedAt: daysAgo(2) },
    ]);

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
