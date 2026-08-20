import { SKILL_OPTIONS, TaskTree, TreeLabel } from "../types/tree.types";

type TaskTreeFieldsProps = {
  Tree: TaskTree;
  path: number[];
  onChange: (key: string, change: (found: TaskTree) => TaskTree) => void;
  onAddSubtask: (key: string) => void;
  onRemove: (key: string) => void;
};

const TaskTreeFields = ({
  Tree,
  path,
  onChange,
  onAddSubtask,
  onRemove,
}: TaskTreeFieldsProps) => {
  const isRoot = path.length === 1;
  const label = isRoot ? `New Task Component ${TreeLabel(path)}` : `Subtask Component ${TreeLabel(path)}`;

  const toggleSkill = (skill: string) => {
    onChange(Tree.key, (found) => ({
      ...found,
      skills: found.skills.includes(skill)
        ? found.skills.filter((item) => item !== skill)
        : [...found.skills, skill],
    }));
  };

  return (
    <div className="rounded-md  border-slate-300 p-4">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs font-semibold tracking-widest text-slate-500">
          {label}
        </span>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onAddSubtask(Tree.key)}
            className="rounded-md border border-slate-300 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100"
          >
            Add Subtask
          </button>

          {!isRoot && (
            <button
              type="button"
              onClick={() => onRemove(Tree.key)}
              className="rounded-md px-2.5 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
            >
              Remove
            </button>
          )}
        </div>
      </div>

      <label className="mb-1 block text-sm font-medium text-slate-700">
        Title <span className="text-red-600">*</span>
      </label>
      <input
        type="text"
        value={Tree.title}
        onChange={(event) =>
          onChange(Tree.key, (found) => ({
            ...found,
            title: event.target.value,
          }))
        }
        placeholder="Enter a title"
        className="mb-3 w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-500 focus:outline-none"
      />

      <span className="mb-1 block text-sm font-medium text-slate-700">
        Required skills
      </span>
      <div className="flex flex-wrap gap-2">
        {SKILL_OPTIONS.map((skill) => (
          <label
            key={skill}
            className="flex cursor-pointer items-center gap-2 rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
          >
            <input
              type="checkbox"
              checked={Tree.skills.includes(skill)}
              onChange={() => toggleSkill(skill)}
            />
            {skill}
          </label>
        ))}
      </div>

      {Tree.skills.length === 0 && (
        <p className="mt-2 text-xs text-slate-500">
          No skills selected; this task can be identified with LLM on the backend.
        </p>
      )}

      {Tree.children.length > 0 && (
        <div className="mt-4 space-y-3 border-l-2 border-slate-200 pl-4">
          {Tree.children.map((child, index) => (
            <TaskTreeFields
              key={child.key}
              Tree={child}
              path={[...path, index]}
              onChange={onChange}
              onAddSubtask={onAddSubtask}
              onRemove={onRemove}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default TaskTreeFields;
