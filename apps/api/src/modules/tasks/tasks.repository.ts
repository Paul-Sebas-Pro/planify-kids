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
    data: {
      familyId,
      name: input.name,
      description: input.description ?? null,
      icon: input.icon ?? null,
      difficulty: input.difficulty,
      duration: input.duration,
      points: input.points,
      frequency: input.frequency,
      isMandatory: input.isMandatory,
    },
  });
}

export function updateTask(id: string, input: UpdateTaskInput) {
  return prisma.taskTemplate.update({
    where: { id },
    data: {
      ...(input.name !== undefined && { name: input.name }),
      ...(input.description !== undefined && { description: input.description ?? null }),
      ...(input.icon !== undefined && { icon: input.icon ?? null }),
      ...(input.difficulty !== undefined && { difficulty: input.difficulty }),
      ...(input.duration !== undefined && { duration: input.duration }),
      ...(input.points !== undefined && { points: input.points }),
      ...(input.frequency !== undefined && { frequency: input.frequency }),
      ...(input.isMandatory !== undefined && { isMandatory: input.isMandatory }),
      ...(input.isActive !== undefined && { isActive: input.isActive }),
    },
  });
}

export function deleteTask(id: string) {
  return prisma.taskTemplate.delete({ where: { id } });
}
