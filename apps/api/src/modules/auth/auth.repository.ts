import type { Prisma } from "@prisma/client";
import { prisma } from "../../config/database";
import type { RegisterInput } from "./auth.schema";

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
