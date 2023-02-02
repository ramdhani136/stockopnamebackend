import mongoose from "mongoose";

const Schedule = new mongoose.Schema(
  {
    _id: {
      type: String,
      required: true,
      unique: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    dueDate: {
      type: Date,
      require:true
    },
    workflowState: {
      type: String,
      require:true
    },
    warehouse: {
      type: String,
      require: true,
    },
    createdBy: {
      type: String,
      require:true
    },
    status: {
      type: Boolean,
      required: true,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Schedules", Schedule);
