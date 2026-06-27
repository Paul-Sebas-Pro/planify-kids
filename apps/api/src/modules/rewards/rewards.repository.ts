import { prisma } from "../../config/database";
import type {
  CreateRewardInput,
  UpdateRewardInput,
  ReviewClaimInput,
} from "./rewards.schema";

export function getRewardsByFamily(familyId: string) {
  return prisma.reward.findMany({
    where: { familyId },
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

export function deleteReward(id: string) {
  return prisma.reward.delete({ where: { id } });
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

export function updateClaim(claimId: string, input: ReviewClaimInput) {
  return prisma.rewardClaim.update({
    where: { id: claimId },
    data: { status: input.status },
  });
}

export function deductPoints(memberId: string, points: number) {
  return prisma.familyMember.update({
    where: { id: memberId },
    data: { points: { decrement: points } },
  });
}
