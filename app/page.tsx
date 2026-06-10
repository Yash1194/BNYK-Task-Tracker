"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
export default function Home() {
  const router = useRouter();
   const [taskName, setTaskName] = useState("");
  const [email, setEmail] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [description, setDescription] = useState("");
  const [notionLink, setNotionLink] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: any) => {
  e.preventDefault();
  setLoading(true);


  try {

    const response = await fetch("/api/create-task", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        taskName,
        email,
        dueDate,
        description,
        notionLink,
      }),
    });

    const data = await response.json();

    
    router.push("/dashboard");

    setTaskName("");
    setEmail("");
    setDueDate("");
    setDescription("");
    setNotionLink("");
    setLoading(false);
  } catch (error) {
    alert("Something went wrong");
    setLoading(false);

    
  }
};

  return (
    <main className="min-h-screen bg-black text-white p-10">
      <div className="max-w-3xl mx-auto">

        <h1 className="text-5xl font-bold mb-8">
          BNYK.io Task Manager
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">

          <input
        type="text"
        placeholder="Task Name"
        value={taskName}
        onChange={(e) => setTaskName(e.target.value)}
        className="w-full p-3 rounded bg-zinc-900 border border-zinc-700"
/>

          <input
        type="email"
        placeholder="Assignee Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="w-full p-3 rounded bg-zinc-900 border border-zinc-700"
/>

          <input
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          className="w-full p-3 rounded bg-zinc-900 border border-zinc-700"
          />

          <textarea
        placeholder="Task Description"
        rows={5}
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        className="w-full p-3 rounded bg-zinc-900 border border-zinc-700"
/>

          <input
            type="text"
            placeholder="Notion Link"
            value={notionLink}
            onChange={(e) => setNotionLink(e.target.value)}
            className="w-full p-3 rounded bg-zinc-900 border border-zinc-700"
          />

          <button
          type="submit"
          className="bg-blue-600 px-6 py-3 rounded active:scale-95"
>
          {loading ? "Creating..." : "Create Task"}
</button>

        </form>

      </div>
    </main>
  );
}