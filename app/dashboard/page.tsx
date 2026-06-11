"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { translations, languagesList, type Language } from "../../lib/translations";

export interface ITask {
  _id: string;
  taskName: string;
  email: string;
  dueDate: string;
  description: string;
  notionLink: string;
  status: "Pending" | "Completed";
  createdAt: string;
  updatedAt: string;
}

export default function Dashboard() {
  const router = useRouter();
  const [tasks, setTasks] = useState<ITask[]>([]);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("Newest");
  const [filter, setFilter] = useState("All");
  const [lang, setLang] = useState<Language>("en");
  const [mounted, setMounted] = useState(false);
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  // State to track the task being edited
  const [editingTask, setEditingTask] = useState<ITask | null>(null);

  const [formData, setFormData] = useState({
    taskName: "",
    email: "",
    dueDate: "",
    description: "",
    notionLink: "",
  });

  // Sync language and theme on mount
  useEffect(() => {
    const savedLang = localStorage.getItem("bnyk_lang") as Language;
    if (savedLang && translations[savedLang]) {
      setTimeout(() => {
        setLang(savedLang);
      }, 0);
    }
    
    const savedTheme = localStorage.getItem("bnyk_theme") as "dark" | "light";
    if (savedTheme === "light") {
      setTheme("light");
      document.documentElement.classList.add("light");
    } else {
      setTheme("dark");
      document.documentElement.classList.remove("light");
    }
    
    setMounted(true);

    // Fetch tasks
    fetch("/api/tasks")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch tasks");
        return res.json();
      })
      .then((data) => setTasks(data))
      .catch((err) => {
        console.error("Error fetching tasks:", err);
        toast.error("Failed to load tasks");
      });
  }, []);

  const handleLanguageChange = (newLang: Language) => {
    setLang(newLang);
    localStorage.setItem("bnyk_lang", newLang);
  };

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    localStorage.setItem("bnyk_theme", nextTheme);
    if (nextTheme === "light") {
      document.documentElement.classList.add("light");
    } else {
      document.documentElement.classList.remove("light");
    }
  };

  const t = mounted ? (translations[lang] || translations.en) : translations.en;

  // Function to update the task
  const updateTask = async () => {
    if (!editingTask) return;

    if (!formData.taskName.trim()) {
      toast.error(t.validationTaskName);
      return;
    }
    if (!formData.email.trim() || !formData.email.includes("@")) {
      toast.error(t.validationEmail);
      return;
    }

    const toastId = toast.loading(t.creatingButton);

    try {
      const response = await fetch(`/api/tasks/${editingTask._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error("Failed to update task");

      // Update state
      setTasks(
        tasks.map((task) =>
          task._id === editingTask._id ? { ...task, ...formData } : task
        )
      );

      setEditingTask(null);
      toast.success(t.taskUpdatedToast, { id: toastId });
    } catch (err) {
      console.error("Error updating task:", err);
      toast.error(t.errorToast, { id: toastId });
    }
  };

  // Function to delete a task
  const deleteTask = async (id: string) => {
    const ok = confirm(t.deleteConfirm);
    if (!ok) return;

    const toastId = toast.loading(t.creatingButton);

    try {
      const response = await fetch(`/api/tasks/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete task");

      setTasks(tasks.filter((task) => task._id !== id));
      toast.success(t.taskDeletedToast, { id: toastId });
    } catch (err) {
      console.error("Error deleting task:", err);
      toast.error(t.errorToast, { id: toastId });
    }
  };

  // Function to mark a task as completed
  const completeTask = async (id: string) => {
    const toastId = toast.loading(t.creatingButton);

    try {
      const response = await fetch(`/api/tasks/${id}`, {
        method: "PATCH",
      });

      if (!response.ok) throw new Error("Failed to mark completed");

      setTasks(
        tasks.map((task) =>
          task._id === id ? { ...task, status: "Completed" } : task
        )
      );
      toast.success(t.taskCompletedToast, { id: toastId });
    } catch (err) {
      console.error("Error completing task:", err);
      toast.error(t.errorToast, { id: toastId });
    }
  };

  const filteredTasks = tasks.filter((task) => {
    const matchesSearch =
      task.taskName?.toLowerCase().includes(search.toLowerCase()) ||
      task.email?.toLowerCase().includes(search.toLowerCase()) ||
      task.description?.toLowerCase().includes(search.toLowerCase());

    if (filter === "Pending") {
      return matchesSearch && task.status !== "Completed";
    }

    if (filter === "Completed") {
      return matchesSearch && task.status === "Completed";
    }

    return matchesSearch;
  });

  const sortedTasks = [...filteredTasks].sort((a, b) => {
    if (!a.dueDate) return 1;
    if (!b.dueDate) return -1;
    if (sortBy === "Newest") {
      return new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime();
    }
    return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
  });

  // Calculate task summary safely using date bounds
  const todayStr = new Date().toISOString().split("T")[0];

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((task) => task.status === "Completed").length;
  const pendingTasks = totalTasks - completedTasks;
  
  const dueTodayTasks = tasks.filter((task) => {
    return task.dueDate?.split("T")[0] === todayStr && task.status !== "Completed";
  }).length;

  const overdueTasksCount = tasks.filter((task) => {
    if (task.status === "Completed" || !task.dueDate) return false;
    const dueDateStr = task.dueDate.split("T")[0];
    return dueDateStr < todayStr;
  }).length;

  const exportCSV = () => {
    const headers = [
      "Task Name",
      "Email",
      "Description",
      "Due Date",
      "Status",
    ];

    const rows = tasks.map((task) => [
      task.taskName || "",
      task.email || "",
      task.description || "",
      task.dueDate?.split("T")[0] || "",
      task.status || "Pending",
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `bnyk_tasks_${todayStr}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen relative p-4 md:p-8 flex flex-col justify-between overflow-x-hidden transition-colors duration-300">
      {/* Decorative Blur Blobs */}
      <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-blue-600/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-purple-600/5 blur-[120px] pointer-events-none" />

      <div className="w-full max-w-6xl mx-auto z-10 flex-1">
        {/* Header Section */}
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8 pb-6 border-b border-zinc-800/60 animate-fade-in">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-zinc-400">
              {t.dashboardHeading}
            </h1>
            <p className="text-xs text-zinc-500 mt-1">
              {t.totalTasks}: {totalTasks}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="flex items-center justify-center p-2 rounded-lg bg-zinc-900/40 hover:bg-zinc-800/80 border border-zinc-800 text-zinc-400 hover:text-zinc-200 transition-all backdrop-blur-md cursor-pointer"
              aria-label="Toggle Theme"
            >
              {theme === "dark" ? (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
                </svg>
              )}
            </button>

            {/* Language Switcher */}
            <div className="flex items-center gap-2 bg-zinc-900/40 border border-zinc-800 rounded-lg px-2.5 py-1.5 backdrop-blur-md">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-zinc-400">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 0 1 3 12c0-.805.105-1.586.302-2.327" />
              </svg>
              <select
                value={lang}
                onChange={(e) => handleLanguageChange(e.target.value as Language)}
                className="bg-transparent text-xs text-zinc-200 outline-none cursor-pointer pr-1"
              >
                {languagesList.map((langItem) => (
                  <option key={langItem.code} value={langItem.code} className="bg-zinc-950 text-white">
                    {langItem.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Back to Form button */}
            <button
              onClick={() => router.push("/")}
              className="flex items-center gap-1.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-xs font-semibold text-white px-4 py-2 rounded-lg transition-all active:scale-95 shadow-md shadow-blue-500/10 glow-blue cursor-pointer"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              {t.backToCreate}
            </button>
          </div>
        </header>

        {/* Task Summary Grid */}
        <section className="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4 mb-8 animate-fade-in">
          {/* Total Tasks */}
          <div className="glass-panel rounded-xl p-4 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-[2.5px] bg-blue-500/20" />
            <h3 className="text-zinc-500 text-xs uppercase tracking-wider font-semibold">{t.totalTasks}</h3>
            <p className="text-2xl md:text-3xl font-extrabold mt-1.5">{totalTasks}</p>
          </div>

          {/* Pending Tasks */}
          <div className="glass-panel rounded-xl p-4 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-[2.5px] bg-yellow-500/20" />
            <h3 className="text-yellow-500/80 text-xs uppercase tracking-wider font-semibold">{t.pending}</h3>
            <p className="text-2xl md:text-3xl font-extrabold mt-1.5">{pendingTasks}</p>
          </div>

          {/* Completed Tasks */}
          <div className="glass-panel rounded-xl p-4 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-[2.5px] bg-green-500/20" />
            <h3 className="text-green-500/80 text-xs uppercase tracking-wider font-semibold">{t.completed}</h3>
            <p className="text-2xl md:text-3xl font-extrabold mt-1.5">{completedTasks}</p>
          </div>

          {/* Due Today Tasks */}
          <div className="glass-panel rounded-xl p-4 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-[2.5px] bg-indigo-500/20" />
            <h3 className="text-indigo-400 text-xs uppercase tracking-wider font-semibold">{t.dueToday}</h3>
            <p className="text-2xl md:text-3xl font-extrabold mt-1.5">{dueTodayTasks}</p>
          </div>

          {/* Overdue Tasks Warning Card */}
          <div className={`glass-panel rounded-xl p-4 shadow-sm relative overflow-hidden col-span-2 md:col-span-1 border transition-all ${overdueTasksCount > 0 ? "border-red-500/30 glow-red" : ""}`}>
            <div className={`absolute top-0 left-0 right-0 h-[2.5px] ${overdueTasksCount > 0 ? "bg-red-500" : "bg-zinc-800"}`} />
            <h3 className={`text-xs uppercase tracking-wider font-semibold ${overdueTasksCount > 0 ? "text-red-400" : "text-zinc-500"}`}>{t.overdue}</h3>
            <p className={`text-2xl md:text-3xl font-extrabold mt-1.5 ${overdueTasksCount > 0 ? "text-red-500" : "var(--foreground)"}`}>{overdueTasksCount}</p>
          </div>
        </section>

        {/* Filters and Controls */}
        <section className="glass-panel rounded-xl p-4 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 animate-fade-in shadow-md">
          {/* Search bar */}
          <div className="relative flex-1 max-w-lg">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500 text-sm">
              🔍
            </span>
            <input
              type="text"
              placeholder={t.searchPlaceholder}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-lg glass-input text-sm"
            />
          </div>

          {/* Tab Filters */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Filter buttons */}
            <div className="flex bg-zinc-900/60 p-1 border border-zinc-800 rounded-lg">
              <button
                onClick={() => setFilter("All")}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${filter === "All" ? "bg-blue-600 text-white" : "text-zinc-400 hover:text-zinc-200"}`}
              >
                {t.all}
              </button>
              <button
                onClick={() => setFilter("Pending")}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${filter === "Pending" ? "bg-yellow-600 text-white" : "text-zinc-400 hover:text-zinc-200"}`}
              >
                {t.pending}
              </button>
              <button
                onClick={() => setFilter("Completed")}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${filter === "Completed" ? "bg-green-600 text-white" : "text-zinc-400 hover:text-zinc-200"}`}
              >
                {t.completed}
              </button>
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-1.5 bg-zinc-900/60 border border-zinc-800 px-2 py-1.5 rounded-lg text-xs">
              <span className="text-zinc-500 font-medium">{t.sortBy}:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-transparent text-zinc-300 outline-none cursor-pointer pr-1 font-semibold"
              >
                <option value="Newest" className="bg-zinc-950 text-white">{t.newest}</option>
                <option value="Oldest" className="bg-zinc-950 text-white">{t.oldest}</option>
              </select>
            </div>

            {/* Export CSV button */}
            <button
              onClick={exportCSV}
              className="flex items-center gap-1.5 bg-purple-900/40 hover:bg-purple-800/50 border border-purple-800/60 text-xs text-purple-300 font-semibold px-3 py-2 rounded-lg transition-all active:scale-95 cursor-pointer"
            >
              📥 {t.exportCsvButton}
            </button>
          </div>
        </section>

        {/* Task Cards Grid */}
        <section className="space-y-4 animate-fade-in mb-10">
          {sortedTasks.length === 0 ? (
            <div className="glass-panel rounded-2xl py-24 text-center">
              <h2 className="text-xl font-bold text-zinc-400">
                {t.noTasksFound}
              </h2>
              <p className="text-xs text-zinc-500 mt-2">
                {t.createFirstTask}
              </p>
              <button
                onClick={() => router.push("/")}
                className="mt-4 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs px-4 py-2 rounded-lg border border-zinc-700 transition-all cursor-pointer"
              >
                {t.backToCreate}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {sortedTasks.map((task) => {
                const isOverdue = task.status !== "Completed" && task.dueDate && task.dueDate.split("T")[0] < todayStr;
                return (
                  <div
                    key={task._id}
                    className="glass-panel glass-card rounded-xl p-5 shadow relative overflow-hidden flex flex-col justify-between"
                  >
                    {/* Status Top Line indicator */}
                    <div className={`absolute top-0 left-0 right-0 h-[3px] ${
                      task.status === "Completed"
                        ? "bg-green-500"
                        : isOverdue
                          ? "bg-red-500"
                          : "bg-yellow-500"
                    }`} />

                    <div>
                      <div className="flex justify-between items-start gap-4 mb-3">
                        <h2 className="text-lg font-bold line-clamp-1">
                          {task.taskName}
                        </h2>
                        
                        {/* Status Badge */}
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                            task.status === "Completed"
                              ? "bg-green-500/10 text-green-400 border border-green-500/20"
                              : isOverdue
                                ? "bg-red-500/10 text-red-400 border border-red-500/20"
                                : "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20"
                          }`}
                        >
                          {task.status === "Completed"
                            ? t.completed
                            : isOverdue
                              ? t.overdue
                              : t.pending}
                        </span>
                      </div>

                      {/* Task Info Rows */}
                      <div className="space-y-2 text-xs text-zinc-400 mb-6">
                        {task.description && (
                          <p className="line-clamp-2 leading-relaxed">
                            {task.description}
                          </p>
                        )}

                        <div className="pt-2 border-t border-zinc-800/50 space-y-1 text-[11px]">
                          <div className="flex items-center gap-2">
                            <span className="text-zinc-500 font-medium w-12">Email:</span>
                            <span className="text-zinc-300 font-semibold select-all">{task.email}</span>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-zinc-500 font-medium w-12">{t.dueDateLabel}:</span>
                            <span className={`font-semibold ${isOverdue ? "text-red-400" : "text-zinc-300"}`}>
                              {task.dueDate ? task.dueDate.split("T")[0] : "-"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Actions Panel */}
                    <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-zinc-800/40">
                      {task.notionLink && (
                        <a
                          href={task.notionLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 bg-zinc-800 hover:bg-zinc-700 text-[11px] text-zinc-300 px-3 py-1.5 rounded-md transition-all active:scale-95"
                        >
                          🔗 {t.openImpLink}
                        </a>
                      )}

                      {task.status !== "Completed" && (
                        <button
                          onClick={() => completeTask(task._id)}
                          className="flex items-center gap-1 bg-green-900/40 hover:bg-green-800/50 border border-green-800/50 text-[11px] text-green-300 px-3 py-1.5 rounded-md transition-all active:scale-95 cursor-pointer"
                        >
                          ✓ {t.completeButton}
                        </button>
                      )}

                      <button
                        onClick={() => {
                          setEditingTask(task);
                          setFormData({
                            taskName: task.taskName || "",
                            email: task.email || "",
                            dueDate: task.dueDate ? task.dueDate.split("T")[0] : "",
                            description: task.description || "",
                            notionLink: task.notionLink || "",
                          });
                        }}
                        className="flex items-center gap-1 bg-blue-900/40 hover:bg-blue-800/50 border border-blue-800/50 text-[11px] text-blue-300 px-3 py-1.5 rounded-md transition-all active:scale-95 ml-auto cursor-pointer"
                      >
                        ✏️ {t.editButton}
                      </button>

                      <button
                        onClick={() => deleteTask(task._id)}
                        className="flex items-center gap-1 bg-red-950/40 hover:bg-red-900/40 border border-red-900/40 text-[11px] text-red-300 px-3 py-1.5 rounded-md transition-all active:scale-95 cursor-pointer"
                      >
                        🗑️ {t.deleteButton}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {/* Edit Task Modal Dialog Backdrop */}
      {editingTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md transition-all animate-fade-in">
          <div className="glass-panel w-full max-w-lg rounded-2xl p-6 sm:p-8 shadow-2xl glow-blue relative overflow-hidden">
            {/* Modal glow border header */}
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-blue-500/0 via-blue-500 to-purple-500/0" />

            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                ✏️ {t.editTaskHeading}
              </h2>
              <button
                onClick={() => setEditingTask(null)}
                className="text-zinc-500 hover:text-white transition-all text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              {/* Task Name */}
              <div>
                <label className="block text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">
                  {t.taskNamePlaceholder}
                </label>
                <input
                  type="text"
                  value={formData.taskName}
                  onChange={(e) =>
                    setFormData({ ...formData, taskName: e.target.value })
                  }
                  className="w-full p-2.5 rounded-lg glass-input text-sm"
                />
              </div>

              {/* Assignee Email */}
              <div>
                <label className="block text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">
                  {t.assigneeEmailPlaceholder}
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="w-full p-2.5 rounded-lg glass-input text-sm"
                />
              </div>

              {/* Due Date */}
              <div>
                <label className="block text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">
                  {t.dueDateLabel}
                </label>
                <input
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) =>
                    setFormData({ ...formData, dueDate: e.target.value })
                  }
                  className="w-full p-2.5 rounded-lg glass-input text-sm"
                />
              </div>

              {/* Task Description */}
              <div>
                <label className="block text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">
                  {t.descriptionPlaceholder}
                </label>
                <textarea
                  value={formData.description}
                  rows={3}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      description: e.target.value,
                    })
                  }
                  className="w-full p-2.5 rounded-lg glass-input text-sm resize-none"
                />
              </div>

              {/* Imp Link */}
              <div>
                <label className="block text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">
                  {t.impLinkPlaceholder}
                </label>
                <input
                  type="text"
                  value={formData.notionLink}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      notionLink: e.target.value,
                    })
                  }
                  className="w-full p-2.5 rounded-lg glass-input text-sm"
                />
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-zinc-800/60">
                <button
                  onClick={() => setEditingTask(null)}
                  className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold px-4 py-2 rounded-lg border border-zinc-700 transition-all cursor-pointer"
                >
                  {t.cancel}
                </button>

                <button
                  onClick={updateTask}
                  className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-5 py-2 rounded-lg shadow-md shadow-blue-500/10 glow-blue transition-all cursor-pointer"
                >
                  {t.saveChanges}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="relative w-full max-w-6xl mx-auto text-center text-[10px] text-zinc-500 z-10 py-4 mt-8 border-t border-zinc-900/60">
        © {new Date().getFullYear()} BNYK. All rights reserved. Built with Next.js & TailwindCSS.
      </footer>
    </div>
  );
}
