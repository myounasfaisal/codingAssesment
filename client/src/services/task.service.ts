import { api } from "./api";
import type {
  BulkUpdateResponse,
  BulkUpdateSet,
  CreateTaskInput,
  ListTasksParams,
  Task,
  TaskListResponse,
  UpdateTaskInput,
} from "../types/task";
import type { ApiSuccess } from "../types/api";

export async function listTasks(params: ListTasksParams): Promise<TaskListResponse> {
  const { data } = await api.get<ApiSuccess<TaskListResponse>>("/tasks", { params });
  return data.data;
}

export async function createTask(input: CreateTaskInput): Promise<Task> {
  const { data } = await api.post<ApiSuccess<Task>>("/tasks", input);
  return data.data;
}

export async function updateTask(id: string, input: UpdateTaskInput): Promise<Task> {
  const { data } = await api.patch<ApiSuccess<Task>>(`/tasks/${id}`, input);
  return data.data;
}

export async function deleteTask(id: string): Promise<void> {
  await api.delete(`/tasks/${id}`);
}

export async function bulkUpdateTasks(ids: string[], set: BulkUpdateSet): Promise<BulkUpdateResponse> {
  const { data } = await api.patch<ApiSuccess<BulkUpdateResponse>>("/tasks/bulk", { ids, set });
  return data.data;
}
