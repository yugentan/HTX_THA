import { query } from "../db/pool";
import { Skill } from "../types/skill.types";

// Shared projection: a skill plus the developers who hold it and the tasks
// that require it.
const SKILL_SELECT = `
  SELECT s.id,
         s.name,
         COALESCE(
           (SELECT json_agg(json_build_object('id', d.id, 'name', d.name)
                     ORDER BY d.name)
              FROM developer_skill ds
              JOIN developers d ON d.id = ds.developer_id
             WHERE ds.skill_id = s.id),
           '[]'::json
         ) AS developers,
         COALESCE(
           (SELECT json_agg(json_build_object(
                     'id', t.id, 'title', t.title, 'status', t.status,
                     'ordering', t.ordering, 'parent_id', t.parent_id)
                     ORDER BY t.ordering)
              FROM task_skill ts
              JOIN tasks t ON t.id = ts.task_id
             WHERE ts.skill_id = s.id),
           '[]'::json
         ) AS tasks
    FROM skills s
`;

export const findAllSkills = async (): Promise<Skill[]> => {
  const { rows } = await query<Skill>(`${SKILL_SELECT} ORDER BY s.name`);
  return rows;
};

export const findSkillById = async (id: string): Promise<Skill | null> => {
  const { rows } = await query<Skill>(`${SKILL_SELECT} WHERE s.id = $1`, [id]);
  return rows[0] ?? null;
};

/** id + name only, for mapping inferred skill names back to rows. */
export const findSkillRefs = async (): Promise<{ id: string; name: string }[]> => {
  const { rows } = await query<{ id: string; name: string }>(
    `SELECT id, name FROM skills ORDER BY name`
  );
  return rows;
};
