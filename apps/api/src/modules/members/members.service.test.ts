import { describe, it, expect, vi, beforeEach } from "vitest";
import { NotFoundError, ForbiddenError } from "../../core/errors/AppError.js";

vi.mock("./members.repository", () => ({
  getMembersByFamily: vi.fn(),
  getMemberById: vi.fn(),
  createMember: vi.fn(),
  updateMember: vi.fn(),
  deleteMember: vi.fn(),
  unlockMemberPin: vi.fn(),
}));

import * as repo from "./members.repository.js";
import {
  listMembersService,
  createMemberService,
  updateMemberService,
  deleteMemberService,
  unlockPinService,
} from "./members.service.js";

const mockGetByFamily = vi.mocked(repo.getMembersByFamily);
const mockGetById = vi.mocked(repo.getMemberById);
const mockCreate = vi.mocked(repo.createMember);
const mockUpdate = vi.mocked(repo.updateMember);
const mockDelete = vi.mocked(repo.deleteMember);

const fakeMember = {
  id: "member-1",
  familyId: "family-1",
  userId: "user-1",
  name: "Emma",
  role: "CHILD" as const,
  points: 0,
  color: "#FF9800",
  avatar: null,
  birthDate: null,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("listMembersService", () => {
  it("délègue au repository avec le familyId", async () => {
    mockGetByFamily.mockResolvedValue([fakeMember] as any);

    const result = await listMembersService("family-1");

    expect(mockGetByFamily).toHaveBeenCalledWith("family-1");
    expect(result).toHaveLength(1);
  });
});

describe("createMemberService", () => {
  it("délègue au repository avec familyId + input", async () => {
    mockCreate.mockResolvedValue(fakeMember as any);

    const input = { name: "Emma", role: "CHILD" as const };
    await createMemberService("family-1", input);

    expect(mockCreate).toHaveBeenCalledWith("family-1", input);
  });
});

describe("updateMemberService", () => {
  it("lève NotFoundError si le membre n'existe pas", async () => {
    mockGetById.mockResolvedValue(null);

    await expect(
      updateMemberService("member-x", "family-1", { name: "Nouveau" }),
    ).rejects.toThrow(NotFoundError);

    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("met à jour si le membre appartient à la famille", async () => {
    mockGetById.mockResolvedValue(fakeMember as any);
    mockUpdate.mockResolvedValue({ ...fakeMember, name: "Nouveau" } as any);

    const result = await updateMemberService("member-1", "family-1", {
      name: "Nouveau",
    });

    expect(mockUpdate).toHaveBeenCalledWith("member-1", { name: "Nouveau" });
    expect(result.name).toBe("Nouveau");
  });

  it("désactive le PIN d'un enfant", async () => {
    mockGetById.mockResolvedValue(fakeMember as any);
    mockUpdate.mockResolvedValue({ ...fakeMember, pinRequired: false } as any);

    await updateMemberService("member-1", "family-1", { pinRequired: false });

    expect(mockUpdate).toHaveBeenCalledWith("member-1", { pinRequired: false });
  });

  it("refuse pinRequired sur un parent (ForbiddenError)", async () => {
    mockGetById.mockResolvedValue({ ...fakeMember, role: "PARENT" } as any);

    await expect(
      updateMemberService("member-1", "family-1", { pinRequired: false }),
    ).rejects.toThrow(ForbiddenError);
    expect(mockUpdate).not.toHaveBeenCalled();
  });
});

describe("deleteMemberService", () => {
  it("lève NotFoundError si le membre n'existe pas", async () => {
    mockGetById.mockResolvedValue(null);

    await expect(
      deleteMemberService("member-x", "family-1", "user-1"),
    ).rejects.toThrow(NotFoundError);

    expect(mockDelete).not.toHaveBeenCalled();
  });

  it("lève ForbiddenError si le membre essaie de se supprimer lui-même", async () => {
    mockGetById.mockResolvedValue(fakeMember as any);

    await expect(
      deleteMemberService("member-1", "family-1", "user-1"),
    ).rejects.toThrow(ForbiddenError);

    expect(mockDelete).not.toHaveBeenCalled();
  });

  it("supprime si le membre appartient à la famille et n'est pas soi-même", async () => {
    mockGetById.mockResolvedValue(fakeMember as any);
    mockDelete.mockResolvedValue(fakeMember as any);

    await deleteMemberService("member-1", "family-1", "user-autre");

    expect(mockDelete).toHaveBeenCalledWith("member-1");
  });
});

describe("unlockPinService", () => {
  it("débloque un enfant de la famille", async () => {
    mockGetById.mockResolvedValue(fakeMember as any);

    await unlockPinService("member-1", "family-1");

    expect(vi.mocked(repo.unlockMemberPin)).toHaveBeenCalledWith("member-1");
  });

  it("NotFoundError si le membre n'est pas de la famille", async () => {
    mockGetById.mockResolvedValue(null);

    await expect(unlockPinService("member-x", "family-1")).rejects.toThrow(
      NotFoundError,
    );
  });

  it("ForbiddenError sur un parent", async () => {
    mockGetById.mockResolvedValue({ ...fakeMember, role: "PARENT" } as any);

    await expect(unlockPinService("member-1", "family-1")).rejects.toThrow(
      ForbiddenError,
    );
  });
});
