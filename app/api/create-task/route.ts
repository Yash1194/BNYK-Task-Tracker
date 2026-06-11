import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { connectDB } from "../../../lib/mongodb";
import Task from "../../../models/Task";

export async function POST(req: Request) {
  await connectDB();

  const body = await req.json();

  const {
    taskName,
    email,
    dueDate,
    description,
    notionLink,
  } = body;

  const task = await Task.create({
    taskName,
    email,
    dueDate,
    description,
    notionLink,
  });

  // Send email notification asynchronously and catch any errors to prevent blocking the response
  if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
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
          <p><strong>Due Date:</strong> ${dueDate}</p>
          <p><strong>Description:</strong> ${description}</p>
          <p>
            <a href="${notionLink}">
              Open Notion Task
            </a>
          </p>
        `,
      });
    } catch (emailError) {
      console.error("Nodemailer failed to send email, but task was created successfully:", emailError);
    }
  } else {
    console.warn("EMAIL_USER or EMAIL_PASS not configured in env variables. Skipping email notification.");
  }

  return NextResponse.json({
    success: true,
    message: "Task Created Successfully",
    task,
  });
}