import mongoose from "mongoose";

const ScheduleItem = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
    },
    uom: {
      type: String,
      required: true,
    },
    qty: {
      type: Number,
    },
    real: {
      type: Number,
      default: 0,
    },
    checkedBy: {
      type: String,
    },
    scheduleId: {
      type: String,
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

export default mongoose.model("ScheduleItems", ScheduleItem);
