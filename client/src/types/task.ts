export type TaskStatus = "TODO" | "IN_PROGRESS" | "DONE";

export type Priority = "LOW" | "MEDIUM" | "HIGH";

export interface Task {
  id: string;
  orgId: string;
  ownerId: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: Priority;
  tags: string[];
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TaskListResponse {
  items: Task[];
  nextCursor: string | null;
}

export interface ListTasksParams {
  status?: TaskStatus;
  priority?: Priority;
  tags?: string;
  q?: string;
  cursor?: string;
  limit?: number;
}

export interface CreateTaskInput {
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: Priority;
  tags?: string[];
  dueDate?: string;
}

export type UpdateTaskInput = Partial<CreateTaskInput>;

export interface BulkUpdateSet {
  status?: TaskStatus;
  priority?: Priority;
}

export interface BulkUpdateResponse {
  updatedIds: string[];
  skippedIds: string[];
}

export const TASK_STATUSES: TaskStatus[] = ["TODO", "IN_PROGRESS", "DONE"];
export const PRIORITIES: Priority[] = ["LOW", "MEDIUM", "HIGH"];
