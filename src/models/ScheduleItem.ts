import mongoose, { Schema } from "mongoose";

const ScheduleItem = new mongoose.Schema(
  {
    schedule: {
      type: Schema.Types.ObjectId,
      ref: "Schedules",
      required: true,
    },
    bin: {
      type: String,
      required: true,
    },
    item_code: {
      type: String,
      required: true,
    },
    item_name: {
      type: String,
      required: true,
    },
    kategori_barang: {
      type: String,
    },
    stocker: {
      type: String,
      require: true,
    },
    warehouse: {
      type: String,
      required: true,
    },
    stock_uom: {
      type: String,
      required: true,
      default: 0,
    },
    actual_qty: {
      type: Number,
      require: true,
    },
    real_qty: {
      type: Number,
      default: 0,
    },
    checkedBy: {
      type: String,
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

export default mongoose.model("ScheduleItems", ScheduleItem);
