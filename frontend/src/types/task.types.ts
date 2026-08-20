export enum TaskStatus {
  ToDo = "to_do",
  Doing = "doing",
  Done = "done",
}
// Mapping the above to below
export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  [TaskStatus.ToDo]: "To do",
  [TaskStatus.Doing]: "Doing",
  [TaskStatus.Done]: "Done",
};

// Template doc e.g. a skill or a developer
export type Reference = {
  id: string;
  name: string;
};

//A task as it appears nested inside another task
export type TaskSummary = {
  id: string;
  title: string;
  status: TaskStatus;
  ordering: number;
  parent_id: string | null;
};

export type Task = {
  id: string;
  title: string;
  status: TaskStatus;
  ordering: number;
  parent_id: string | null; //null means the task is top level rather than a subtask 
  assigned_to: string | null;
  assignee: string | null;
  skills: Reference[];
  subtasks: TaskSummary[];
};
