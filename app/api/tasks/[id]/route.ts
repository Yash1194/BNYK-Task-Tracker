import { NextResponse } from "next/server";
import { connectDB } from "../../../../lib/mongodb";
import Task from "../../../../models/Task";

// DELETE a task
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    await Task.findByIdAndDelete(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[DELETE /api/tasks/:id]", error);
    return NextResponse.json({ error: "Failed to delete task" }, { status: 500 });
  }
}

// Mark task as completed
export async function PATCH(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    const updated = await Task.findByIdAndUpdate(
      id,
      { status: "Completed" },
      { new: true }
    );
    if (!updated) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, task: updated });
  } catch (error) {
    console.error("[PATCH /api/tasks/:id]", error);
    return NextResponse.json(
      { error: "Failed to update task status" },
      { status: 500 }
    );
  }
}

// Edit / update a task
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    const body = await request.json();
    const updated = await Task.findByIdAndUpdate(id, body, { new: true });
    if (!updated) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, task: updated });
  } catch (error) {
    console.error("[PUT /api/tasks/:id]", error);
    return NextResponse.json({ error: "Failed to update task" }, { status: 500 });
  }
}