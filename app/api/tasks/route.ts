import { NextResponse } from "next/server";
import { connectDB } from "../../../lib/mongodb";
import Task from "../../../models/Task";

// Force dynamic so GET is never statically cached
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await connectDB();
    const tasks = await Task.find().sort({ createdAt: -1 });
    return NextResponse.json(tasks);
  } catch (error) {
    console.error("[GET /api/tasks]", error);
    return NextResponse.json(
      {
        error:
          "Failed to fetch tasks. Please verify MONGODB_URI in .env.local.",
      },
      { status: 500 }
    );
  }
}