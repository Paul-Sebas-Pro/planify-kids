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

  await checkAndAwardBadges(member);

  // Attendu (pas de fire-and-forget) : sur Vercel serverless, une promesse
  // encore en vol après la réponse peut être interrompue. Un échec ici ne
  // doit pas faire échouer la complétion de la tâche.
  try {
    const completed = await checkChallengesAfterPoints(member.familyId);
    // Défi réussi : badges "défis" + seuils de points franchis grâce au bonus,
    // pour chaque enfant de la famille.
    if (completed > 0) await checkBadgesForFamilyChildren(member.familyId);
  } catch (err) {
    console.error("Vérification défis/badges échouée :", err);
  }
}

type BadgeCandidate = {
  id: string;
  points: number;
  familyId: string;
  createdAt: Date;
};

export async function checkBadgesForFamilyChildren(
  familyId: string,
): Promise<void> {
  const children = await prisma.familyMember.findMany({
    where: { familyId, role: "CHILD" },
    select: { id: true, points: true, familyId: true, createdAt: true },
  });
  for (const child of children) {
    await checkAndAwardBadges(child);
  }
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

// Jour civil local (Europe/Paris — le serveur ne tourne pas en UTC) dérivé
// directement des composants de la Date, sans passer par setHours+toISOString
// (piège déjà documenté : décale le jour d'un cran selon l'offset local).
function dayKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// Nombre de jours consécutifs (en remontant depuis aujourd'hui) avec au
// moins une tâche complétée. checkAndAwardBadges() est toujours appelé juste
// après une complétion, donc le jour courant fait toujours partie de
// `completedDays` au moment du calcul.
function computeStreak(completedDays: Set<string>): number {
  let streak = 0;
  const cur = new Date();
  while (completedDays.has(dayKey(cur))) {
    streak += 1;
    cur.setDate(cur.getDate() - 1);
  }
  return streak;
}

async function checkAndAwardBadges(member: BadgeCandidate): Promise<void> {
  const { id: memberId, points: totalPoints, familyId } = member;
  const [badges, earned, completedCount, completedItems, challengesCompleted] =
    await Promise.all([
      prisma.badge.findMany(),
      prisma.memberBadge.findMany({
        where: { memberId },
        select: { badgeId: true },
      }),
      prisma.scheduleItem.count({
        where: { assignedToMemberId: memberId, status: "COMPLETED" },
      }),
      prisma.scheduleItem.findMany({
        where: {
          assignedToMemberId: memberId,
          status: "COMPLETED",
          completedAt: { not: null },
        },
        select: { completedAt: true },
      }),
      // Défis familiaux réussis depuis l'arrivée de l'enfant : un enfant ajouté
      // plus tard ne reçoit pas d'un coup les badges des défis passés.
      prisma.familyChallenge.count({
        where: {
          familyId,
          status: "COMPLETED",
          completedAt: { gte: member.createdAt },
        },
      }),
    ]);

  const earnedIds = new Set(
    earned.map((e: { badgeId: string }) => e.badgeId),
  );

  const completedDays = new Set(
    completedItems
      .map((i: { completedAt: Date | null }) => i.completedAt)
      .filter((d: Date | null): d is Date => d !== null)
      .map(dayKey),
  );
  const streak = computeStreak(completedDays);

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
    if (badge.conditionType === "STREAK")
      return streak >= badge.conditionValue;
    if (badge.conditionType === "CHALLENGES_COMPLETED")
      return challengesCompleted >= badge.conditionValue;
    return false;
  });

  if (toAward.length > 0) {
    await prisma.memberBadge.createMany({
      data: toAward.map((badge) => ({ memberId, badgeId: badge.id, familyId })),
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
