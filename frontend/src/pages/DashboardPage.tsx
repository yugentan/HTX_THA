import { useEffect, useState } from "react";
import TaskListComponent from "../components/TaskListComponent";
import CreateTaskComponent from "../components/CreateTaskComponent";
import { Task, TaskStatus } from "../types/task.types";
import { Developer } from "../types/developer.types";
import { fetchTasks, updateTask, UpdateTaskInput } from "../api/task.api";
import { fetchDevelopers } from "../api/developer.api";
import { getApiErrorMessage } from "../api/error";

const DashboardPage = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [developers, setDevelopers] = useState<Developer[]>([]);
  const [showCreateTask, setShowCreateTask] = useState<boolean>(false);

  const reloadTasks = () => {
    fetchTasks()
      .then((data) => {
        setTasks(data);
      })
      .catch((err) => {
        alert(err.message);
      })
  };

  useEffect(() => {

    reloadTasks();

  }, []);

  useEffect(() => {

    fetchDevelopers()
      .then((data) => {
        setDevelopers(data);
      })
      .catch((err) => {
        alert(err.message);
      })

  }, []);

  const handleShowCreateTask = () => {
    setShowCreateTask(true);
  };
  // Setting on select changes but reverts when it dont go true
  const patchTask = async (
    taskId: string,
    input: UpdateTaskInput,
    optimistic: (task: Task) => Task
  ) => {
    const previous = tasks;

    setTasks((current) =>
      current.map((task) => (task.id === taskId ? optimistic(task) : task))
    );

    try {
      const updated = await updateTask(taskId, input);
      setTasks((current) =>
        current.map((task) => (task.id === taskId ? updated : task))
      );

      // a status change can reopen done ancestors on the server, and those
      // rows are not in the response, so pull the list again
      if (input.status !== undefined) {
        reloadTasks();
      }
    } catch (err) {
      setTasks(previous);
      alert(getApiErrorMessage(err));
    }
  };

  const handleStatusChange = (taskId: string, status: TaskStatus) => {
    patchTask(taskId, { status }, (task) => ({ ...task, status }));
  };

  const handleAssigneeChange = (taskId: string, developerId: string | null) => {
    const developer = developers.find((item) => item.id === developerId);

    patchTask(taskId, { assigned_to: developerId }, (task) => ({
      ...task,
      assigned_to: developerId,
      assignee: developer?.name ?? null,
    }));
  };

  return (
    <div className="min-h-screen bg-slate-50 px-6 py-10">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-slate-900">Tasks</h1>
          <button
            onClick={handleShowCreateTask}
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
          >
            Create Task
          </button>
        </div>

        <TaskListComponent
          tasks={tasks}
          developers={developers}
          onStatusChange={handleStatusChange}
          onAssigneeChange={handleAssigneeChange}
        />

        {showCreateTask ? (
          <CreateTaskComponent
            onClose={() => setShowCreateTask(false)}
            onCreated={reloadTasks}
            rootOrdering={tasks.filter((task) => task.parent_id === null).length}
          />
        ) : (
          <></>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;
