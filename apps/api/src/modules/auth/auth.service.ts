import * as argon2 from "argon2";
import { sign, type Secret } from "jsonwebtoken";
import { env } from "../../config/env";
import {
  ConflictError,
  UnauthorizedError,
} from "../../core/errors/AppError.js";
import { findUserByEmail, createUserWithFamily } from "./auth.repository";
import type { RegisterInput, LoginInput } from "./auth.schema";

function generateTokens(
  userId: string,
  familyId: string,
  role: "PARENT" | "CHILD",
) {
  const payload = { sub: userId, familyId, role };

  const secret = env.JWT_SECRET as Secret;

  const accessToken = sign(payload, secret, {
    expiresIn: env.JWT_EXPIRES_IN as any,
  });

  const refreshToken = sign({ sub: userId }, secret, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN as any,
  });

  return { accessToken, refreshToken };
}

export async function registerService(input: RegisterInput) {
  const existing = await findUserByEmail(input.email);
  if (existing) {
    throw new ConflictError("Un compte existe déjà avec cet email");
  }

  const passwordHash = await argon2.hash(input.password);
  const { user, family, member } = await createUserWithFamily(
    input,
    passwordHash,
  );

  const tokens = generateTokens(user.id, family.id, "PARENT");

  return {
    tokens,
    user: { id: user.id, email: user.email },
    family: { id: family.id, name: family.name },
    member: { id: member.id, name: member.name, role: member.role },
  };
}

export async function loginService(input: LoginInput) {
  const user = await findUserByEmail(input.email);
  if (!user) {
    throw new UnauthorizedError("Email ou mot de passe incorrect");
  }

  const valid = await argon2.verify(user.passwordHash, input.password);
  if (!valid) {
    throw new UnauthorizedError("Email ou mot de passe incorrect");
  }

  const parentMember = user.members.find((m: any) => m.role === "PARENT");
  if (!parentMember) {
    throw new UnauthorizedError("Compte parent introuvable");
  }

  const tokens = generateTokens(user.id, parentMember.familyId, "PARENT");

  return {
    tokens,
    user: { id: user.id, email: user.email },
    family: { id: parentMember.familyId, name: parentMember.family.name },
    member: {
      id: parentMember.id,
      name: parentMember.name,
      role: parentMember.role,
    },
  };
}
