import { NextResponse } from "next/server";
import { connectDB } from "../../../../lib/mongodb";
import Task from "../../../../models/Task";

// DELETE Task
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await connectDB();

  const { id } = await params;

  await Task.findByIdAndDelete(id);

  return NextResponse.json({
    success: true,
  });
}

// Complete Task
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await connectDB();

  const { id } = await params;

  await Task.findByIdAndUpdate(id, {
    status: "Completed",
  });

  return NextResponse.json({
    success: true,
  });
}

// Edit Task
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await connectDB();

  const { id } = await params;

  const body = await request.json();

  await Task.findByIdAndUpdate(id, body);

  return NextResponse.json({
    success: true,
  });
}