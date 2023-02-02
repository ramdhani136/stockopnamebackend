import mongoose from "mongoose";

const ScheduleItem = new mongoose.Schema(
  {
    _id: {
      type: String,
      required: true,
      unique: true,
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
    scheduleId: {
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

export default mongoose.model("ScheduleItems", ScheduleItem);
