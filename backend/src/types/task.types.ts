export enum TaskStatus {
  ToDo = "to_do",
  Doing = "doing",
  Done = "done",
}

export const TASK_STATUSES = Object.values(TaskStatus);

export const isTaskStatus = (value: unknown): value is TaskStatus =>
  typeof value === "string" && TASK_STATUSES.includes(value as TaskStatus);

export type Task = {
  id: string;
  title: string;
  status: TaskStatus;
  ordering: number;
  parent_id: string | null;
  assigned_to: string | null;
  assignee: string | null;
  skills: { id: string; name: string }[];
  subtasks: { id: string; title: string; status: TaskStatus; ordering: number }[];
};

export type CreateTaskInput = {
  title: string;
  status?: TaskStatus;
  ordering?: number;
  parent_id?: string | null;
  assigned_to?: string | null;
  skill_ids?: string[];
};

export type UpdateTaskInput = {
  title?: string;
  status?: TaskStatus;
  ordering?: number;
  parent_id?: string | null;
  assigned_to?: string | null;
  skill_ids?: string[];
};
