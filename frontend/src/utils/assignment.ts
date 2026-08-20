import { Developer } from "../types/developer.types";
import { Task } from "../types/task.types";

// task can only be assigned to a dev if they hold every skill the task requires. also enforce by backend PATCH /api/v1/tasks/:id.

export const canBeAssigned = (developer: Developer, task: Task): boolean =>
  task.skills.every((required) =>
    developer.skills.some((held) => held.id === required.id)
  );

export const eligibleDevelopers = (
  developers: Developer[],
  task: Task
): Developer[] =>
  developers.filter((developer) => canBeAssigned(developer, task));
