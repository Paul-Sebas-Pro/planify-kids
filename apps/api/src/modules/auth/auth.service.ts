import * as argon2 from "argon2";
import jwt, { type Secret } from "jsonwebtoken";
import { env } from "../../config/env.js";
import {
  ConflictError,
  TooManyAttemptsError,
  UnauthorizedError,
} from "../../core/errors/AppError.js";
import {
  findUserByEmail,
  createUserWithFamily,
  findFamilyByCode,
  findChildMember,
  registerChildPinAttempt,
  lockChildPin,
  resetChildPinAttempts,
  registerLoginAttempt,
  lockLogin,
  resetLoginAttempts,
} from "./auth.repository.js";
import type { RegisterInput, LoginInput, LoginChildInput } from "./auth.schema.js";

// Anti-force brute : un PIN à 4 chiffres (10 000 combinaisons) se devine en
// quelques minutes par script sans limite de tentatives.
export const MAX_FAILED_ATTEMPTS = 5;
const LOCK_DURATION_MS = 15 * 60 * 1000;

interface AttemptGuard {
  lockedUntil: Date | null;
  registerAttempt: () => Promise<number>;
  lock: (until: Date) => Promise<unknown>;
  reset: () => Promise<unknown>;
  verify: () => Promise<boolean>;
  onFailure: () => Error;
}

/**
 * Vérifie un secret (PIN, mot de passe) avec verrouillage après
 * MAX_FAILED_ATTEMPTS échecs. La tentative est comptée AVANT la vérification
 * (incrément atomique en base) : une rafale de requêtes parallèles ne peut pas
 * dépasser le quota. Pendant le blocage, le secret n'est même pas vérifié.
 */
async function verifyWithLockout(guard: AttemptGuard): Promise<void> {
  const now = Date.now();
  const lockedFor = (until: Date) =>
    new TooManyAttemptsError(Math.ceil((until.getTime() - now) / 60_000));

  if (guard.lockedUntil && guard.lockedUntil.getTime() > now) {
    throw lockedFor(guard.lockedUntil);
  }

  const attempts = await guard.registerAttempt();
  if (attempts > MAX_FAILED_ATTEMPTS) {
    const until = new Date(now + LOCK_DURATION_MS);
    await guard.lock(until);
    throw lockedFor(until);
  }

  if (!(await guard.verify())) {
    if (attempts >= MAX_FAILED_ATTEMPTS) {
      await guard.lock(new Date(now + LOCK_DURATION_MS));
    }
    throw guard.onFailure();
  }

  await guard.reset();
}

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

  await verifyWithLockout({
    lockedUntil: user.loginLockedUntil,
    registerAttempt: () => registerLoginAttempt(user.id),
    lock: (until) => lockLogin(user.id, until),
    reset: () => resetLoginAttempts(user.id),
    verify: () => argon2.verify(user.passwordHash, input.password),
    onFailure: () => new UnauthorizedError("Email ou mot de passe incorrect"),
  });

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
  if (member.pinRequired) {
    const pinHash = member.pin;
    if (!pinHash) {
      throw new UnauthorizedError("Aucun PIN configuré pour cet enfant");
    }
    await verifyWithLockout({
      lockedUntil: member.pinLockedUntil,
      registerAttempt: () => registerChildPinAttempt(member.id),
      lock: (until) => lockChildPin(member.id, until),
      reset: () => resetChildPinAttempts(member.id),
      verify: async () =>
        input.pin !== undefined && (await argon2.verify(pinHash, input.pin)),
      onFailure: () => new UnauthorizedError("PIN incorrect"),
    });
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
