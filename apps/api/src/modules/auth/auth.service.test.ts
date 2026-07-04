import { describe, it, expect, vi, beforeEach } from "vitest";
import { ConflictError, UnauthorizedError } from "../../core/errors/AppError.js";

// Mocks hoistés avant les imports du module testé
vi.mock("../../config/env", () => ({
  env: {
    JWT_SECRET: "test-secret-key",
    JWT_EXPIRES_IN: "15m",
    JWT_REFRESH_EXPIRES_IN: "7d",
    NODE_ENV: "test",
  },
}));

vi.mock("./auth.repository", () => ({
  findUserByEmail: vi.fn(),
  createUserWithFamily: vi.fn(),
}));

vi.mock("argon2", () => ({
  hash: vi.fn(),
  verify: vi.fn(),
}));

import * as repo from "./auth.repository.js";
import * as argon2 from "argon2";
import { registerService, loginService } from "./auth.service.js";

const mockHash = vi.mocked(argon2.hash);
const mockVerify = vi.mocked(argon2.verify);
const mockFindByEmail = vi.mocked(repo.findUserByEmail);
const mockCreateUserWithFamily = vi.mocked(repo.createUserWithFamily);

const fakeUser = {
  id: "user-1",
  email: "parent@test.com",
  passwordHash: "hashed",
  members: [],
};
const fakeFamily = { id: "family-1", name: "Famille Test" };
const fakeMember = {
  id: "member-1",
  name: "Alice",
  role: "PARENT" as const,
  familyId: "family-1",
  family: fakeFamily,
  userId: "user-1",
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("registerService", () => {
  it("lève ConflictError si l'email existe déjà", async () => {
    mockFindByEmail.mockResolvedValue(fakeUser as any);

    await expect(
      registerService({
        email: "parent@test.com",
        password: "password123",
        familyName: "Test",
        parentName: "Alice",
        timezone: "Europe/Paris",
        locale: "fr",
      }),
    ).rejects.toThrow(ConflictError);
  });

  it("crée l'utilisateur et retourne tokens + user + family + member", async () => {
    mockFindByEmail.mockResolvedValue(null);
    mockHash.mockResolvedValue("hashed-password" as any);
    mockCreateUserWithFamily.mockResolvedValue({
      user: fakeUser,
      family: fakeFamily,
      member: fakeMember,
    } as any);

    const result = await registerService({
      email: "parent@test.com",
      password: "password123",
      familyName: "Famille Test",
      parentName: "Alice",
      timezone: "Europe/Paris",
      locale: "fr",
    });

    expect(result.user.email).toBe("parent@test.com");
    expect(result.family.name).toBe("Famille Test");
    expect(result.member.role).toBe("PARENT");
    expect(result.tokens.accessToken).toBeDefined();
    expect(result.tokens.refreshToken).toBeDefined();
    expect(mockHash).toHaveBeenCalledWith("password123");
    expect(mockCreateUserWithFamily).toHaveBeenCalledOnce();
  });
});

describe("loginService", () => {
  it("lève UnauthorizedError si l'utilisateur n'existe pas", async () => {
    mockFindByEmail.mockResolvedValue(null);

    await expect(
      loginService({ email: "inconnu@test.com", password: "123" }),
    ).rejects.toThrow(UnauthorizedError);
  });

  it("lève UnauthorizedError si le mot de passe est incorrect", async () => {
    mockFindByEmail.mockResolvedValue(fakeUser as any);
    mockVerify.mockResolvedValue(false);

    await expect(
      loginService({ email: "parent@test.com", password: "mauvais" }),
    ).rejects.toThrow(UnauthorizedError);
  });

  it("lève UnauthorizedError si aucun membre PARENT trouvé", async () => {
    const userWithoutParent = { ...fakeUser, members: [{ role: "CHILD" }] };
    mockFindByEmail.mockResolvedValue(userWithoutParent as any);
    mockVerify.mockResolvedValue(true);

    await expect(
      loginService({ email: "parent@test.com", password: "password123" }),
    ).rejects.toThrow(UnauthorizedError);
  });

  it("retourne tokens + user + family + member en cas de succès", async () => {
    const userWithMember = { ...fakeUser, members: [fakeMember] };
    mockFindByEmail.mockResolvedValue(userWithMember as any);
    mockVerify.mockResolvedValue(true);

    const result = await loginService({
      email: "parent@test.com",
      password: "password123",
    });

    expect(result.user.id).toBe("user-1");
    expect(result.family.name).toBe("Famille Test");
    expect(result.member.role).toBe("PARENT");
    expect(result.tokens.accessToken).toBeDefined();
  });
});
