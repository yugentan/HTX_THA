import { TaskStatus } from "./task.types";

export type Skill = {
  id: string;
  name: string;
  developers: { id: string; name: string }[];
  tasks: {
    id: string;
    title: string;
    status: TaskStatus;
    ordering: number;
    parent_id: string | null;
  }[];
};
