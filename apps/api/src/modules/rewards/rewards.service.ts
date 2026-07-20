import { AppError, NotFoundError } from "../../core/errors/AppError.js";
import {
  getRewardsByFamily,
  getRewardById,
  createReward,
  updateReward,
  archiveReward,
  getClaimsByFamily,
  getClaimsByMember,
  getClaimById,
  createClaim,
  updateClaim,
  deductPoints,
} from "./rewards.repository.js";
import { getMemberById } from "../members/members.repository.js";
import { notifyClaimReviewed } from "../notifications/notifications.service.js";
import { sseEmit } from "../../services/sse.service.js";
import type {
  CreateRewardInput,
  UpdateRewardInput,
  ClaimRewardInput,
  ReviewClaimInput,
} from "./rewards.schema.js";

export function listRewardsService(familyId: string) {
  return getRewardsByFamily(familyId);
}

export async function createRewardService(
  familyId: string,
  input: CreateRewardInput,
) {
  return createReward(familyId, input);
}

export async function updateRewardService(
  id: string,
  familyId: string,
  input: UpdateRewardInput,
) {
  const reward = await getRewardById(id, familyId);
  if (!reward) throw new NotFoundError("Récompense");
  return updateReward(id, input);
}

export async function deleteRewardService(id: string, familyId: string) {
  const reward = await getRewardById(id, familyId);
  if (!reward) throw new NotFoundError("Récompense");
  return archiveReward(id);
}

export function listClaimsService(familyId: string) {
  return getClaimsByFamily(familyId);
}

export function listMyClaimsService(memberId: string) {
  return getClaimsByMember(memberId);
}

export async function claimRewardService(
  rewardId: string,
  familyId: string,
  input: ClaimRewardInput,
) {
  const reward = await getRewardById(rewardId, familyId);
  if (!reward || !reward.isActive) throw new NotFoundError("Récompense");

  const member = await getMemberById(input.memberId, familyId);
  if (!member) throw new NotFoundError("Membre");

  if (member.points < reward.pointsCost) {
    throw new AppError("Points insuffisants", 400);
  }

  const claim = await createClaim(input.memberId, rewardId);
  sseEmit(familyId, "claim_submitted", {
    memberName: member.name,
    rewardName: reward.name,
    pointsCost: reward.pointsCost,
  });
  return claim;
}

export async function reviewClaimService(
  claimId: string,
  familyId: string,
  input: ReviewClaimInput,
) {
  const claim = await getClaimById(claimId);
  if (!claim || claim.reward.familyId !== familyId) {
    throw new NotFoundError("Demande de récompense");
  }
  if (claim.status !== "PENDING") {
    throw new AppError("Cette demande a déjà été traitée", 400);
  }

  const updated = await updateClaim(claimId, input);

  if (input.status === "APPROVED") {
    await deductPoints(claim.memberId, claim.reward.pointsCost);
  }

  await notifyClaimReviewed(
    claim.memberId,
    claim.reward.familyId,
    claim.reward.name,
    input.status === "APPROVED",
  );

  return updated;
}
