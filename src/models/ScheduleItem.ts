import mongoose from "mongoose";

const ScheduleItem = new mongoose.Schema(
  {
    itemCode: {
      type: String,
      required: true,
      unique: true,
    },
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
      require:true
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

export default mongoose.model("ScheduleItems", ScheduleItem);
