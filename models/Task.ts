import mongoose from "mongoose";

const TaskSchema = new mongoose.Schema(
  {
    taskName: String,
    email: String,
    dueDate: String,
    description: String,
    notionLink: String,
    status: {
  type: String,
  default: "Pending",
},
  },
  { timestamps: true }
);

export default mongoose.models.Task ||
  mongoose.model("Task", TaskSchema);