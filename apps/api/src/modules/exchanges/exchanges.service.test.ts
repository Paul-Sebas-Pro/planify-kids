import { describe, it, expect, vi, beforeEach } from "vitest";
import { AppError, NotFoundError } from "../../core/errors/AppError.js";

vi.mock("./exchanges.repository", () => ({
  getExchangesByFamily: vi.fn(),
  getExchangeById: vi.fn(),
  getPendingExchangeForItem: vi.fn(),
  createExchange: vi.fn(),
  updateExchangeStatus: vi.fn(),
  reassignScheduleItem: vi.fn(),
}));

vi.mock("../members/members.repository", () => ({
  getMemberById: vi.fn(),
}));

import * as repo from "./exchanges.repository.js";
import * as membersRepo from "../members/members.repository.js";
import {
  proposeExchangeService,
  respondExchangeService,
} from "./exchanges.service.js";

const mockGetExchangeById = vi.mocked(repo.getExchangeById);
const mockGetPending = vi.mocked(repo.getPendingExchangeForItem);
const mockCreate = vi.mocked(repo.createExchange);
const mockUpdateStatus = vi.mocked(repo.updateExchangeStatus);
const mockReassign = vi.mocked(repo.reassignScheduleItem);
const mockGetMember = vi.mocked(membersRepo.getMemberById);

const fakeMember = (id: string) => ({
  id,
  familyId: "family-1",
  name: id === "member-1" ? "Alice" : "Bob",
  role: "CHILD" as const,
  points: 50,
  createdAt: new Date(),
  updatedAt: new Date(),
});

const fakeExchange = {
  id: "exchange-1",
  scheduleItemId: "item-1",
  fromMemberId: "member-1",
  toMemberId: "member-2",
  status: "PENDING" as const,
  createdAt: new Date(),
  updatedAt: new Date(),
  scheduleItem: {
    date: new Date(),
    assignedToMemberId: "member-1",
    schedule: { familyId: "family-1" },
    task: { name: "Faire son lit", icon: null, points: 10 },
  },
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("proposeExchangeService", () => {
  const input = {
    scheduleItemId: "item-1",
    fromMemberId: "member-1",
    toMemberId: "member-2",
  };

  it("lève AppError si fromMember === toMember", async () => {
    await expect(
      proposeExchangeService("family-1", {
        ...input,
        toMemberId: "member-1",
      }),
    ).rejects.toThrow(AppError);

    expect(mockGetMember).not.toHaveBeenCalled();
  });

  it("lève NotFoundError si fromMember absent de la famille", async () => {
    mockGetMember.mockResolvedValueOnce(null);

    await expect(
      proposeExchangeService("family-1", input),
    ).rejects.toThrow(NotFoundError);
  });

  it("lève NotFoundError si toMember absent de la famille", async () => {
    mockGetMember
      .mockResolvedValueOnce(fakeMember("member-1") as any)
      .mockResolvedValueOnce(null);

    await expect(
      proposeExchangeService("family-1", input),
    ).rejects.toThrow(NotFoundError);
  });

  it("lève AppError si échange PENDING déjà existant pour cet item", async () => {
    mockGetMember
      .mockResolvedValueOnce(fakeMember("member-1") as any)
      .mockResolvedValueOnce(fakeMember("member-2") as any);
    mockGetPending.mockResolvedValue({ id: "exchange-old" } as any);

    await expect(
      proposeExchangeService("family-1", input),
    ).rejects.toThrow(AppError);

    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("crée l'échange si toutes les validations passent", async () => {
    mockGetMember
      .mockResolvedValueOnce(fakeMember("member-1") as any)
      .mockResolvedValueOnce(fakeMember("member-2") as any);
    mockGetPending.mockResolvedValue(null);
    mockCreate.mockResolvedValue(fakeExchange as any);

    await proposeExchangeService("family-1", input);

    expect(mockCreate).toHaveBeenCalledWith(input);
  });
});

describe("respondExchangeService", () => {
  it("lève NotFoundError si échange inexistant", async () => {
    mockGetExchangeById.mockResolvedValue(null);

    await expect(
      respondExchangeService("exchange-x", "family-1", { status: "ACCEPTED" }),
    ).rejects.toThrow(NotFoundError);
  });

  it("lève NotFoundError si échange appartient à autre famille", async () => {
    mockGetExchangeById.mockResolvedValue({
      ...fakeExchange,
      scheduleItem: { ...fakeExchange.scheduleItem, schedule: { familyId: "family-other" } },
    } as any);

    await expect(
      respondExchangeService("exchange-1", "family-1", { status: "ACCEPTED" }),
    ).rejects.toThrow(NotFoundError);
  });

  it("lève AppError si échange déjà traité", async () => {
    mockGetExchangeById.mockResolvedValue({
      ...fakeExchange,
      status: "ACCEPTED",
    } as any);

    await expect(
      respondExchangeService("exchange-1", "family-1", { status: "REFUSED" }),
    ).rejects.toThrow(AppError);
  });

  it("réassigne l'item si ACCEPTED", async () => {
    mockGetExchangeById.mockResolvedValue(fakeExchange as any);
    mockUpdateStatus.mockResolvedValue({ ...fakeExchange, status: "ACCEPTED" } as any);

    await respondExchangeService("exchange-1", "family-1", { status: "ACCEPTED" });

    expect(mockReassign).toHaveBeenCalledWith("item-1", "member-2");
  });

  it("ne réassigne pas si REFUSED", async () => {
    mockGetExchangeById.mockResolvedValue(fakeExchange as any);
    mockUpdateStatus.mockResolvedValue({ ...fakeExchange, status: "REFUSED" } as any);

    await respondExchangeService("exchange-1", "family-1", { status: "REFUSED" });

    expect(mockReassign).not.toHaveBeenCalled();
  });
});
