import mongoose from "mongoose";

const ScheduleItemPacking = new mongoose.Schema(
  {
    scheduleItem: {
      type: Object,
      required: true,
      index: true,
    },
    id_packing: {
      type: String,
      required: true,
      index: true,
    },
    uniqId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    owner: {
      type: String,
      required: true,
    },
    creation: {
      type: Date,
      required: true,
      index: true,
    },
    modified: {
      type: Date,
      required: true,
      index: true,
    },
    item: {
      type: String,
      require: true,
      index: true,
    },
    item_name: {
      type: String,
      require: true,
      index: true,
    },
    conversion: {
      type: Number,
      required: true,
    },
    actual_qty: {
      type: Number,
      default: 0,
    },
    stock_uom: {
      type: String,
      require,
    },
    status: {
      type: String,
      required: true,
      default: 0,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("ScheduleItemPacking", ScheduleItemPacking);
