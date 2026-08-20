import pool, { query } from "../db/pool";
import {
  CreateTaskInput,
  Task,
  TaskStatus,
  UpdateTaskInput,
} from "../types/task.types";

// Shared projection: a task plus its skills, assignee name and direct subtasks.
const TASK_SELECT = `
  SELECT t.id,
         t.title,
         t.status,
         t.ordering,
         t.parent_id,
         t.assigned_to,
         d.name AS assignee,
         COALESCE(
           (SELECT json_agg(json_build_object('id', s.id, 'name', s.name)
                     ORDER BY s.name)
              FROM task_skill ts
              JOIN skills s ON s.id = ts.skill_id
             WHERE ts.task_id = t.id),
           '[]'::json
         ) AS skills,
         COALESCE(
           (SELECT json_agg(json_build_object(
                     'id', c.id, 'title', c.title,
                     'status', c.status, 'ordering', c.ordering)
                     ORDER BY c.ordering)
              FROM tasks c
             WHERE c.parent_id = t.id),
           '[]'::json
         ) AS subtasks
    FROM tasks t
    LEFT JOIN developers d ON d.id = t.assigned_to
`;

export const findAllTasks = async (): Promise<Task[]> => {
  const { rows } = await query<Task>(`${TASK_SELECT} ORDER BY t.ordering`);
  return rows;
};

export const findTaskById = async (id: string): Promise<Task | null> => {
  const { rows } = await query<Task>(`${TASK_SELECT} WHERE t.id = $1`, [id]);
  return rows[0] ?? null;
};

/**
 * Skills the task requires that the developer does not have.
 * An empty array means the developer is allowed to take the task.
 */
export const findMissingSkills = async (
  taskId: string,
  developerId: string
): Promise<string[]> => {
  const { rows } = await query<{ name: string }>(
    `SELECT s.name
       FROM task_skill ts
       JOIN skills s ON s.id = ts.skill_id
      WHERE ts.task_id = $1
        AND NOT EXISTS (
          SELECT 1 FROM developer_skill ds
           WHERE ds.developer_id = $2
             AND ds.skill_id = ts.skill_id
        )
      ORDER BY s.name`,
    [taskId, developerId]
  );

  return rows.map((row) => row.name);
};

/**
 * Titles of every subtask below this task, at any depth, that is not done.
 * An empty array means the task itself is allowed to move to done.
 *
 * The walk goes all the way down rather than checking direct children only:
 * a child marked done before a new subtask was added under it would otherwise
 * let an unfinished branch slip through.
 */
/**
 * Reopens any ancestor still marked done after a subtask moves away from done.
 *
 * Without this the tree can end up inconsistent: the "all subtasks done" rule
 * is only checked when a task moves TO done, so reopening a child would
 * otherwise leave its parent sitting at done over unfinished work.
 *
 * Returns the titles of the tasks that were reopened.
 */
export const reopenDoneAncestors = async (taskId: string): Promise<string[]> => {
  const { rows } = await query<{ title: string }>(
    `WITH RECURSIVE ancestors AS (
       SELECT parent_id AS id
         FROM tasks
        WHERE id = $1 AND parent_id IS NOT NULL
       UNION ALL
       SELECT child.parent_id
         FROM tasks child
         JOIN ancestors a ON child.id = a.id
        WHERE child.parent_id IS NOT NULL
     )
     UPDATE tasks
        SET status = $2
      WHERE id IN (SELECT id FROM ancestors)
        AND status = $3
     RETURNING title`,
    [taskId, TaskStatus.Doing, TaskStatus.Done]
  );

  return rows.map((row) => row.title);
};

export const findIncompleteSubtasks = async (
  taskId: string
): Promise<string[]> => {
  const { rows } = await query<{ title: string }>(
    `WITH RECURSIVE descendants AS (
       SELECT id, title, status
         FROM tasks
        WHERE parent_id = $1
       UNION ALL
       SELECT child.id, child.title, child.status
         FROM tasks child
         JOIN descendants parent ON child.parent_id = parent.id
     )
     SELECT title
       FROM descendants
      WHERE status <> $2
      ORDER BY title`,
    [taskId, TaskStatus.Done]
  );

  return rows.map((row) => row.title);
};

/** Same check for a set of skills not yet persisted (used on create). */
export const findMissingSkillsForSkillIds = async (
  skillIds: string[],
  developerId: string
): Promise<string[]> => {
  if (skillIds.length === 0) return [];

  const { rows } = await query<{ name: string }>(
    `SELECT s.name
       FROM skills s
      WHERE s.id = ANY($1::uuid[])
        AND NOT EXISTS (
          SELECT 1 FROM developer_skill ds
           WHERE ds.developer_id = $2
             AND ds.skill_id = s.id
        )
      ORDER BY s.name`,
    [skillIds, developerId]
  );

  return rows.map((row) => row.name);
};

/** Skill ids that do not exist in the skills table. */
export const findUnknownSkillIds = async ( skillIds: string[]): Promise<string[]> => {
  if (skillIds.length === 0) return [];

  const { rows } = await query<{ id: string }>(
    `SELECT id
       FROM unnest($1::uuid[]) AS id
      WHERE id NOT IN (SELECT id FROM skills)`,
    [skillIds]
  );

  return rows.map((row) => row.id);
};

export const taskExists = async (id: string): Promise<boolean> => {
  const { rowCount } = await query(`SELECT 1 FROM tasks WHERE id = $1`, [id]);
  return rowCount === 1;
};

export const createTask = async (input: CreateTaskInput): Promise<Task> => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const { rows } = await client.query<{ id: string }>(
      `INSERT INTO tasks (title, status, ordering, parent_id, assigned_to)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id`,
      [
        input.title,
        input.status ?? TaskStatus.ToDo,
        input.ordering ?? 0,
        input.parent_id ?? null,
        input.assigned_to ?? null,
      ]
    );

    const id = rows[0].id;

    if (input.skill_ids?.length) {
      await client.query(
        `INSERT INTO task_skill (task_id, skill_id)
         SELECT $1, unnest($2::uuid[])`,
        [id, input.skill_ids]
      );
    }

    await client.query("COMMIT");

    return (await findTaskById(id)) as Task;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
};

export const updateTask = async (
  id: string,
  input: UpdateTaskInput
): Promise<Task | null> => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const fields: string[] = [];
    const values: unknown[] = [];

    const set = (column: string, value: unknown) => {
      values.push(value);
      fields.push(`${column} = $${values.length}`);
    };

    if (input.title !== undefined) set("title", input.title);
    if (input.status !== undefined) set("status", input.status);
    if (input.ordering !== undefined) set("ordering", input.ordering);
    if (input.parent_id !== undefined) set("parent_id", input.parent_id);
    if (input.assigned_to !== undefined) set("assigned_to", input.assigned_to);

    if (fields.length > 0) {
      values.push(id);
      const { rowCount } = await client.query(
        `UPDATE tasks SET ${fields.join(", ")} WHERE id = $${values.length}`,
        values
      );

      if (rowCount === 0) {
        await client.query("ROLLBACK");
        return null;
      }
    }

    if (input.skill_ids !== undefined) {
      await client.query(`DELETE FROM task_skill WHERE task_id = $1`, [id]);

      if (input.skill_ids.length > 0) {
        await client.query(
          `INSERT INTO task_skill (task_id, skill_id)
           SELECT $1, unnest($2::uuid[])`,
          [id, input.skill_ids]
        );
      }
    }

    await client.query("COMMIT");

    return findTaskById(id);
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
};
