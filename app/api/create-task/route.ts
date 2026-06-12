import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { connectDB } from "../../../lib/mongodb";
import Task from "../../../models/Task";

export async function POST(req: Request) {
  try {
    await connectDB();

    const body = await req.json();
    const { taskName, email, dueDate, description, notionLink, priority } =
      body;

    // Basic validation
    if (!taskName?.trim()) {
      return NextResponse.json(
        { error: "Task name is required" },
        { status: 400 }
      );
    }
    if (!email?.trim()) {
      return NextResponse.json(
        { error: "Assignee email is required" },
        { status: 400 }
      );
    }

    const task = await Task.create({
      taskName: taskName.trim(),
      email: email.trim(),
      dueDate: dueDate || "",
      description: description || "",
      notionLink: notionLink || "",
      priority: priority || "Medium",
    });

    // Send email notification asynchronously (non-blocking)
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      Promise.resolve().then(async () => {
        try {
          const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
              user: process.env.EMAIL_USER,
              pass: process.env.EMAIL_PASS,
            },
          });

          await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: email,
            subject: `New Task Assigned: ${taskName}`,
            html: `
              <h2>New Task Assigned</h2>
              <p><strong>Task:</strong> ${taskName}</p>
              <p><strong>Priority:</strong> ${priority || "Medium"}</p>
              <p><strong>Due Date:</strong> ${dueDate || "Not set"}</p>
              <p><strong>Description:</strong> ${description || "No description"}</p>
              ${notionLink ? `<p><a href="${notionLink}">Open Link</a></p>` : ""}
            `,
          });
        } catch (emailError) {
          console.error(
            "[POST /api/create-task] Email send failed (non-fatal):",
            emailError
          );
        }
      });
    } else {
      console.warn(
        "[POST /api/create-task] EMAIL_USER or EMAIL_PASS not configured. Skipping email."
      );
    }

    return NextResponse.json(
      { success: true, message: "Task Created Successfully", task },
      { status: 201 }
    );
  } catch (error) {
    console.error("[POST /api/create-task]", error);
    return NextResponse.json(
      {
        error:
          "Failed to create task. Please verify MONGODB_URI in .env.local.",
      },
      { status: 500 }
    );
  }
}