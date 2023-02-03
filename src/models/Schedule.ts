import mongoose, { Schema } from "mongoose";

const Schedule = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "Users",
      required: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    dueDate: {
      type: Date,
      require: true,
    },
    workflowState: {
      type: String,
      require: true,
    },
    warehouse: {
      type: String,
      require: true,
    },
    status: {
      type: String,
      required: true,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Schedules", Schedule);
