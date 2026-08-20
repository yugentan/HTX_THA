import { TASK_STATUS_LABELS, Task, TaskStatus } from "../types/task.types";
import { Developer } from "../types/developer.types";
import { eligibleDevelopers } from "../utils/assignment";
import { buildTaskRows } from "../utils/taskRows";
import { incompleteSubtasks } from "../utils/completion";

type TaskListComponentProps = {
  tasks: Task[];
  developers: Developer[];
  onStatusChange: (taskId: string, status: TaskStatus) => void;
  onAssigneeChange: (taskId: string, developerId: string | null) => void;
};

// written out in full so tailwind can see each class at build time
const INDENT = ["pl-4", "pl-10", "pl-16", "pl-22", "pl-28"];

const TaskListComponent = ({tasks,developers,onStatusChange,onAssigneeChange}: TaskListComponentProps) => {

  if (tasks.length === 0) {
    return <p className="text-sm text-slate-500">No tasks yet.</p>;
  }

  // subtasks are nested under their parent instead of following the flat order
  const rows = buildTaskRows(tasks);

  return (
    <div className="overflow-x-auto rounded-sm ring-1 ">
      <table className="min-w-full divide-y divide-slate-500 text-left text-sm">
        {/* TABLE HEADER */}
        <thead className="bg-slate-50">
          <tr>
            <th className="px-4 py-4 bold">Title</th>
            <th className="px-4 py-4 bold">Skills</th>
            <th className="px-4 py-4 bold">Status</th>
            <th className="px-4 py-4 bold">Assignee</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-300 bg-white">
          {rows.map(({ task, depth, label }) => {
            // only developers holding every required skill may take the task
            const candidates = eligibleDevelopers(developers, task);
            // a task can only be done once everything under it is done
            const blocking = incompleteSubtasks(tasks, task.id);

            return (
              <tr
                key={task.id}
                className={depth === 0 ? "hover:bg-slate-50" : "bg-slate-50/50 hover:bg-slate-100"}
              >
                {/* TITLE COLUMN */}
                <td
                  className={`${INDENT[Math.min(depth, INDENT.length - 1)]} py-3 pr-4 font-medium text-slate-900`}
                >
                  <span className="mr-2 text-s font-bold">
                    {label}
                  </span>
                  {task.title}
                </td>
                {/* SKILLS COLUMN */}
                <td className="p-4 text-slate-700">
                  {task.skills.map((skill) => skill.name).join(", ")}
                </td>
                {/* STATUS COLUMN */}
                <td className="p-4">
                  <select
                    className="rounded-sm border-0 bg-white p-1.5 pl-2 pr-8 text-sm ring-1 ring-inset focus:ring-2"
                    value={task.status}
                    onChange={(event) =>
                      onStatusChange(task.id, event.target.value as TaskStatus)
                    }
                  >
                    {Object.entries(TASK_STATUS_LABELS).map(
                      ([status, label]) => (
                        <option
                          key={status}
                          value={status}
                          disabled={
                            status === TaskStatus.Done && blocking.length > 0
                          }
                        >
                          {label}
                        </option>
                      )
                    )}
                  </select>
                </td>
                {/* ASSIGNMENT COLUMNM */}
                <td className="p-4">
                  <select
                    className="rounded-sm border-0 bg-white p-1.5 pl-2 pr-8 text-sm ring-1 ring-inset focus:ring-2"
                    value={task.assigned_to ?? ""}
                    onChange={(event) =>
                      onAssigneeChange(task.id, event.target.value || null)
                    }
                  >
                    <option value="">Unassigned</option>
                    {candidates.map((developer) => (
                      <option key={developer.id} value={developer.id}>
                        {developer.name}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default TaskListComponent;
