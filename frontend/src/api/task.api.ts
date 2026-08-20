import client from "./client";
import { Task, TaskStatus } from "../types/task.types";

export type UpdateTaskInput = {
  title?: string;
  status?: TaskStatus;
  ordering?: number;
  parent_id?: string | null;
  assigned_to?: string | null;
  skill_ids?: string[];
};

export type CreateTaskInput = {
  /** ask the backend to infer skills from the title */
  infer_skills?: boolean;
  title: string;
  status?: TaskStatus;
  ordering?: number;
  parent_id?: string | null;
  assigned_to?: string | null;
  skill_ids?: string[];
};

export const fetchTasks = async (): Promise<Task[]> => {
  const response = await client.get<Task[]>("/api/v1/tasks");
  return response.data;
};

export const createTask = async (input: CreateTaskInput): Promise<Task> => {
  const response = await client.post<Task>("/api/v1/tasks", input);
  return response.data;
};

export const updateTask = async (
  id: string,
  input: UpdateTaskInput
): Promise<Task> => {
  const response = await client.patch<Task>(`/api/v1/tasks/${id}`, input);
  return response.data;
};
