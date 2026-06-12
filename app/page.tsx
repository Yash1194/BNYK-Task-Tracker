"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { translations, languagesList, type Language } from "../lib/translations";

type Priority = "Low" | "Medium" | "High";

export default function Home() {
  const router = useRouter();
  const [taskName, setTaskName] = useState("");
  const [email, setEmail] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [description, setDescription] = useState("");
  const [notionLink, setNotionLink] = useState("");
  const [priority, setPriority] = useState<Priority>("Medium");
  const [loading, setLoading] = useState(false);
  const [lang, setLang] = useState<Language>("en");
  const [mounted, setMounted] = useState(false);
  const [theme, setTheme] = useState<"dark" | "light">("light");

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

  // Prevent dehydration mismatch
  const t = mounted ? (translations[lang] || translations.en) : translations.en;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!taskName.trim()) {
      toast.error(t.validationTaskName);
      return;
    }
    if (!email.trim() || !email.includes("@")) {
      toast.error(t.validationEmail);
      return;
    }

    setLoading(true);
    const toastId = toast.loading(t.creatingButton);

    try {
      const response = await fetch("/api/create-task", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskName, email, dueDate, description, notionLink, priority }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        const errMsg = data.error || "Failed to create task";
        // Don't throw — show toast directly to avoid Next.js dev overlay
        toast.error(errMsg, { id: toastId });
        setLoading(false);
        return;
      }

      toast.success(t.taskCreatedToast, { id: toastId });

      // Reset form
      setTaskName("");
      setEmail("");
      setDueDate("");
      setDescription("");
      setNotionLink("");
      setPriority("Medium");

      // Navigate to dashboard
      router.push("/dashboard");
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Network error";
      toast.error(msg, { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen relative flex flex-col justify-between p-4 md:p-8 overflow-hidden transition-colors duration-300">
      {/* Decorative Glow Blobs */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-purple-600/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] rounded-full bg-blue-600/10 blur-[130px] pointer-events-none" />

      {/* ── Top Header Row ── */}
      <header className="relative w-full max-w-4xl mx-auto flex items-center justify-between z-10 mb-8 mt-2 animate-fade-in">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-purple-600 flex items-center justify-center font-bold text-white shadow-lg shadow-blue-500/20 glow-blue">
            B
          </div>
          <span className="hidden sm:inline font-extrabold text-xl tracking-tight">
            BNYK
          </span>
        </div>

        <div className="flex items-center gap-2.5">
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

          {/* Dashboard Link */}
          <button
            onClick={() => router.push("/dashboard")}
            className="flex items-center gap-1.5 glass-ctrl text-xs font-medium px-4 py-2 rounded-lg transition-all text-[var(--foreground)] cursor-pointer"
          >
            {t.viewDashboard}
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
            </svg>
          </button>
        </div>
      </header>

      {/* ── Centered Glassmorphic Card ── */}
      <section className="relative w-full max-w-xl mx-auto flex-1 flex flex-col justify-center z-10 py-6 animate-fade-in">
        <div className="glass-panel rounded-2xl p-6 sm:p-8 shadow-2xl glow-blue relative overflow-hidden">
          {/* Accent border highlight */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-blue-500/0 via-blue-500 to-purple-500/0" />

          <div className="text-center mb-7">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {t.createTaskHeading}
            </h1>
            <p className="text-sm mt-2" style={{ color: "var(--text-muted)" }}>
              BNYK Task Management Platform
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Task Name */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--label-color)" }}>
                {t.taskNamePlaceholder}
              </label>
              <input
                type="text"
                placeholder={t.taskNamePlaceholder}
                value={taskName}
                onChange={(e) => setTaskName(e.target.value)}
                className="w-full p-3 rounded-lg glass-input"
              />
            </div>

            {/* Email & Due Date — side by side on sm+ */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--label-color)" }}>
                  {t.assigneeEmailPlaceholder}
                </label>
                <input
                  type="email"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-3 rounded-lg glass-input"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--label-color)" }}>
                  {t.dueDateLabel}
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full p-3 rounded-lg glass-input"
                />
              </div>
            </div>

            {/* Priority */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--label-color)" }}>
                Priority
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(["Low", "Medium", "High"] as Priority[]).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPriority(p)}
                    className={`py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer border ${
                      priority === p
                        ? p === "High"
                          ? "bg-red-500/15 border-red-500/40 text-red-400"
                          : p === "Medium"
                            ? "bg-yellow-500/15 border-yellow-500/40 text-yellow-400"
                            : "bg-green-500/15 border-green-500/40 text-green-400"
                        : "glass-ctrl text-[var(--text-muted)] hover:text-[var(--foreground)]"
                    }`}
                  >
                    {p === "High" ? "🔴" : p === "Medium" ? "🟡" : "🟢"} {p}
                  </button>
                ))}
              </div>
            </div>

            {/* Task Description */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--label-color)" }}>
                {t.descriptionPlaceholder}
              </label>
              <textarea
                placeholder={t.descriptionPlaceholder}
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full p-3 rounded-lg glass-input resize-none"
              />
            </div>

            {/* Imp Link */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--label-color)" }}>
                {t.impLinkPlaceholder}
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-sm" style={{ color: "var(--text-muted)" }}>
                  🔗
                </span>
                <input
                  type="text"
                  placeholder="https://..."
                  value={notionLink}
                  onChange={(e) => setNotionLink(e.target.value)}
                  className="w-full pl-9 pr-3 p-3 rounded-lg glass-input"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 mt-2 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-semibold text-sm transition-all duration-300 active:scale-[0.98] disabled:opacity-50 hover:shadow-lg hover:shadow-purple-500/20 glow-purple flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-1 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  {t.creatingButton}
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                  {t.createButton}
                </>
              )}
            </button>
          </form>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="relative w-full max-w-4xl mx-auto text-center text-xs z-10 py-4 mt-6" style={{ color: "var(--text-muted)" }}>
        © {new Date().getFullYear()} BNYK. All rights reserved. Built with Next.js &amp; TailwindCSS.
      </footer>
    </main>
  );
}