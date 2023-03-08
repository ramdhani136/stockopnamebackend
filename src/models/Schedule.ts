import mongoose, { Schema } from "mongoose";

const Schedule = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: "Users",
      required: true,
      index: true,
    },
    startDate: {
      type: Date,
      required: true,
      index: true,
    },
    dueDate: {
      type: Date,
      require: true,
      index: true,
    },
    workflowState: {
      type: String,
      require: true,
      index: true,
      default: "Draft",
    },
    warehouse: {
      type: String,
      require: true,
      index: true,
    },
    note: {
      type: String,
    },
    status: {
      type: String,
      required: true,
      index: true,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Schedules", Schedule);
