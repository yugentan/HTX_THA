// Mirrors the shape returned by the backend at GET /api/v1/developers

import { Reference, TaskSummary } from "./task.types";

export type Developer = {
  id: string;
  name: string;
  skills: Reference[];
  tasks: TaskSummary[];
};
