import type { Prisma } from "@prisma/client";
import { prisma } from "../../config/database.js";
import { AppError } from "../../core/errors/AppError.js";
import type {
  CreateRewardInput,
  UpdateRewardInput,
  ReviewClaimInput,
} from "./rewards.schema.js";

export function getRewardsByFamily(familyId: string) {
  return prisma.reward.findMany({
    where: { familyId, isActive: true },
    orderBy: { pointsCost: "asc" },
  });
}

export function getRewardById(id: string, familyId: string) {
  return prisma.reward.findFirst({ where: { id, familyId } });
}

export function createReward(familyId: string, input: CreateRewardInput) {
  return prisma.reward.create({
    data: {
      familyId,
      name: input.name,
      icon: input.icon,
      pointsCost: input.pointsCost,
    },
  });
}

export function updateReward(id: string, input: UpdateRewardInput) {
  return prisma.reward.update({
    where: { id },
    data: {
      ...(input.name !== undefined && { name: input.name }),
      ...(input.icon !== undefined && { icon: input.icon }),
      ...(input.pointsCost !== undefined && { pointsCost: input.pointsCost }),
    },
  });
}

// Archive plutôt que suppression réelle : RewardClaim.reward n'a pas de
// onDelete cascade — une récompense déjà réclamée (même une seule fois,
// même une demande refusée) casse la contrainte FK en delete réel. Archiver
// préserve aussi l'historique des demandes passées.
export function archiveReward(id: string) {
  return prisma.reward.update({ where: { id }, data: { isActive: false } });
}

export function getClaimsByMember(memberId: string) {
  return prisma.rewardClaim.findMany({
    where: { memberId },
    orderBy: { claimedAt: "desc" },
    include: {
      reward: { select: { id: true, name: true, icon: true, pointsCost: true } },
    },
  });
}

export function getClaimsByFamily(familyId: string) {
  return prisma.rewardClaim.findMany({
    where: { member: { familyId } },
    orderBy: { claimedAt: "desc" },
    include: {
      reward: { select: { name: true, icon: true, pointsCost: true } },
      member: { select: { name: true, color: true, avatar: true } },
    },
  });
}

export function getClaimById(claimId: string) {
  return prisma.rewardClaim.findUnique({
    where: { id: claimId },
    include: {
      member: { select: { familyId: true, points: true } },
      reward: { select: { familyId: true, pointsCost: true, name: true } },
    },
  });
}

export function createClaim(memberId: string, rewardId: string) {
  return prisma.rewardClaim.create({
    data: { memberId, rewardId },
  });
}

export class ClaimAlreadyReviewedError extends AppError {
  constructor() {
    super("Cette demande a déjà été traitée", 409, "CONFLICT");
  }
}

export class InsufficientPointsError extends AppError {
  constructor() {
    super("Points insuffisants pour approuver cette récompense", 400);
  }
}

/**
 * Traite une demande de récompense en une seule transaction : passage
 * PENDING → APPROVED/REJECTED et, si approuvée, retrait des points.
 *  - Séparées, une erreur entre les deux accordait la récompense sans
 *    retirer les points.
 *  - Conditionnée à `status: PENDING` : deux approbations simultanées (double
 *    clic, deux onglets) ne retirent pas les points deux fois.
 *  - Retrait conditionné à un solde suffisant : deux demandes acceptées
 *    séparément ne mettent pas le solde en négatif.
 * Toute erreur levée annule la transaction (rien n'est modifié).
 */
export function reviewClaimAtomic(
  claimId: string,
  input: ReviewClaimInput,
  deduction: { memberId: string; points: number } | null,
) {
  return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const { count } = await tx.rewardClaim.updateMany({
      where: { id: claimId, status: "PENDING" },
      data: { status: input.status },
    });
    if (count === 0) throw new ClaimAlreadyReviewedError();

    if (deduction) {
      const debited = await tx.familyMember.updateMany({
        where: { id: deduction.memberId, points: { gte: deduction.points } },
        data: { points: { decrement: deduction.points } },
      });
      if (debited.count === 0) throw new InsufficientPointsError();
    }

    return tx.rewardClaim.findUniqueOrThrow({ where: { id: claimId } });
  });
}
