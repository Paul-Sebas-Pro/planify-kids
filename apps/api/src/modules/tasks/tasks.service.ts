import { NotFoundError } from "../../core/errors/AppError.js";
import {
  getTasksByFamily,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
} from "./tasks.repository.js";
import type { CreateTaskInput, UpdateTaskInput } from "./tasks.schema.js";

export function listTasksService(familyId: string, activeOnly: boolean) {
  return getTasksByFamily(familyId, activeOnly);
}

export function createTaskService(familyId: string, input: CreateTaskInput) {
  return createTask(familyId, input);
}

export async function updateTaskService(
  id: string,
  familyId: string,
  input: UpdateTaskInput,
) {
  const task = await getTaskById(id, familyId);
  if (!task) throw new NotFoundError("Tâche");
  return updateTask(id, input);
}

export async function deleteTaskService(id: string, familyId: string) {
  const task = await getTaskById(id, familyId);
  if (!task) throw new NotFoundError("Tâche");
  return deleteTask(id);
}
