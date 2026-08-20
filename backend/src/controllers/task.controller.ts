import { Request, Response } from "express";
import {
  createTask,
  findAllTasks,
  findMissingSkills,
  findMissingSkillsForSkillIds,
  findIncompleteSubtasks,
  findTaskById,
  findUnknownSkillIds,
  reopenDoneAncestors,
  taskExists,
  updateTask,
} from "../repositories/task.repository";
import {
  CreateTaskInput,
  TASK_STATUSES,
  TaskStatus,
  UpdateTaskInput,
  isTaskStatus,
} from "../types/task.types";
import { developerExists } from "../repositories/developer.repository";
import { isUuid } from "../utils/uuid";

export const getTasks = async (_req: Request, res: Response) => {
  try {
    res.status(200).json(await findAllTasks());
  } catch (err) {
    console.error("Failed to fetch tasks", err);
    res.status(500).json({ error: "Failed to fetch tasks" });
  }
};

export const getTaskById = async (req: Request, res: Response) => {
  const { id } = req.params;

  if (!isUuid(id)) {
    return res.status(400).json({ error: "id must be a UUID" });
  }

  try {
    const task = await findTaskById(id);

    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }

    res.status(200).json(task);
  } catch (err) {
    console.error("Failed to fetch task", err);
    res.status(500).json({ error: "Failed to fetch task" });
  }
};

export const postTask = async (req: Request, res: Response) => {
  const { title, status, ordering, parent_id, assigned_to, skill_ids } =
    req.body ?? {};

  if (typeof title !== "string" || title.trim() === "") {
    return res.status(400).json({ error: "title is required" });
  }

  if (status !== undefined && !isTaskStatus(status)) {
    return res
      .status(400)
      .json({ error: `status must be one of: ${TASK_STATUSES.join(", ")}` });
  }

  if (ordering !== undefined && !Number.isInteger(ordering)) {
    return res.status(400).json({ error: "ordering must be an integer" });
  }

  if (parent_id !== undefined && parent_id !== null && !isUuid(parent_id)) {
    return res.status(400).json({ error: "parent_id must be a UUID or null" });
  }

  if (assigned_to !== undefined && assigned_to !== null && !isUuid(assigned_to)) {
    return res.status(400).json({ error: "assigned_to must be a UUID or null" });
  }

  if (
    skill_ids !== undefined &&
    (!Array.isArray(skill_ids) || !skill_ids.every(isUuid))
  ) {
    return res.status(400).json({ error: "skill_ids must be an array of UUIDs" });
  }

  try {
    // referenced rows must exist, otherwise the insert fails as a 500
    if (skill_ids?.length) {
      const unknown = await findUnknownSkillIds(skill_ids);

      if (unknown.length > 0) {
        return res
          .status(400)
          .json({ error: "unknown skill_ids", unknown_skill_ids: unknown });
      }
    }

    if (parent_id && !(await taskExists(parent_id))) {
      return res.status(400).json({ error: "parent task not found" });
    }
    // developer must hold every required skill
    if (assigned_to) {
      if (!(await developerExists(assigned_to))) {
        return res.status(400).json({ error: "assigned developer not found" });
      }

      const missing = await findMissingSkillsForSkillIds(
        skill_ids ?? [],
        assigned_to
      );

      if (missing.length > 0) {
        return res.status(409).json({
          error: "Developer is missing skills required by this task",
          missing_skills: missing,
        });
      }
    }

    const input: CreateTaskInput = {
      title,
      status,
      ordering,
      parent_id,
      assigned_to,
      skill_ids,
    };

    res.status(201).json(await createTask(input));
  } catch (err) {
    console.error("Failed to create task", err);
    res.status(500).json({ error: "Failed to create task" });
  }
};

export const patchTask = async (req: Request, res: Response) => {
  const { id } = req.params;

  if (!isUuid(id)) {
    return res.status(400).json({ error: "id must be a UUID" });
  }

  const { title, status, ordering, parent_id, assigned_to, skill_ids } =
    req.body ?? {};

  if (title !== undefined && (typeof title !== "string" || title.trim() === "")) {
    return res.status(400).json({ error: "title must be a non-empty string" });
  }

  if (status !== undefined && !isTaskStatus(status)) {
    return res
      .status(400)
      .json({ error: `status must be one of: ${TASK_STATUSES.join(", ")}` });
  }

  if (ordering !== undefined && !Number.isInteger(ordering)) {
    return res.status(400).json({ error: "ordering must be an integer" });
  }

  if (parent_id !== undefined && parent_id !== null && !isUuid(parent_id)) {
    return res.status(400).json({ error: "parent_id must be a UUID or null" });
  }

  if (parent_id === id) {
    return res.status(400).json({ error: "a task cannot be its own parent" });
  }

  if (assigned_to !== undefined && assigned_to !== null && !isUuid(assigned_to)) {
    return res.status(400).json({ error: "assigned_to must be a UUID or null" });
  }

  if (
    skill_ids !== undefined &&
    (!Array.isArray(skill_ids) || !skill_ids.every(isUuid))
  ) {
    return res.status(400).json({ error: "skill_ids must be an array of UUIDs" });
  }

  try {
    const existing = await findTaskById(id);

    if (!existing) {
      return res.status(404).json({ error: "Task not found" });
    }

    // a task may only be marked done once every subtask below it is done
    if (status === TaskStatus.Done) {
      const incomplete = await findIncompleteSubtasks(id);

      if (incomplete.length > 0) {
        return res.status(409).json({
          error: "Task cannot be done while subtasks are unfinished",
          incomplete_subtasks: incomplete,
        });
      }
    }

    // referenced rows must exist, otherwise the insert fails as a 500
    if (skill_ids?.length) {
      const unknown = await findUnknownSkillIds(skill_ids);

      if (unknown.length > 0) {
        return res
          .status(400)
          .json({ error: "unknown skill_ids", unknown_skill_ids: unknown });
      }
    }

    if (parent_id && !(await taskExists(parent_id))) {
      return res.status(400).json({ error: "parent task not found" });
    }
    // a task may only be assigned to a developer holding every required skill
    if (assigned_to) {
      if (!(await developerExists(assigned_to))) {
        return res.status(400).json({ error: "assigned developer not found" });
      }

      const missing =
        skill_ids !== undefined
          ? await findMissingSkillsForSkillIds(skill_ids, assigned_to)
          : await findMissingSkills(id, assigned_to);

      if (missing.length > 0) {
        return res.status(409).json({
          error: "Developer is missing skills required by this task",
          missing_skills: missing,
        });
      }
    }

    const input: UpdateTaskInput = {
      title,
      status,
      ordering,
      parent_id,
      assigned_to,
      skill_ids,
    };

    const updated = await updateTask(id, input);

    // moving away from done can leave an ancestor stranded at done, so reopen it
    if (status !== undefined && status !== TaskStatus.Done) {
      const reopened = await reopenDoneAncestors(id);

      if (reopened.length > 0) {
        console.log(
          `reopened ${reopened.join(", ")} because a subtask left done`
        );
      }
    }

    res.status(200).json(updated);
  } catch (err) {
    console.error("Failed to update task", err);
    res.status(500).json({ error: "Failed to update task" });
  }
};
