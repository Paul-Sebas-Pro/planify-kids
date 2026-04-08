export type TaskStatus = "PENDING" | "COMPLETED" | "SKIPPED";
export type Frequency = "daily" | "weekly" | "monthly";

export interface TaskTemplate {
  id: string;
  familyId: string;
  name: string;
  description?: string;
  icon?: string;
  difficulty: number;   // 1-3
  duration: number;     // minutes
  points: number;
  frequency: Frequency;
  isActive: boolean;
  isMandatory: boolean;
  createdAt: string;
}

export interface CreateTaskRequest {
  name: string;
  description?: string;
  icon?: string;
  difficulty: number;
  duration: number;
  points: number;
  frequency: Frequency;
  isMandatory?: boolean;
}

export interface UpdateTaskRequest extends Partial<CreateTaskRequest> {
  isActive?: boolean;
}
