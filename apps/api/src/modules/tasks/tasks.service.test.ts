import { describe, it, expect, vi, beforeEach } from "vitest";
import { NotFoundError } from "../../core/errors/AppError";

vi.mock("./tasks.repository", () => ({
  getTasksByFamily: vi.fn(),
  getTaskById: vi.fn(),
  createTask: vi.fn(),
  updateTask: vi.fn(),
  deleteTask: vi.fn(),
}));

import * as repo from "./tasks.repository";
import {
  listTasksService,
  createTaskService,
  updateTaskService,
  deleteTaskService,
} from "./tasks.service";

const mockGetByFamily = vi.mocked(repo.getTasksByFamily);
const mockGetById = vi.mocked(repo.getTaskById);
const mockCreate = vi.mocked(repo.createTask);
const mockUpdate = vi.mocked(repo.updateTask);
const mockDelete = vi.mocked(repo.deleteTask);

const fakeTask = {
  id: "task-1",
  familyId: "family-1",
  name: "Faire son lit",
  description: null,
  icon: null,
  difficulty: 1,
  duration: 10,
  points: 5,
  frequency: "daily" as const,
  isActive: true,
  isMandatory: false,
  createdAt: new Date(),
  updatedAt: new Date(),
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("listTasksService", () => {
  it("filtre les tâches actives par défaut", async () => {
    mockGetByFamily.mockResolvedValue([fakeTask] as any);

    await listTasksService("family-1", true);

    expect(mockGetByFamily).toHaveBeenCalledWith("family-1", true);
  });

  it("retourne toutes les tâches si activeOnly=false", async () => {
    mockGetByFamily.mockResolvedValue([fakeTask] as any);

    await listTasksService("family-1", false);

    expect(mockGetByFamily).toHaveBeenCalledWith("family-1", false);
  });
});

describe("createTaskService", () => {
  it("délègue au repository avec familyId + input", async () => {
    mockCreate.mockResolvedValue(fakeTask as any);

    const input = {
      name: "Faire son lit",
      difficulty: 1,
      duration: 10,
      points: 5,
      frequency: "daily" as const,
      isMandatory: false,
    };

    await createTaskService("family-1", input);

    expect(mockCreate).toHaveBeenCalledWith("family-1", input);
  });
});

describe("updateTaskService", () => {
  it("lève NotFoundError si la tâche n'existe pas", async () => {
    mockGetById.mockResolvedValue(null);

    await expect(
      updateTaskService("task-x", "family-1", { name: "Nouvelle" }),
    ).rejects.toThrow(NotFoundError);

    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("met à jour si la tâche appartient à la famille", async () => {
    mockGetById.mockResolvedValue(fakeTask as any);
    mockUpdate.mockResolvedValue({ ...fakeTask, name: "Nouvelle" } as any);

    const result = await updateTaskService("task-1", "family-1", {
      name: "Nouvelle",
    });

    expect(mockUpdate).toHaveBeenCalledWith("task-1", { name: "Nouvelle" });
    expect(result.name).toBe("Nouvelle");
  });

  it("ne peut pas mettre à jour une tâche d'une autre famille", async () => {
    mockGetById.mockResolvedValue(null); // getTaskById vérifie familyId, renvoie null si pas la bonne famille

    await expect(
      updateTaskService("task-1", "family-autre", { name: "Hack" }),
    ).rejects.toThrow(NotFoundError);
  });
});

describe("deleteTaskService", () => {
  it("lève NotFoundError si la tâche n'existe pas", async () => {
    mockGetById.mockResolvedValue(null);

    await expect(deleteTaskService("task-x", "family-1")).rejects.toThrow(
      NotFoundError,
    );

    expect(mockDelete).not.toHaveBeenCalled();
  });

  it("supprime si la tâche appartient à la famille", async () => {
    mockGetById.mockResolvedValue(fakeTask as any);
    mockDelete.mockResolvedValue(fakeTask as any);

    await deleteTaskService("task-1", "family-1");

    expect(mockDelete).toHaveBeenCalledWith("task-1");
  });
});
