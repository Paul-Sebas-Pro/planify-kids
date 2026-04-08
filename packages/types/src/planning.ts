import type { TaskStatus } from "./task.js";

export interface ScheduleItem {
  id: string;
  scheduleId: string;
  taskTemplateId: string;
  assignedToMemberId: string;
  date: string;
  status: TaskStatus;
  completedAt?: string;
  updatedAt: string;
}

export interface PlanningWeek {
  scheduleId: string;
  startDate: string;
  endDate: string;
  items: ScheduleItem[];
}

export interface CompleteTaskRequest {
  scheduleItemId: string;
}

export interface SwapTaskRequest {
  scheduleItemId: string;
  toMemberId: string;
}
