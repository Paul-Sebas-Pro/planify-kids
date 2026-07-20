import { prisma } from "../config/database.js";
import { GamificationLog } from "../config/gamification-log.model.js";
import { checkChallengesAfterPoints } from "../modules/challenges/challenges.service.js";
import { notifyBadgeEarned } from "../modules/notifications/notifications.service.js";

export async function awardPointsForTask(
  memberId: string,
  points: number,
): Promise<void> {
  const member = await prisma.familyMember.update({
    where: { id: memberId },
    data: { points: { increment: points } },
  });

  GamificationLog.create({
    type: "POINTS_EARNED",
    memberId,
    familyId: member.familyId,
    data: { points },
  }).catch(() => {});

  await checkAndAwardBadges(memberId, member.points, member.familyId);
  checkChallengesAfterPoints(member.familyId).catch(() => {});
}

// Annule les points d'une tâche revenue de COMPLETED à un autre statut (undo enfant/parent)
// Ne retire pas les badges déjà décernés — un badge gagné reste acquis.
export async function revokePointsForTask(
  memberId: string,
  points: number,
): Promise<void> {
  const member = await prisma.familyMember.update({
    where: { id: memberId },
    data: { points: { decrement: points } },
  });

  GamificationLog.create({
    type: "POINTS_REVOKED",
    memberId,
    familyId: member.familyId,
    data: { points: -points },
  }).catch(() => {});
}

async function checkAndAwardBadges(
  memberId: string,
  totalPoints: number,
  familyId: string,
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

  const earnedIds = new Set(
    earned.map((e: { badgeId: string }) => e.badgeId),
  );

  type BadgeRow = {
    id: string;
    name: string;
    conditionType: string;
    conditionValue: number;
  };
  const toAward = (badges as BadgeRow[]).filter((badge) => {
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

    for (const badge of toAward) {
      GamificationLog.create({
        type: "BADGE_EARNED",
        memberId,
        familyId,
        data: { badgeId: badge.id },
      }).catch(() => {});

      await notifyBadgeEarned(memberId, familyId, badge.name);
    }
  }
}
