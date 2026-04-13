import { prisma } from "../config/database";

export async function awardPointsForTask(
  memberId: string,
  points: number,
): Promise<void> {
  const member = await prisma.familyMember.update({
    where: { id: memberId },
    data: { points: { increment: points } },
  });

  await checkAndAwardBadges(memberId, member.points);
}

async function checkAndAwardBadges(
  memberId: string,
  totalPoints: number,
): Promise<void> {
  const [badges, earned, completedCount] = await Promise.all([
    prisma.badge.findMany(),
    prisma.memberBadge.findMany({
      where: { memberId },
      select: { badgeId: true },
    }),
    prisma.scheduleItem.count({
      where: { assignedToMemberId: memberId, status: "COMPLETED" },
    }),
  ]);

  const earnedIds = new Set(earned.map((e) => e.badgeId));

  const toAward = badges.filter((badge) => {
    if (earnedIds.has(badge.id)) return false;
    if (badge.conditionType === "POINTS")
      return totalPoints >= badge.conditionValue;
    if (badge.conditionType === "TASKS_COMPLETED")
      return completedCount >= badge.conditionValue;
    return false;
  });

  if (toAward.length > 0) {
    await prisma.memberBadge.createMany({
      data: toAward.map((badge) => ({ memberId, badgeId: badge.id })),
      skipDuplicates: true,
    });
  }
}
