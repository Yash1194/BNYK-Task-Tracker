import { NextResponse } from "next/server";
import { connectDB } from "../../../lib/mongodb";
import Task from "../../../models/Task";

export async function GET() {
  await connectDB();

  const tasks = await Task.find().sort({
    createdAt: -1,
  });

  return NextResponse.json(tasks);
}