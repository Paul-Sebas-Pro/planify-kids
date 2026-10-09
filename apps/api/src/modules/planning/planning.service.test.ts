import { describe, it, expect, vi, beforeEach } from "vitest";
import { NotFoundError } from "../../core/errors/AppError.js";

vi.mock("../../config/database", () => ({ prisma: {} }));

vi.mock("./planning.repository", () => ({
  createScheduleWithItems: vi.fn(),
  getSchedulesByFamily: vi.fn(),
  getScheduleWithItems: vi.fn(),
  getScheduleItemWithTask: vi.fn(),
  getScheduleItem: vi.fn(),
  getMemberLoadHistory: vi.fn(),
  getFamilySchoolZone: vi.fn(),
  updateScheduleItemIfStatus: vi.fn(),
  deleteSchedule: vi.fn(),
}));

vi.mock("../../services/gamification", () => ({
  awardPointsForTask: vi.fn(),
  revokePointsForTask: vi.fn(),
}));

vi.mock("../notifications/notifications.service", () => ({
  notifyTaskCompleted: vi.fn(),
  notifyTasksAssigned: vi.fn(),
}));

vi.mock("../../services/sse.service", () => ({ sseEmit: vi.fn() }));
vi.mock("../../services/school-calendar", () => ({
  classifyDays: vi.fn(),
  getCalendarEntries: vi.fn(),
}));
vi.mock("../tasks/tasks.repository", () => ({ getTasksByFamily: vi.fn() }));
vi.mock("../members/members.repository", () => ({
  getMembersByFamily: vi.fn(),
}));

import * as repo from "./planning.repository.js";
import * as gamification from "../../services/gamification.js";
import { ConflictError, ForbiddenError } from "../../core/errors/AppError.js";
import { updateScheduleItemService } from "./planning.service.js";

const mockGetItem = vi.mocked(repo.getScheduleItemWithTask);
const mockGetPlainItem = vi.mocked(repo.getScheduleItem);
const mockCas = vi.mocked(repo.updateScheduleItemIfStatus);
const mockAward = vi.mocked(gamification.awardPointsForTask);
const mockRevoke = vi.mocked(gamification.revokePointsForTask);

const parent = { familyId: "fam-1", role: "PARENT" as const, memberId: "parent-1" };
const child = { familyId: "fam-1", role: "CHILD" as const, memberId: "member-1" };

const T0 = new Date("2026-10-09T10:00:00.123Z");

const fakeItem = (status: string, familyId = "fam-1", assignee = "member-1") =>
  ({
    status,
    updatedAt: T0,
    assignedToMemberId: assignee,
    task: { points: 10, name: "Ranger sa chambre" },
    member: { name: "Alice" },
    schedule: { familyId },
  }) as any;

beforeEach(() => {
  vi.clearAllMocks();
  mockCas.mockResolvedValue({ id: "item-1" } as any);
  mockGetPlainItem.mockResolvedValue({ id: "item-1" } as any);
});

describe("updateScheduleItemService", () => {
  it("crédite les points quand l'item passe à COMPLETED (écriture conditionnelle)", async () => {
    mockGetItem.mockResolvedValue(fakeItem("PENDING"));

    await updateScheduleItemService("item-1", child, { status: "COMPLETED" });

    expect(mockCas).toHaveBeenCalledWith(
      "item-1",
      { status: "PENDING", updatedAt: T0 },
      { status: "COMPLETED" },
    );
    expect(mockAward).toHaveBeenCalledWith("member-1", 10);
  });

  it("retire les points sur un retour arrière depuis COMPLETED", async () => {
    mockGetItem.mockResolvedValue(fakeItem("COMPLETED"));

    await updateScheduleItemService("item-1", parent, { status: "PENDING" });

    expect(mockRevoke).toHaveBeenCalledWith("member-1", 10);
    expect(mockAward).not.toHaveBeenCalled();
  });

  it("404 sans rien modifier si l'item appartient à une autre famille", async () => {
    mockGetItem.mockResolvedValue(fakeItem("PENDING", "fam-2"));

    await expect(
      updateScheduleItemService("item-1", parent, { status: "COMPLETED" }),
    ).rejects.toBeInstanceOf(NotFoundError);
    expect(mockCas).not.toHaveBeenCalled();
    expect(mockAward).not.toHaveBeenCalled();
  });

  it("404 si l'item n'existe pas", async () => {
    mockGetItem.mockResolvedValue(null);

    await expect(
      updateScheduleItemService("item-x", parent, { status: "COMPLETED" }),
    ).rejects.toBeInstanceOf(NotFoundError);
    expect(mockCas).not.toHaveBeenCalled();
  });
});

describe("updateScheduleItemService — stratégie de conflit (option A)", () => {
  it("un enfant ne modifie pas la tâche d'un autre enfant (403)", async () => {
    mockGetItem.mockResolvedValue(fakeItem("PENDING", "fam-1", "member-2"));

    await expect(
      updateScheduleItemService("item-1", child, { status: "COMPLETED" }),
    ).rejects.toBeInstanceOf(ForbiddenError);
    expect(mockCas).not.toHaveBeenCalled();
  });

  it("un parent peut modifier la tâche de n'importe quel enfant", async () => {
    mockGetItem.mockResolvedValue(fakeItem("PENDING", "fam-1", "member-2"));

    await updateScheduleItemService("item-1", parent, { status: "SKIPPED" });

    expect(mockCas).toHaveBeenCalled();
  });

  it("écriture hors ligne périmée (parent a changé entre-temps) — 409, décision du parent gardée", async () => {
    // L'enfant a coché hors ligne alors que la tâche était PENDING ; le
    // parent l'a passée SKIPPED avant la reconnexion.
    mockGetItem.mockResolvedValue(fakeItem("SKIPPED"));

    await expect(
      updateScheduleItemService("item-1", child, {
        status: "COMPLETED",
        expectedStatus: "PENDING",
      }),
    ).rejects.toBeInstanceOf(ConflictError);
    expect(mockCas).not.toHaveBeenCalled();
    expect(mockAward).not.toHaveBeenCalled();
  });

  it("déjà dans l'état demandé, sans conflit — succès sans réécriture ni double crédit", async () => {
    // Écriture rejouée (ex. batch renvoyé après une coupure réseau).
    mockGetItem.mockResolvedValue(fakeItem("COMPLETED"));

    await updateScheduleItemService("item-1", child, {
      status: "COMPLETED",
      expectedStatus: "COMPLETED",
      expectedUpdatedAt: T0.toISOString(),
    });

    expect(mockCas).not.toHaveBeenCalled();
    expect(mockAward).not.toHaveBeenCalled();
  });

  it("déjà dans l'état demandé mais modifié entre-temps — 409 (date serveur non renvoyée)", async () => {
    // Cochée hors ligne sur la tablette ; le parent a fait le tour des
    // statuts jusqu'à Fait. Répondre 200 avec la date serveur la ferait
    // reprendre par la tablette pour sa décoche suivante (conflit blanchi).
    mockGetItem.mockResolvedValue({
      ...fakeItem("COMPLETED"),
      updatedAt: new Date("2026-10-09T10:05:00.000Z"),
    });

    await expect(
      updateScheduleItemService("item-1", child, {
        status: "COMPLETED",
        expectedStatus: "PENDING",
        expectedUpdatedAt: T0.toISOString(),
      }),
    ).rejects.toBeInstanceOf(ConflictError);
    expect(mockGetPlainItem).not.toHaveBeenCalled();
    expect(mockAward).not.toHaveBeenCalled();
  });

  it("modifiée par une requête concurrente entre lecture et écriture — 409, pas de crédit", async () => {
    mockGetItem.mockResolvedValue(fakeItem("PENDING"));
    mockCas.mockResolvedValue(null);

    await expect(
      updateScheduleItemService("item-1", child, { status: "COMPLETED" }),
    ).rejects.toBeInstanceOf(ConflictError);
    expect(mockAward).not.toHaveBeenCalled();
  });

  it("ABA — statut revenu à l'identique mais modifié entre-temps : 409", async () => {
    // Tablette hors ligne : Fait → À faire. Pendant ce temps, le parent fait
    // le tour Fait → Passée → À faire → Fait sur le web : même statut qu'au
    // départ, mais updatedAt a changé.
    mockGetItem.mockResolvedValue({
      ...fakeItem("COMPLETED"),
      updatedAt: new Date("2026-10-09T10:05:00.000Z"),
    });

    await expect(
      updateScheduleItemService("item-1", child, {
        status: "PENDING",
        expectedStatus: "COMPLETED",
        expectedUpdatedAt: T0.toISOString(),
      }),
    ).rejects.toBeInstanceOf(ConflictError);
    expect(mockCas).not.toHaveBeenCalled();
    expect(mockRevoke).not.toHaveBeenCalled();
  });

  it("expectedUpdatedAt à jour — écriture acceptée", async () => {
    mockGetItem.mockResolvedValue(fakeItem("COMPLETED"));

    await updateScheduleItemService("item-1", child, {
      status: "PENDING",
      expectedStatus: "COMPLETED",
      expectedUpdatedAt: T0.toISOString(),
    });

    expect(mockCas).toHaveBeenCalled();
    expect(mockRevoke).toHaveBeenCalledWith("member-1", 10);
  });
});
