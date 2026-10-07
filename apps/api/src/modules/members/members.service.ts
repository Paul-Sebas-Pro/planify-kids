import { NotFoundError, ForbiddenError } from "../../core/errors/AppError.js";
import {
  getMembersByFamily,
  getMemberById,
  createMember,
  updateMember,
  deleteMember,
  updateMemberPin,
  updateMemberFcmToken,
  getMemberTimelineData,
} from "./members.repository.js";
import type { CreateMemberInput, UpdateMemberInput } from "./members.schema.js";

export function listMembersService(familyId: string) {
  return getMembersByFamily(familyId);
}

export function createMemberService(
  familyId: string,
  input: CreateMemberInput,
) {
  return createMember(familyId, input);
}

export async function updateMemberService(
  id: string,
  familyId: string,
  input: UpdateMemberInput,
) {
  const member = await getMemberById(id, familyId);
  if (!member) throw new NotFoundError("Membre");
  if (input.pinRequired !== undefined && member.role !== "CHILD")
    throw new ForbiddenError("Le PIN ne s'applique qu'aux enfants");
  return updateMember(id, input);
}

export async function updatePinService(
  id: string,
  familyId: string,
  pin: string,
) {
  const member = await getMemberById(id, familyId);
  if (!member) throw new NotFoundError("Membre");
  if (member.role !== "CHILD")
    throw new ForbiddenError("Le PIN ne s'applique qu'aux enfants");
  return updateMemberPin(id, pin);
}

export async function updateFcmTokenService(
  id: string,
  familyId: string,
  requesterId: string,
  fcmToken: string,
) {
  const member = await getMemberById(id, familyId);
  if (!member) throw new NotFoundError("Membre");
  if (member.id !== requesterId) throw new ForbiddenError("Token FCM : accès refusé");
  return updateMemberFcmToken(id, fcmToken);
}

export async function getMemberTimelineService(id: string, familyId: string) {
  const member = await getMemberById(id, familyId);
  if (!member) throw new NotFoundError("Membre");
  return getMemberTimelineData(id);
}

export async function deleteMemberService(
  id: string,
  familyId: string,
  requesterId: string,
) {
  const member = await getMemberById(id, familyId);
  if (!member) throw new NotFoundError("Membre");
  // Un membre ne peut pas se supprimer lui-même
  if (member.userId === requesterId) {
    throw new ForbiddenError("Impossible de supprimer son propre compte");
  }
  return deleteMember(id);
}
