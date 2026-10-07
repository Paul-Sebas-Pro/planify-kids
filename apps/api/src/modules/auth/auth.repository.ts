import { randomInt } from "node:crypto";
import type { Prisma } from "@prisma/client";
import { prisma } from "../../config/database.js";
import type { RegisterInput } from "./auth.schema.js";

const FAMILY_CODE_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

// Générateur cryptographique : le code famille est un secret (seul facteur
// de connexion pour un enfant sans PIN). L'ancien Math.random().toString(36)
// était prédictible et pouvait produire moins de 6 caractères.
export function randomFamilyCode(): string {
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += FAMILY_CODE_ALPHABET.charAt(randomInt(FAMILY_CODE_ALPHABET.length));
  }
  return code;
}

export function findFamilyByCode(code: string) {
  return prisma.family.findUnique({
    where: { code: code.toUpperCase() },
    include: {
      members: {
        where: { role: "CHILD" },
        select: {
          id: true, name: true, color: true, avatar: true, pinRequired: true,
        },
      },
    },
  });
}

export function findChildMember(memberId: string, familyId: string) {
  return prisma.familyMember.findFirst({
    where: { id: memberId, familyId, role: "CHILD" },
    select: {
      id: true, name: true, role: true,
      color: true, avatar: true, points: true, pin: true, pinRequired: true,
      pinLockedUntil: true,
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

// ── Anti-force brute ─────────────────────────────────────────────────────────
// Incrément atomique AVANT la vérification : des requêtes envoyées en rafale
// ne peuvent pas toutes passer le contrôle avant le premier échec enregistré.

export async function registerChildPinAttempt(memberId: string) {
  const { failedPinAttempts } = await prisma.familyMember.update({
    where: { id: memberId },
    data: { failedPinAttempts: { increment: 1 } },
    select: { failedPinAttempts: true },
  });
  return failedPinAttempts;
}

export function lockChildPin(memberId: string, until: Date) {
  return prisma.familyMember.update({
    where: { id: memberId },
    data: { failedPinAttempts: 0, pinLockedUntil: until },
  });
}

export function resetChildPinAttempts(memberId: string) {
  return prisma.familyMember.update({
    where: { id: memberId },
    data: { failedPinAttempts: 0, pinLockedUntil: null },
  });
}

export async function registerLoginAttempt(userId: string) {
  const { failedLoginAttempts } = await prisma.user.update({
    where: { id: userId },
    data: { failedLoginAttempts: { increment: 1 } },
    select: { failedLoginAttempts: true },
  });
  return failedLoginAttempts;
}

export function lockLogin(userId: string, until: Date) {
  return prisma.user.update({
    where: { id: userId },
    data: { failedLoginAttempts: 0, loginLockedUntil: until },
  });
}

export function resetLoginAttempts(userId: string) {
  return prisma.user.update({
    where: { id: userId },
    data: { failedLoginAttempts: 0, loginLockedUntil: null },
  });
}
