import type { Prisma } from "@prisma/client";
import { prisma } from "../../config/database.js";
import type { RegisterInput } from "./auth.schema.js";

function randomFamilyCode(): string {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

export function findFamilyByCode(code: string) {
  return prisma.family.findUnique({
    where: { code: code.toUpperCase() },
    include: {
      members: {
        where: { role: "CHILD" },
        select: { id: true, name: true, color: true, avatar: true },
      },
    },
  });
}

export function findChildMember(memberId: string, familyId: string) {
  return prisma.familyMember.findFirst({
    where: { id: memberId, familyId, role: "CHILD" },
    select: {
      id: true, name: true, role: true,
      color: true, avatar: true, points: true, pin: true,
    },
  });
}

export async function findUserByEmail(email: string) {
  return prisma.user.findUnique({
    where: { email },
    include: {
      members: {
        include: { family: true },
      },
    },
  });
}

export async function createUserWithFamily(
  input: RegisterInput,
  passwordHash: string,
) {
  return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const user = await tx.user.create({
      data: { email: input.email, passwordHash },
    });

    const family = await tx.family.create({
      data: {
        name: input.familyName,
        code: randomFamilyCode(),
        timezone: input.timezone,
        locale: input.locale,
      },
    });

    const member = await tx.familyMember.create({
      data: {
        familyId: family.id,
        userId: user.id,
        name: input.parentName,
        role: "PARENT",
      },
    });

    return { user, family, member };
  });
}
