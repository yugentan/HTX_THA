import { TaskStatus } from "./task.types";

export type Developer = {
  id: string;
  name: string;
  skills: { id: string; name: string }[];
  tasks: {
    id: string;
    title: string;
    status: TaskStatus;
    ordering: number;
    parent_id: string | null;
  }[];
};
