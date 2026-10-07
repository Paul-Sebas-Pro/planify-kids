import { describe, it, expect, vi, beforeEach } from "vitest";

const {
  mockUpdate,
  mockFindManyBadges,
  mockFindManyMemberBadges,
  mockCount,
  mockFindManyScheduleItems,
  mockCreateMany,
  mockFindManyMembers,
  mockCountChallenges,
  mockCheckChallenges,
} = vi.hoisted(() => ({
  mockUpdate: vi.fn(),
  mockFindManyBadges: vi.fn(),
  mockFindManyMemberBadges: vi.fn(),
  mockCount: vi.fn(),
  mockFindManyScheduleItems: vi.fn(),
  mockCreateMany: vi.fn(),
  mockFindManyMembers: vi.fn(),
  mockCountChallenges: vi.fn(),
  mockCheckChallenges: vi.fn(),
}));

vi.mock("../config/database", () => ({
  prisma: {
    familyMember: { update: mockUpdate, findMany: mockFindManyMembers },
    familyChallenge: { count: mockCountChallenges },
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

vi.mock("../modules/challenges/challenges.service", () => ({
  checkChallengesAfterPoints: mockCheckChallenges,
}));

import { awardPointsForTask } from "./gamification.js";

beforeEach(() => {
  vi.clearAllMocks();
  mockFindManyScheduleItems.mockResolvedValue([]);
  mockCountChallenges.mockResolvedValue(0);
  mockCheckChallenges.mockResolvedValue(0);
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
      data: [{ memberId: "member-1", badgeId: "badge-pts", familyId: "family-1" }],
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
      data: [{ memberId: "member-1", badgeId: "badge-tasks", familyId: "family-1" }],
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
      data: [{ memberId: "member-1", badgeId: "badge-streak", familyId: "family-1" }],
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

describe("badges défis familiaux (CHALLENGES_COMPLETED)", () => {
  const challengeBadge = {
    id: "badge-team",
    name: "Esprit d'équipe",
    conditionType: "CHALLENGES_COMPLETED",
    conditionValue: 1,
  };

  it("attribué quand le nombre de défis réussis atteint le seuil", async () => {
    mockUpdate.mockResolvedValue(fakeMember(20));
    mockFindManyBadges.mockResolvedValue([challengeBadge]);
    mockFindManyMemberBadges.mockResolvedValue([]);
    mockCount.mockResolvedValue(2);
    mockCountChallenges.mockResolvedValue(1);

    await awardPointsForTask("member-1", 10);

    expect(mockCreateMany).toHaveBeenCalledWith({
      data: [{ memberId: "member-1", badgeId: "badge-team", familyId: "family-1" }],
      skipDuplicates: true,
    });
  });

  it("ne compte que les défis réussis depuis l'arrivée de l'enfant", async () => {
    const member = fakeMember(20);
    mockUpdate.mockResolvedValue(member);
    mockFindManyBadges.mockResolvedValue([challengeBadge]);
    mockFindManyMemberBadges.mockResolvedValue([]);
    mockCount.mockResolvedValue(2);

    await awardPointsForTask("member-1", 10);

    expect(mockCountChallenges).toHaveBeenCalledWith({
      where: {
        familyId: "family-1",
        status: "COMPLETED",
        completedAt: { gte: member.createdAt },
      },
    });
    expect(mockCreateMany).not.toHaveBeenCalled();
  });

  it("défi réussi — badges vérifiés pour chaque enfant de la famille", async () => {
    mockUpdate.mockResolvedValue(fakeMember(20));
    mockFindManyBadges.mockResolvedValue([challengeBadge]);
    mockFindManyMemberBadges.mockResolvedValue([]);
    mockCount.mockResolvedValue(2);
    // 0 pour l'enfant qui vient de compléter (vérifié avant la réussite du
    // défi), puis 1 pour chaque enfant après la réussite.
    mockCountChallenges.mockResolvedValueOnce(0).mockResolvedValue(1);
    mockCheckChallenges.mockResolvedValue(1);
    mockFindManyMembers.mockResolvedValue([
      { id: "member-1", points: 20, familyId: "family-1", createdAt: new Date(0) },
      { id: "member-2", points: 5, familyId: "family-1", createdAt: new Date(0) },
    ]);

    await awardPointsForTask("member-1", 10);

    expect(mockFindManyMembers).toHaveBeenCalledWith(
      expect.objectContaining({ where: { familyId: "family-1", role: "CHILD" } }),
    );
    const awarded = mockCreateMany.mock.calls.map((c) => c[0].data[0].memberId);
    expect(awarded).toEqual(["member-1", "member-2"]);
  });

  it("aucun défi réussi — pas de vérification famille", async () => {
    mockUpdate.mockResolvedValue(fakeMember(20));
    mockFindManyBadges.mockResolvedValue([]);
    mockFindManyMemberBadges.mockResolvedValue([]);
    mockCount.mockResolvedValue(2);

    await awardPointsForTask("member-1", 10);

    expect(mockFindManyMembers).not.toHaveBeenCalled();
  });

  it("échec de la vérification des défis — la complétion n'échoue pas", async () => {
    mockUpdate.mockResolvedValue(fakeMember(20));
    mockFindManyBadges.mockResolvedValue([]);
    mockFindManyMemberBadges.mockResolvedValue([]);
    mockCount.mockResolvedValue(2);
    mockCheckChallenges.mockRejectedValue(new Error("DB down"));
    vi.spyOn(console, "error").mockImplementation(() => {});

    await expect(awardPointsForTask("member-1", 10)).resolves.toBeUndefined();
  });
});
