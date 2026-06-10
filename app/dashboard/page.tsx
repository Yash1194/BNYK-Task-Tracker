"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";

export default function Dashboard() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("Newest");
  const [filter, setFilter] = useState("All");

  // State to track the task being edited
  const [editingTask, setEditingTask] = useState<any>(null);

  const [formData, setFormData] = useState({
    taskName: "",
    email: "",
    dueDate: "",
    description: "",
    notionLink: "",
  });
  // Function to update the task
  const updateTask = async () => {
    await fetch(`/api/tasks/${editingTask._id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(formData),
    });

    setTasks(
      tasks.map((task) =>
        task._id === editingTask._id ? { ...task, ...formData } : task,
      ),
    );

    setEditingTask(null);
    toast.success("Task Updated");
  };

  useEffect(() => {
    fetch("/api/tasks")
      .then((res) => res.json())
      .then((data) => setTasks(data));
  }, []);
  // Function to delete a task
  const deleteTask = async (id: string) => {
    const ok = confirm("Are you sure you want to delete this task?");

    if (!ok) return;

    await fetch(`/api/tasks/${id}`, {
      method: "DELETE",
    });

    setTasks(tasks.filter((task) => task._id !== id));
    toast.success("Task Deleted");
  };
  // Function to mark a task as completed
  const completeTask = async (id: string) => {
    await fetch(`/api/tasks/${id}`, {
      method: "PATCH",
    });

    setTasks(
      tasks.map((task) =>
        task._id === id ? { ...task, status: "Completed" } : task,
      ),
    );
    toast.success("Task Completed");
  };

  const filteredTasks = tasks.filter((task) => {
    const matchesSearch =
      task.taskName?.toLowerCase().includes(search.toLowerCase()) ||
      task.email?.toLowerCase().includes(search.toLowerCase());

    if (filter === "Pending") {
      return matchesSearch && task.status !== "Completed";
    }

    if (filter === "Completed") {
      return matchesSearch && task.status === "Completed";
    }

    return matchesSearch;
  });
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    if (sortBy === "Newest") {
      return new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime();
    }

    return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
  });
  // Calculate overdue tasks
  const overdueTasks = tasks.filter(
  (task) =>
    task.status !== "Completed" &&
    new Date(task.dueDate) < new Date()
).length;
  // Calculate task summary

  const totalTasks = tasks.length;

  const completedTasks = tasks.filter(
    (task) => task.status === "Completed",
  ).length;

  const pendingTasks = totalTasks - completedTasks;
  const exportCSV = () => {
  const headers = [
    "Task Name",
    "Email",
    "Description",
    "Due Date",
    "Status",
  ];

  const rows = tasks.map((task) => [
    task.taskName,
    task.email,
    task.description,
    task.dueDate?.split("T")[0],
    task.status || "Pending",
  ]);

  const csvContent = [
    headers.join(","),
    ...rows.map((row) => row.join(",")),
  ].join("\n");

  const blob = new Blob([csvContent], {
    type: "text/csv;charset=utf-8;",
  });

  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = "tasks.csv";
  link.click();
};
  const dueTodayTasks = tasks.filter((task) => {
    
    const today = new Date().toISOString().split("T")[0];
    return task.dueDate?.split("T")[0] === today && task.status !== "Completed";
  }).length;

  return (
      <div className="min-h-screen bg-black text-white p-10">
      <h1 className="text-2xl md:text-4xl font-bold mb-2">BNYK Dashboard</h1>

      <p className="text-gray-400 mb-6">Total Tasks: {tasks.length}</p>

      <input
        type="text"
        placeholder="Search Task..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full p-3 rounded bg-zinc-900 border border-zinc-700 mb-6"
      />

      <div className="flex flex-wrap gap-3 mb-6">
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="bg-zinc-900 border border-zinc-500 px-2 py-2 rounded "
        >
          <option>Newest</option>
          <option>Oldest</option>
        </select>
        <button
          onClick={() => setFilter("All")}
          className="bg-blue-600 px-4 py-2 rounded"
        >
          All
        </button>

        <button
          onClick={() => setFilter("Pending")}
          className="bg-yellow-600 px-4 py-2 rounded"
        >
          Pending
        </button>

        <button
          onClick={() => setFilter("Completed")}
          className="bg-green-600 px-4 py-2 rounded"
        >
          Completed
        </button>
      </div>
      {/* Task Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-5">
          <h3 className="text-gray-400">Total Tasks</h3>
          <p className="text-3xl font-bold">{totalTasks}</p>
        </div>

        <div className="bg-yellow-900/20 border border-yellow-600 rounded-xl p-5">
          <h3 className="text-yellow-400">Pending</h3>
          <p className="text-3xl font-bold">{pendingTasks}</p>
        </div>

        <div className="bg-green-900/20 border border-green-600 rounded-xl p-5">
          <h3 className="text-green-400">Completed</h3>
          <p className="text-3xl font-bold">{completedTasks}</p>
        </div>
        <div className="bg-blue-900/20 border border-red-600 rounded-xl p-5">
          <h3 className="text-red-400">Due Today</h3>
          <p className="text-3xl font-bold">{dueTodayTasks}</p>
        </div>
      </div>

      {/* // Edit Task Form */}

      {editingTask && (
        <div className="bg-zinc-900 p-5 rounded-xl mb-6 border border-zinc-700">
          <h2 className="text-2xl mb-4">Edit Task</h2>

          <input
            type="text"
            value={formData.taskName}
            onChange={(e) =>
              setFormData({ ...formData, taskName: e.target.value })
            }
            className="w-full p-3 mb-3 rounded bg-black border border-zinc-700"
          />

          <input
            type="email"
            value={formData.email}
            onChange={(e) =>
              setFormData({ ...formData, email: e.target.value })
            }
            className="w-full p-3 mb-3 rounded bg-black border border-zinc-700"
          />

          <textarea
            value={formData.description}
            onChange={(e) =>
              setFormData({
                ...formData,
                description: e.target.value,
              })
            }
            className="w-full p-3 mb-3 rounded bg-black border border-zinc-700"
          />
          <input
            type="date"
            value={formData.dueDate?.split("T")[0]}
            onChange={(e) =>
              setFormData({
                ...formData,
                dueDate: e.target.value,
              })
            }
            className="w-full p-3 mb-3 rounded bg-black border border-zinc-700"
          />

          <input
            type="text"
            value={formData.notionLink}
            onChange={(e) =>
              setFormData({
                ...formData,
                notionLink: e.target.value,
              })
            }
            className="w-full p-3 mb-3 rounded bg-black border border-zinc-700"
          />
         <div className="flex flex-wrap gap-3 mt-3">
      <button
        onClick={updateTask}
        className="bg-blue-400 px-4 py-2 rounded active:scale-95"
      >
      Save Changes
      </button>

      <button
       onClick={() => setEditingTask(null)}
       className="bg-gray-600 px-4 py-2 rounded"
     >
       Cancel
      </button>
</div>
        </div>
      )}

     <div className="space-y-4">
  {sortedTasks.length === 0 ? (
    <div className="text-center py-20">
      <h2 className="text-2xl font-bold text-gray-400">
        No Tasks Found 😴
      </h2>

      <p className="text-gray-500 mt-2">
        Create a new task to get started.
      </p>
    </div>
  ) : (
    sortedTasks.map((task) => (
          <div
            key={task._id}
            className="border border-zinc-700 rounded-xl p-5 bg-zinc-900"
          >
            <div className="flex justify-between items-center">
              <h2 className="text-lg md:text-2xl font-bold">{task.taskName}</h2>
              {/* Status Badge */}
              <span
                className={`px-3 py-1 rounded text-sm ${
                  task.status === "Completed"
                    ? "bg-green-600"
                    : new Date(task.dueDate) < new Date()
                      ? "bg-red-600"
                      : "bg-yellow-600"
                }`}
              >
                {task.status === "Completed"
                  ? "Completed"
                  : new Date(task.dueDate) < new Date()
                    ? "Overdue"
                    : "Pending"}
              </span>
            </div>

            <div className="mt-4 space-y-2">
              <p>
                <strong>Email:</strong> {task.email}
              </p>

              <p>
                <strong>Description:</strong> {task.description}
              </p>

              <p>
                <strong>Due Date:</strong> {task.dueDate?.split("T")[0]}
              </p>
            </div>

            <div className="mt-4 flex flex-wrap gap-3">
              <a
                href={task.notionLink}
                target="_blank"
                className="bg-blue-600 px-4 py-2 rounded active:scale-95"
              >
                Open Notion
              </a>

              {task.status !== "Completed" && (
                <button
                  onClick={() => completeTask(task._id)}
                  className="bg-green-600 px-4 py-2 rounded"
                >
                  Complete
                </button>
                
              )}
              <button
              onClick={exportCSV}
              className="bg-purple-600 px-4 py-2 rounded active:scale-95"
>
              Export CSV
</button>

              <button
                onClick={() => deleteTask(task._id)}
                className="bg-red-600 px-4 py-2 rounded active:scale-95"
              >
                Delete
              </button>
              <button
                onClick={() => {
                  setEditingTask(task);

                  setFormData({
                    taskName: task.taskName || "",
                    email: task.email || "",
                    dueDate: task.dueDate || "",
                    description: task.description || "",
                    notionLink: task.notionLink || "",
                  });
                }}
                className="bg-pink-100 text-black px-4 py-2 rounded active:scale-95"
              >
                Edit
              </button>
            </div>
          </div>
        )))}
      </div>
    </div>
  );
}
