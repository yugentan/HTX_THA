import { useEffect, useState } from "react";
import TaskTreeFields from "./TaskTreeFields";
import {
  TaskTree,
  newTree,
  removeTree,
  updateTree,
} from "../types/tree.types";
import { Reference, TaskStatus } from "../types/task.types";
import { createTask } from "../api/task.api";
import { fetchSkills } from "../api/skill.api";
import { getApiErrorMessage } from "../api/error";

type CreateTaskComponentProps = {
  onClose: () => void;
  onCreated: () => void;
  // ordering for the root task so it lands after the existing top level ones
  rootOrdering: number;
};

const hasEmptyTitle = (node: TaskTree): boolean =>
  node.title.trim() === "" || node.children.some(hasEmptyTitle);

const CreateTaskComponent = ({
  onClose,
  onCreated,
  rootOrdering,
}: CreateTaskComponentProps) => {
  const [root, setRoot] = useState<TaskTree>(newTree());
  const [skills, setSkills] = useState<Reference[]>([]);
  const [saving, setSaving] = useState<boolean>(false);

  // the form works in skill names, the API wants skill ids
  useEffect(() => {

    fetchSkills()
      .then((data) => {
        setSkills(data);
      })
      .catch((err) => {
        alert(getApiErrorMessage(err));
      })

  }, []);

  const handleChange = (key: string, change: (found: TaskTree) => TaskTree) => {
    setRoot((current) => updateTree(current, key, change));
  };

  const handleAddSubtask = (key: string) => {
    setRoot((current) =>
      updateTree(current, key, (found) => ({
        ...found,
        children: [...found.children, newTree()],
      }))
    );
  };

  const handleRemove = (key: string) => {
    setRoot((current) => removeTree(current, key));
  };

  const handleReset = () => {
    setRoot(newTree());
  };

  const skillIds = (names: string[]): string[] =>
    names
      .map((name) => skills.find((skill) => skill.name === name)?.id)
      .filter((id): id is string => Boolean(id));

  // creates the node, then its children with the new row's id as their
  // parent_id. siblings are ordered from 0, so the tree comes back as
  // 1, 1.1, 1.1.1, 1.2 in the order it was built here
  const createBranch = async (
    node: TaskTree,
    parentId: string | null,
    ordering: number
  ) => {
    const chosen = skillIds(node.skills);

    const created = await createTask({
      title: node.title.trim(),
      status: TaskStatus.ToDo,
      ordering,
      parent_id: parentId,
      skill_ids: chosen,
      infer_skills: chosen.length === 0,
    });

    for (let index = 0; index < node.children.length; index += 1) {
      await createBranch(node.children[index], created.id, index);
    }
  };

  const handleSave = async () => {
    setSaving(true);

    try {
      await createBranch(root, null, rootOrdering);
      onCreated();
      onClose();
    } catch (err) {
      alert(getApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const canSave = !hasEmptyTitle(root) && !saving;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
      <div className="relative flex max-h-[90vh] w-full max-w-2xl flex-col rounded-lg bg-white shadow-xl">
        <div className="border-b border-slate-500 p-6">
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="absolute left-3 top-3 rounded-sm px-2 py-1 text-lg leading-none text-slate-500 hover:bg-slate-100 hover:text-slate-900"
          >
            x
          </button>

          <h2 className="mt-6 text-lg font-semibold text-slate-900 ">
            Create Task
          </h2>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <TaskTreeFields
            Tree={root}
            path={[0]}
            onChange={handleChange}
            onAddSubtask={handleAddSubtask}
            onRemove={handleRemove}
          />
        </div>


          <div className="flex justify-end items-center gap-2 p-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 "
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              Reset
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={!canSave}
              className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
      </div>
    </div>
  );
};

export default CreateTaskComponent;
