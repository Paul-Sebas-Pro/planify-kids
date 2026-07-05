import * as argon2 from "argon2";
import jwt, { type Secret } from "jsonwebtoken";
import { env } from "../../config/env.js";
import {
  ConflictError,
  UnauthorizedError,
} from "../../core/errors/AppError.js";
import {
  findUserByEmail,
  createUserWithFamily,
  findFamilyByCode,
  findChildMember,
} from "./auth.repository.js";
import type { RegisterInput, LoginInput, LoginChildInput } from "./auth.schema.js";

function generateTokens(
  sub: string,
  familyId: string,
  role: "PARENT" | "CHILD",
  memberId: string,
) {
  const payload = { sub, familyId, role, memberId };
  const secret = env.JWT_SECRET as Secret;

  const accessToken = jwt.sign(payload, secret, {
    expiresIn: env.JWT_EXPIRES_IN as any,
  });
  const refreshToken = jwt.sign({ sub }, secret, {
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

  const tokens = generateTokens(user.id, family.id, "PARENT", member.id);

  return {
    tokens,
    user: { id: user.id, email: user.email },
    family: { id: family.id, name: family.name, code: family.code },
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

  const tokens = generateTokens(user.id, parentMember.familyId, "PARENT", parentMember.id);

  return {
    tokens,
    user: { id: user.id, email: user.email },
    family: {
      id: parentMember.familyId,
      name: parentMember.family.name,
      code: parentMember.family.code,
    },
    member: {
      id: parentMember.id,
      name: parentMember.name,
      role: parentMember.role,
    },
  };
}

export async function getFamilyMembersService(code: string) {
  const family = await findFamilyByCode(code);
  if (!family) {
    throw new UnauthorizedError("Code famille invalide");
  }
  return {
    family: { id: family.id, name: family.name },
    members: family.members,
  };
}

export async function loginChildService(input: LoginChildInput) {
  const family = await findFamilyByCode(input.familyCode);
  if (!family) {
    throw new UnauthorizedError("Code famille invalide");
  }

  const member = await findChildMember(input.memberId, family.id);
  if (!member) {
    throw new UnauthorizedError("Enfant introuvable dans cette famille");
  }
  if (!member.pin) {
    throw new UnauthorizedError("Aucun PIN configuré pour cet enfant");
  }

  const valid = await argon2.verify(member.pin, input.pin);
  if (!valid) {
    throw new UnauthorizedError("PIN incorrect");
  }

  const tokens = generateTokens(member.id, family.id, "CHILD", member.id);

  return {
    tokens,
    family: { id: family.id, name: family.name },
    member: {
      id: member.id,
      name: member.name,
      role: member.role,
      color: member.color,
      avatar: member.avatar,
      points: member.points,
    },
  };
}
