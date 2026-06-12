import mongoose, { Schema } from "mongoose";

const TaskSchema = new Schema(
  {
    taskName: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true },
    dueDate: { type: String, default: "" },
    description: { type: String, default: "" },
    notionLink: { type: String, default: "" },
    status: {
      type: String,
      enum: ["Pending", "Completed"],
      default: "Pending",
    },
    priority: {
      type: String,
      enum: ["Low", "Medium", "High"],
      default: "Medium",
    },
  },
  { timestamps: true }
);

export default mongoose.models.Task ?? mongoose.model("Task", TaskSchema);