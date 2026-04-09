import { prisma } from "../../config/database";
import type { CreateTaskInput, UpdateTaskInput } from "./tasks.schema";

export function getTasksByFamily(familyId: string, activeOnly = true) {
  return prisma.taskTemplate.findMany({
    where: { familyId, ...(activeOnly ? { isActive: true } : {}) },
    orderBy: [{ difficulty: "asc" }, { name: "asc" }],
  });
}

export function getTaskById(id: string, familyId: string) {
  return prisma.taskTemplate.findFirst({
    where: { id, familyId },
  });
}

export function createTask(familyId: string, input: CreateTaskInput) {
  return prisma.taskTemplate.create({
    data: { familyId, ...input },
  });
}

export function updateTask(id: string, input: UpdateTaskInput) {
  return prisma.taskTemplate.update({
    where: { id },
    data: input,
  });
}

export function deleteTask(id: string) {
  return prisma.taskTemplate.delete({ where: { id } });
}
