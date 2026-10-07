import { describe, it, expect, vi, beforeEach } from "vitest";
import { NotFoundError } from "../../core/errors/AppError.js";

vi.mock("../../config/database", () => ({ prisma: {} }));

vi.mock("./planning.repository", () => ({
  createScheduleWithItems: vi.fn(),
  getSchedulesByFamily: vi.fn(),
  getScheduleWithItems: vi.fn(),
  getScheduleItemWithTask: vi.fn(),
  getMemberLoadHistory: vi.fn(),
  getFamilySchoolZone: vi.fn(),
  updateScheduleItem: vi.fn(),
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
import { updateScheduleItemService } from "./planning.service.js";

const mockGetItem = vi.mocked(repo.getScheduleItemWithTask);
const mockUpdateItem = vi.mocked(repo.updateScheduleItem);
const mockAward = vi.mocked(gamification.awardPointsForTask);
const mockRevoke = vi.mocked(gamification.revokePointsForTask);

const fakeItem = (status: string, familyId = "fam-1") =>
  ({
    status,
    assignedToMemberId: "member-1",
    task: { points: 10, name: "Ranger sa chambre" },
    member: { name: "Alice" },
    schedule: { familyId },
  }) as any;

beforeEach(() => {
  vi.clearAllMocks();
  mockUpdateItem.mockResolvedValue({ id: "item-1" } as any);
});

describe("updateScheduleItemService", () => {
  it("crédite les points quand l'item de la famille passe à COMPLETED", async () => {
    mockGetItem.mockResolvedValue(fakeItem("PENDING"));

    await updateScheduleItemService("item-1", "fam-1", { status: "COMPLETED" });

    expect(mockUpdateItem).toHaveBeenCalledWith("item-1", {
      status: "COMPLETED",
    });
    expect(mockAward).toHaveBeenCalledWith("member-1", 10);
  });

  it("retire les points sur un retour arrière depuis COMPLETED", async () => {
    mockGetItem.mockResolvedValue(fakeItem("COMPLETED"));

    await updateScheduleItemService("item-1", "fam-1", { status: "PENDING" });

    expect(mockRevoke).toHaveBeenCalledWith("member-1", 10);
    expect(mockAward).not.toHaveBeenCalled();
  });

  it("404 sans rien modifier si l'item appartient à une autre famille", async () => {
    mockGetItem.mockResolvedValue(fakeItem("PENDING", "fam-2"));

    await expect(
      updateScheduleItemService("item-1", "fam-1", { status: "COMPLETED" }),
    ).rejects.toBeInstanceOf(NotFoundError);

    expect(mockUpdateItem).not.toHaveBeenCalled();
    expect(mockAward).not.toHaveBeenCalled();
  });

  it("404 si l'item n'existe pas", async () => {
    mockGetItem.mockResolvedValue(null);

    await expect(
      updateScheduleItemService("item-x", "fam-1", { status: "COMPLETED" }),
    ).rejects.toBeInstanceOf(NotFoundError);

    expect(mockUpdateItem).not.toHaveBeenCalled();
  });
});
