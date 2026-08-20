import { query } from "../db/pool";
import { Developer } from "../types/developer.types";

// Shared projection: a developer plus their skills and assigned tasks.
const DEVELOPER_SELECT = `
  SELECT d.id,
         d.name,
         COALESCE(
           (SELECT json_agg(json_build_object('id', s.id, 'name', s.name)
                     ORDER BY s.name)
              FROM developer_skill ds
              JOIN skills s ON s.id = ds.skill_id
             WHERE ds.developer_id = d.id),
           '[]'::json
         ) AS skills,
         COALESCE(
           (SELECT json_agg(json_build_object(
                     'id', t.id, 'title', t.title, 'status', t.status,
                     'ordering', t.ordering, 'parent_id', t.parent_id)
                     ORDER BY t.ordering)
              FROM tasks t
             WHERE t.assigned_to = d.id),
           '[]'::json
         ) AS tasks
    FROM developers d
`;

export const findAllDevelopers = async (): Promise<Developer[]> => {
  const { rows } = await query<Developer>(`${DEVELOPER_SELECT} ORDER BY d.name`);
  return rows;
};

export const findDeveloperById = async (
  id: string
): Promise<Developer | null> => {
  const { rows } = await query<Developer>(`${DEVELOPER_SELECT} WHERE d.id = $1`, [
    id,
  ]);
  return rows[0] ?? null;
};

export const developerExists = async (id: string): Promise<boolean> => {
  const { rowCount } = await query(`SELECT 1 FROM developers WHERE id = $1`, [id]);
  return rowCount === 1;
};
