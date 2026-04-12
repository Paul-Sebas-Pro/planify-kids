import { prisma } from "../../config/database";
import type { CreateMemberInput, UpdateMemberInput } from "./members.schema";

export function getMembersByFamily(familyId: string) {
  return prisma.familyMember.findMany({
    where: { familyId },
    orderBy: { createdAt: "asc" },
  });
}

export function getMemberById(id: string, familyId: string) {
  return prisma.familyMember.findFirst({
    where: { id, familyId },
  });
}

export function createMember(familyId: string, input: CreateMemberInput) {
  return prisma.familyMember.create({
    data: {
      familyId,
      name: input.name,
      role: input.role,
      color: input.color ?? null,
      avatar: input.avatar ?? null,
      birthDate: input.birthDate ? new Date(input.birthDate) : null,
    },
  });
}

export function updateMember(id: string, input: UpdateMemberInput) {
  return prisma.familyMember.update({
    where: { id },
    data: {
      ...(input.name !== undefined && { name: input.name }),
      ...(input.color !== undefined && { color: input.color }),
      ...(input.avatar !== undefined && { avatar: input.avatar }),
      ...(input.birthDate !== undefined && {
        birthDate: new Date(input.birthDate),
      }),
    },
  });
}

export function deleteMember(id: string) {
  return prisma.familyMember.delete({ where: { id } });
}
