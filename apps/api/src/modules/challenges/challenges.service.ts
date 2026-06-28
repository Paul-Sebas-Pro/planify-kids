import { AppError, NotFoundError } from "../../core/errors/AppError.js";
import { sseEmit } from "../../services/sse.service.js";
import {
  getChallengesByFamily,
  getChallengeById,
  createChallenge,
  updateChallengeStatus,
  getActiveChallengesForFamily,
  sumPointsInPeriod,
  awardBonusToAllMembers,
} from "./challenges.repository.js";
import type {
  CreateChallengeInput,
  UpdateChallengeInput,
} from "./challenges.schema.js";

export function listChallengesService(familyId: string) {
  return getChallengesByFamily(familyId);
}

export async function createChallengeService(
  familyId: string,
  input: CreateChallengeInput,
) {
  if (new Date(input.endDate) < new Date(input.startDate)) {
    throw new AppError("La date de fin doit être après la date de début", 400);
  }
  return createChallenge(familyId, input);
}

export async function updateChallengeService(
  id: string,
  familyId: string,
  input: UpdateChallengeInput,
) {
  const challenge = await getChallengeById(id, familyId);
  if (!challenge) throw new NotFoundError("Challenge");
  if (challenge.status !== "ACTIVE") {
    throw new AppError("Ce challenge est déjà terminé", 400);
  }
  if (!input.status) return challenge;
  return updateChallengeStatus(id, input.status);
}

export async function checkChallengesAfterPoints(
  familyId: string,
): Promise<void> {
  const now = new Date();
  const active = await getActiveChallengesForFamily(familyId, now);
  if (active.length === 0) return;

  for (const challenge of active) {
    const total = await sumPointsInPeriod(
      familyId,
      challenge.startDate,
      challenge.endDate,
    );
    if (total >= challenge.targetPoints) {
      await updateChallengeStatus(challenge.id, "COMPLETED", now);
      await awardBonusToAllMembers(familyId, challenge.bonusPoints);
      sseEmit(familyId, "challenge_completed", {
        title: challenge.title,
        bonusPoints: challenge.bonusPoints,
        totalPoints: total,
      });
    }
  }
}
