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

export interface ScheduleItemDetail extends ScheduleItem {
  task: {
    name: string;
    icon?: string;
    points: number;
    difficulty: number;
  };
  member: {
    name: string;
    color?: string;
    avatar?: string;
  };
}

export interface Schedule {
  id: string;
  familyId: string;
  startDate: string;
  endDate: string;
  generatedByAI: boolean;
  createdAt: string;
  _count: { items: number };
}

export interface ScheduleDetail {
  id: string;
  familyId: string;
  startDate: string;
  endDate: string;
  generatedByAI: boolean;
  createdAt: string;
  items: ScheduleItemDetail[];
}

export interface GeneratePlanningRequest {
  startDate: string;
  endDate: string;
}

export interface CompleteTaskRequest {
  scheduleItemId: string;
}

export interface SwapTaskRequest {
  scheduleItemId: string;
  toMemberId: string;
}
