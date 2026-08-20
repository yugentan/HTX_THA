import { Task } from "../types/task.types";

export type TaskRow = {
  task: Task;
  depth: number; // 0 index, 0 for root 
  label: string; // 0 index + 1 for labeling purpse
};

// Flattening the tree p
//                     p
//                     p -> s                        
export const buildTaskRows = (tasks: Task[]): TaskRow[] => {
  const byParent = new Map<string | null, Task[]>();

  tasks.forEach((task) => {
    const siblings = byParent.get(task.parent_id) ?? [];
    siblings.push(task);
    byParent.set(task.parent_id, siblings);
  });

  byParent.forEach((siblings) => {
    siblings.sort((a, b) => a.ordering - b.ordering);
  });

  const rows: TaskRow[] = [];
  const seen = new Set<string>();

  const walk = (parentId: string | null, depth: number, prefix: number[]) => {
    (byParent.get(parentId) ?? []).forEach((task, index) => {
      // guards against a cycle in parent_id turning this into a hang
      if (seen.has(task.id)) return;
      seen.add(task.id);

      const path = [...prefix, index];
      rows.push({
        task,
        depth,
        label: path.map((position) => position + 1).join("."),
      });

      walk(task.id, depth + 1, path);
    });
  };

  walk(null, 0, []);

  // any task whose parent is missing from the list still gets rendered
  tasks.forEach((task) => {
    if (!seen.has(task.id)) {
      seen.add(task.id);
      rows.push({ task, depth: 0, label: "" });
    }
  });

  return rows;
};
