"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import { useEffect, useState, useMemo } from "react";
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
  priority: "Low" | "Medium" | "High";
  createdAt: string;
  updatedAt: string;
}

export default function Dashboard() {
  const router = useRouter();
  const [tasks, setTasks] = useState<ITask[]>([]);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("Newest");
  const [filter, setFilter] = useState("All");
  const [priorityFilter, setPriorityFilter] = useState("All");
  const [lang, setLang] = useState<Language>("en");
  const [mounted, setMounted] = useState(false);
  const [theme, setTheme] = useState<"dark" | "light">("light");
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // State to track the task being edited
  const [editingTask, setEditingTask] = useState<ITask | null>(null);
  const [formData, setFormData] = useState({
    taskName: "",
    email: "",
    dueDate: "",
    description: "",
    notionLink: "",
    priority: "Medium" as "Low" | "Medium" | "High",
  });

  // Sync language and theme on mount, then fetch tasks
  useEffect(() => {
    const savedLang = localStorage.getItem("bnyk_lang") as Language;
    if (savedLang && translations[savedLang]) {
      setLang(savedLang);
    }

    const savedTheme = localStorage.getItem("bnyk_theme") as "dark" | "light";
    if (savedTheme === "dark") {
      setTheme("dark");
      document.documentElement.classList.remove("light");
    } else {
      // Default to light if no preference saved
      setTheme("light");
      document.documentElement.classList.add("light");
    }

    setMounted(true);

    // Fetch tasks
    setLoading(true);
    setFetchError(null);
    fetch("/api/tasks")
      .then(async (res) => {
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          const msg = body.error || `Server error (HTTP ${res.status})`;
          setFetchError(msg);
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (data !== null && data !== undefined) setTasks(data);
      })
      .catch((err: Error) => {
        setFetchError(err.message || "Network error — check your connection.");
      })
      .finally(() => setLoading(false));
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

  // Update task
  const updateTask = async () => {
    if (!editingTask) return;
    if (!formData.taskName.trim()) { toast.error(t.validationTaskName); return; }
    if (!formData.email.trim() || !formData.email.includes("@")) { toast.error(t.validationEmail); return; }

    const toastId = toast.loading(t.creatingButton);
    try {
      const response = await fetch(`/api/tasks/${editingTask._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (!response.ok) throw new Error("Failed to update task");
      setTasks(tasks.map((task) => task._id === editingTask._id ? { ...task, ...formData } : task));
      setEditingTask(null);
      toast.success(t.taskUpdatedToast, { id: toastId });
    } catch (err) {
      console.error("Error updating task:", err);
      toast.error(t.errorToast, { id: toastId });
    }
  };

  // Delete task
  const deleteTask = async (id: string) => {
    const ok = confirm(t.deleteConfirm);
    if (!ok) return;
    const toastId = toast.loading(t.creatingButton);
    try {
      const response = await fetch(`/api/tasks/${id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Failed to delete task");
      setTasks(tasks.filter((task) => task._id !== id));
      toast.success(t.taskDeletedToast, { id: toastId });
    } catch (err) {
      console.error("Error deleting task:", err);
      toast.error(t.errorToast, { id: toastId });
    }
  };

  // Complete task
  const completeTask = async (id: string) => {
    const toastId = toast.loading(t.creatingButton);
    try {
      const response = await fetch(`/api/tasks/${id}`, { method: "PATCH" });
      if (!response.ok) throw new Error("Failed to mark completed");
      setTasks(tasks.map((task) => task._id === id ? { ...task, status: "Completed" } : task));
      toast.success(t.taskCompletedToast, { id: toastId });
    } catch (err) {
      console.error("Error completing task:", err);
      toast.error(t.errorToast, { id: toastId });
    }
  };

  const todayStr = new Date().toISOString().split("T")[0];

  const filteredTasks = useMemo(() => tasks.filter((task) => {
    const matchesSearch =
      task.taskName?.toLowerCase().includes(search.toLowerCase()) ||
      task.email?.toLowerCase().includes(search.toLowerCase()) ||
      task.description?.toLowerCase().includes(search.toLowerCase());

    const matchesStatus =
      filter === "All" ||
      (filter === "Pending" && task.status !== "Completed") ||
      (filter === "Completed" && task.status === "Completed");

    const matchesPriority =
      priorityFilter === "All" || task.priority === priorityFilter;

    return matchesSearch && matchesStatus && matchesPriority;
  }), [tasks, search, filter, priorityFilter]);

  const sortedTasks = useMemo(() => [...filteredTasks].sort((a, b) => {
    if (sortBy === "Newest") {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  }), [filteredTasks, sortBy]);

  // Stats
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === "Completed").length;
  const pendingTasks = totalTasks - completedTasks;
  const dueTodayTasks = tasks.filter((t) => t.dueDate?.split("T")[0] === todayStr && t.status !== "Completed").length;
  const overdueTasksCount = tasks.filter((t) => {
    if (t.status === "Completed" || !t.dueDate) return false;
    return t.dueDate.split("T")[0] < todayStr;
  }).length;

  const exportCSV = () => {
    const headers = ["Task Name", "Email", "Priority", "Description", "Due Date", "Status"];
    const rows = tasks.map((task) => [
      task.taskName || "",
      task.email || "",
      task.priority || "Medium",
      task.description || "",
      task.dueDate?.split("T")[0] || "",
      task.status || "Pending",
    ]);
    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")),
    ].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
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
        {/* ── Header ── */}
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8 pb-6 border-b border-[var(--border-color)] animate-fade-in">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {t.dashboardHeading}
            </h1>
            <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
              {t.totalTasks}: {totalTasks}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="glass-ctrl flex items-center justify-center p-2 rounded-lg text-[var(--text-muted)] hover:text-[var(--foreground)] transition-all cursor-pointer"
              aria-label="Toggle Theme"
            >
              {theme === "dark" ? (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z" />
                </svg>
              )}
            </button>

            {/* Language Switcher */}
            <div className="glass-ctrl flex items-center gap-2 rounded-lg px-2.5 py-1.5">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-[var(--text-muted)]">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 0 1 3 12c0-.805.105-1.586.302-2.327" />
              </svg>
              <select
                value={lang}
                onChange={(e) => handleLanguageChange(e.target.value as Language)}
                className="bg-transparent text-xs text-[var(--foreground)] outline-none cursor-pointer pr-1"
              >
                {languagesList.map((langItem) => (
                  <option key={langItem.code} value={langItem.code} className="bg-zinc-950 text-white">
                    {langItem.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Back to Form */}
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

        {/* ── Task Summary Grid ── */}
        <section className="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4 mb-8 animate-fade-in">
          <div className="glass-panel rounded-xl p-4 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-[2.5px] bg-blue-500/30" />
            <h3 className="text-zinc-500 text-xs uppercase tracking-wider font-semibold">{t.totalTasks}</h3>
            <p className="text-2xl md:text-3xl font-extrabold mt-1.5">{totalTasks}</p>
          </div>

          <div className="glass-panel rounded-xl p-4 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-[2.5px] bg-yellow-500/40" />
            <h3 className="text-yellow-500/80 text-xs uppercase tracking-wider font-semibold">{t.pending}</h3>
            <p className="text-2xl md:text-3xl font-extrabold mt-1.5">{pendingTasks}</p>
          </div>

          <div className="glass-panel rounded-xl p-4 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-[2.5px] bg-green-500/40" />
            <h3 className="text-green-500/80 text-xs uppercase tracking-wider font-semibold">{t.completed}</h3>
            <p className="text-2xl md:text-3xl font-extrabold mt-1.5">{completedTasks}</p>
          </div>

          <div className="glass-panel rounded-xl p-4 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-[2.5px] bg-indigo-500/30" />
            <h3 className="text-indigo-400 text-xs uppercase tracking-wider font-semibold">{t.dueToday}</h3>
            <p className="text-2xl md:text-3xl font-extrabold mt-1.5">{dueTodayTasks}</p>
          </div>

          <div className={`glass-panel rounded-xl p-4 shadow-sm relative overflow-hidden col-span-2 md:col-span-1 border transition-all ${overdueTasksCount > 0 ? "border-red-500/30 glow-red" : "border-[var(--border-color)]"}`}>
            <div className={`absolute top-0 left-0 right-0 h-[2.5px] ${overdueTasksCount > 0 ? "bg-red-500" : "bg-[var(--border-color)]"}`} />
            <h3 className={`text-xs uppercase tracking-wider font-semibold ${overdueTasksCount > 0 ? "text-red-400" : ""}`} style={overdueTasksCount === 0 ? { color: "var(--text-muted)" } : {}}>
              {t.overdue}
            </h3>
            <p className={`text-2xl md:text-3xl font-extrabold mt-1.5 ${overdueTasksCount > 0 ? "text-red-500" : ""}`}>
              {overdueTasksCount}
            </p>
          </div>
        </section>

        {/* ── Filters and Controls ── */}
        <section className="glass-panel rounded-xl p-4 mb-6 flex flex-col gap-3 animate-fade-in shadow-md">
          {/* Row 1: Search + Status Filter + Sort + Export */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Search */}
            <div className="relative flex-1 max-w-lg">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-sm" style={{ color: "var(--text-muted)" }}>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                </svg>
              </span>
              <input
                type="text"
                placeholder={t.searchPlaceholder}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-lg glass-input text-sm"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Status Filter Tabs */}
              <div className="flex bg-[var(--ctrl-bg)] p-1 border border-[var(--ctrl-border)] rounded-lg gap-0.5">
                {["All", "Pending", "Completed"].map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                      filter === f
                        ? f === "Completed" ? "bg-green-600 text-white" : f === "Pending" ? "bg-yellow-600 text-white" : "bg-blue-600 text-white"
                        : "text-[var(--text-muted)] hover:text-[var(--foreground)]"
                    }`}
                  >
                    {f === "All" ? t.all : f === "Pending" ? t.pending : t.completed}
                  </button>
                ))}
              </div>

              {/* Sort Dropdown */}
              <div className="glass-ctrl flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs">
                <span style={{ color: "var(--text-muted)" }} className="font-medium">{t.sortBy}:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="bg-transparent text-[var(--foreground)] outline-none cursor-pointer pr-1 font-semibold"
                >
                  <option value="Newest" className="bg-zinc-950 text-white">{t.newest}</option>
                  <option value="Oldest" className="bg-zinc-950 text-white">{t.oldest}</option>
                </select>
              </div>

              {/* Export CSV */}
              <button
                onClick={exportCSV}
                disabled={tasks.length === 0}
                className="flex items-center gap-1.5 btn-export text-xs font-semibold px-3 py-2 rounded-lg transition-all active:scale-95 cursor-pointer disabled:opacity-40"
              >
                📥 {t.exportCsvButton}
              </button>
            </div>
          </div>

          {/* Row 2: Priority Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Priority:</span>
            <div className="flex bg-[var(--ctrl-bg)] p-1 border border-[var(--ctrl-border)] rounded-lg gap-0.5">
              {["All", "High", "Medium", "Low"].map((p) => (
                <button
                  key={p}
                  onClick={() => setPriorityFilter(p)}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                    priorityFilter === p
                      ? p === "High" ? "bg-red-600 text-white" : p === "Medium" ? "bg-yellow-600 text-white" : p === "Low" ? "bg-green-600 text-white" : "bg-blue-600 text-white"
                      : "text-[var(--text-muted)] hover:text-[var(--foreground)]"
                  }`}
                >
                  {p === "All" ? "All" : p === "High" ? "🔴 High" : p === "Medium" ? "🟡 Medium" : "🟢 Low"}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* ── Task Cards Grid ── */}
        <section className="space-y-4 animate-fade-in mb-10">
          {/* DB connection error banner */}
          {fetchError && (
            <div className="glass-panel rounded-xl p-4 flex flex-col sm:flex-row gap-3 sm:items-start border-red-500/30" style={{ borderColor: "rgba(239,68,68,0.3)", background: "rgba(239,68,68,0.05)" }}>
              <span className="text-xl">⚠️</span>
              <div>
                <p className="text-sm font-semibold text-red-400">Database connection failed</p>
                <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>{fetchError}</p>
                <p className="text-xs mt-2 font-medium" style={{ color: "var(--text-muted)" }}>
                  Fix: Open <code className="px-1 py-0.5 rounded text-[11px] font-mono" style={{ background: "var(--ctrl-bg)", border: "1px solid var(--ctrl-border)" }}>.env.local</code> and replace the placeholder with your real MongoDB Atlas connection string, then restart the dev server.
                </p>
                <button
                  onClick={() => { setFetchError(null); setLoading(true); fetch("/api/tasks").then(async r => { if (!r.ok) { const b = await r.json().catch(() => ({})); setFetchError(b.error || `HTTP ${r.status}`); return null; } return r.json(); }).then(d => { if (d) setTasks(d); }).catch((e: Error) => setFetchError(e.message)).finally(() => setLoading(false)); }}
                  className="mt-3 text-[11px] font-semibold px-3 py-1.5 rounded-md btn-info cursor-pointer"
                >
                  ↺ Retry
                </button>
              </div>
            </div>
          )}
          {loading ? (
            // Skeleton loading state
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="glass-panel glass-card rounded-xl p-5">
                  <div className="flex justify-between items-start mb-3">
                    <div className="skeleton h-4 w-32 rounded" />
                    <div className="skeleton h-4 w-16 rounded-full" />
                  </div>
                  <div className="skeleton h-5 w-3/4 mb-3 rounded" />
                  <div className="skeleton h-3 w-full mb-1.5 rounded" />
                  <div className="skeleton h-3 w-5/6 mb-4 rounded" />
                  <div className="flex gap-2 pt-3 border-t border-[var(--border-color)]">
                    <div className="skeleton h-6 w-20 rounded-md" />
                    <div className="skeleton h-6 w-16 rounded-md" />
                  </div>
                </div>
              ))}
            </div>
          ) : sortedTasks.length === 0 ? (
            // Empty state
            <div className="glass-panel rounded-2xl py-20 text-center">
              <div className="text-5xl mb-4">📋</div>
              <h2 className="text-xl font-bold" style={{ color: "var(--text-muted)" }}>
                {search || filter !== "All" || priorityFilter !== "All" ? "No matching tasks" : t.noTasksFound}
              </h2>
              <p className="text-xs mt-2 mb-5" style={{ color: "var(--text-muted)" }}>
                {search || filter !== "All" || priorityFilter !== "All"
                  ? "Try adjusting your search or filters."
                  : t.createFirstTask}
              </p>
              {search || filter !== "All" || priorityFilter !== "All" ? (
                <button
                  onClick={() => { setSearch(""); setFilter("All"); setPriorityFilter("All"); }}
                  className="glass-ctrl text-xs font-medium px-4 py-2 rounded-lg transition-all cursor-pointer text-[var(--foreground)]"
                >
                  Clear filters
                </button>
              ) : (
                <button
                  onClick={() => router.push("/")}
                  className="glass-ctrl text-xs font-medium px-4 py-2 rounded-lg border border-[var(--ctrl-border)] transition-all cursor-pointer text-[var(--foreground)]"
                >
                  {t.backToCreate}
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {sortedTasks.map((task) => {
                const isOverdue = task.status !== "Completed" && task.dueDate && task.dueDate.split("T")[0] < todayStr;
                const isDueToday = task.status !== "Completed" && task.dueDate?.split("T")[0] === todayStr;
                return (
                  <div
                    key={task._id}
                    className="glass-panel glass-card rounded-xl p-5 shadow relative overflow-hidden flex flex-col justify-between"
                  >
                    {/* Status Top Line indicator */}
                    <div className={`absolute top-0 left-0 right-0 h-[3px] ${
                      task.status === "Completed" ? "bg-green-500" : isOverdue ? "bg-red-500" : isDueToday ? "bg-blue-500" : "bg-yellow-500"
                    }`} />

                    <div>
                      {/* Header row */}
                      <div className="flex justify-between items-start gap-3 mb-2.5">
                        <h2 className="text-base font-bold leading-snug line-clamp-2 flex-1">
                          {task.taskName}
                        </h2>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {/* Priority badge */}
                          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                            (task.priority ?? "Medium") === "High"
                              ? "bg-red-500/10 text-red-400 border-red-500/20"
                              : (task.priority ?? "Medium") === "Low"
                                ? "bg-green-500/10 text-green-400 border-green-500/20"
                                : "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
                          }`}>
                            {(task.priority ?? "Medium") === "High" ? "🔴" : (task.priority ?? "Medium") === "Low" ? "🟢" : "🟡"} {task.priority ?? "Medium"}
                          </span>
                          {/* Status badge */}
                          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                            task.status === "Completed"
                              ? "bg-green-500/10 text-green-400 border-green-500/20"
                              : isOverdue
                                ? "bg-red-500/10 text-red-400 border-red-500/20"
                                : "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
                          }`}>
                            {task.status === "Completed" ? t.completed : isOverdue ? t.overdue : t.pending}
                          </span>
                        </div>
                      </div>

                      {/* Task info */}
                      <div className="space-y-2 text-xs mb-5" style={{ color: "var(--text-muted)" }}>
                        {task.description && (
                          <p className="line-clamp-2 leading-relaxed">{task.description}</p>
                        )}
                        <div className="pt-2 border-t border-[var(--border-color)] space-y-1 text-[11px]">
                          <div className="flex items-center gap-2">
                            <span className="font-medium w-12" style={{ color: "var(--text-muted)" }}>Email:</span>
                            <span className="font-semibold select-all truncate">{task.email}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium w-12" style={{ color: "var(--text-muted)" }}>{t.dueDateLabel}:</span>
                            <span className={`font-semibold ${isOverdue ? "text-red-400" : isDueToday ? "text-blue-400" : ""}`}>
                              {task.dueDate ? task.dueDate.split("T")[0] : "—"}
                              {isDueToday && " (Today)"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-[var(--border-color)]">
                      {task.notionLink && (
                        <a
                          href={task.notionLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 glass-ctrl text-[11px] font-medium px-3 py-1.5 rounded-md transition-all active:scale-95"
                        >
                          🔗 {t.openImpLink}
                        </a>
                      )}

                      {task.status !== "Completed" && (
                        <button
                          onClick={() => completeTask(task._id)}
                          className="flex items-center gap-1 btn-success text-[11px] font-medium px-3 py-1.5 rounded-md transition-all active:scale-95 cursor-pointer"
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
                            priority: task.priority || "Medium",
                          });
                        }}
                        className="flex items-center gap-1 btn-info text-[11px] font-medium px-3 py-1.5 rounded-md transition-all active:scale-95 ml-auto cursor-pointer"
                      >
                        ✏️ {t.editButton}
                      </button>

                      <button
                        onClick={() => deleteTask(task._id)}
                        className="flex items-center gap-1 btn-danger text-[11px] font-medium px-3 py-1.5 rounded-md transition-all active:scale-95 cursor-pointer"
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

      {/* ── Edit Task Modal ── */}
      {editingTask && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md transition-all animate-fade-in"
          onClick={(e) => { if (e.target === e.currentTarget) setEditingTask(null); }}
        >
          <div className="glass-panel w-full max-w-lg rounded-2xl p-6 sm:p-8 shadow-2xl glow-blue relative overflow-hidden">
            {/* Modal accent border */}
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-blue-500/0 via-blue-500 to-purple-500/0" />

            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold flex items-center gap-2">
                ✏️ {t.editTaskHeading}
              </h2>
              <button
                onClick={() => setEditingTask(null)}
                className="glass-ctrl flex items-center justify-center w-8 h-8 rounded-lg text-[var(--text-muted)] hover:text-[var(--foreground)] transition-all cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: "var(--label-color)" }}>
                  {t.taskNamePlaceholder}
                </label>
                <input type="text" value={formData.taskName} onChange={(e) => setFormData({ ...formData, taskName: e.target.value })} className="w-full p-2.5 rounded-lg glass-input text-sm" />
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: "var(--label-color)" }}>
                  {t.assigneeEmailPlaceholder}
                </label>
                <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="w-full p-2.5 rounded-lg glass-input text-sm" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: "var(--label-color)" }}>
                    {t.dueDateLabel}
                  </label>
                  <input type="date" value={formData.dueDate} onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })} className="w-full p-2.5 rounded-lg glass-input text-sm" />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: "var(--label-color)" }}>
                    Priority
                  </label>
                  <select value={formData.priority} onChange={(e) => setFormData({ ...formData, priority: e.target.value as "Low" | "Medium" | "High" })} className="w-full p-2.5 rounded-lg glass-input text-sm">
                    <option value="Low">🟢 Low</option>
                    <option value="Medium">🟡 Medium</option>
                    <option value="High">🔴 High</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: "var(--label-color)" }}>
                  {t.descriptionPlaceholder}
                </label>
                <textarea rows={3} value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full p-2.5 rounded-lg glass-input text-sm resize-none" />
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: "var(--label-color)" }}>
                  {t.impLinkPlaceholder}
                </label>
                <input type="text" value={formData.notionLink} onChange={(e) => setFormData({ ...formData, notionLink: e.target.value })} className="w-full p-2.5 rounded-lg glass-input text-sm" />
              </div>

              <div className="flex items-center justify-end gap-2.5 mt-6 pt-4 border-t border-[var(--border-color)]">
                <button
                  onClick={() => setEditingTask(null)}
                  className="glass-ctrl text-xs font-semibold px-4 py-2 rounded-lg border border-[var(--ctrl-border)] transition-all cursor-pointer text-[var(--foreground)]"
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

      {/* ── Footer ── */}
      <footer className="relative w-full max-w-6xl mx-auto text-center text-[10px] z-10 py-4 mt-8 border-t border-[var(--border-color)]" style={{ color: "var(--text-muted)" }}>
        © {new Date().getFullYear()} BNYK. All rights reserved. Built with Next.js &amp; TailwindCSS.
      </footer>
    </div>
  );
}
