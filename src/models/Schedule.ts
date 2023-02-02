import mongoose from "mongoose";

const Schedule = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique:true
    },
    startDate: {
      type: Date,
      required: true,
    },
    dueDate: {
      type: Date,
    },
    workflowState: {
      type: String,
    },
    createdBy: {
      type: String,
    },
    status: {
      type: Boolean,
      required: true,
      default: 1,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Schedules", Schedule);
