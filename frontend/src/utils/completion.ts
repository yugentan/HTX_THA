import { Task, TaskStatus } from "../types/task.types";

// Checking all subtask if any is in done state before self can be done 
export const incompleteSubtasks = (tasks: Task[], taskId: string): string[] => {
  const blocking: string[] = [];
  const seen = new Set<string>();

  const walk = (parentId: string) => {
    tasks
      .filter((task) => task.parent_id === parentId)
      .forEach((child) => {
        // guards against a cycle in parent_id turning this into a hang
        if (seen.has(child.id)) return;
        seen.add(child.id);

        if (child.status !== TaskStatus.Done) {
          blocking.push(child.title);
        }

        walk(child.id);
      });
  };

  walk(taskId);

  return blocking;
};

export const canBeDone = (tasks: Task[], taskId: string): boolean =>
  incompleteSubtasks(tasks, taskId).length === 0;
