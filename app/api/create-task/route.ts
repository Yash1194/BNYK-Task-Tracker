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

  await Task.create({
    taskName,
    email,
    dueDate,
    description,
    notionLink,
  });

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

  return NextResponse.json({
    success: true,
    message: "Email Sent Successfully",
  });
}