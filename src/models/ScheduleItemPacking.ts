import mongoose from "mongoose";

const ScheduleItemPacking = new mongoose.Schema({
  _id: {
    type: String,
    required: true,
    unique: true,
  },
  id_packing: {
    type: String,
    required: true,
  },
  scheduleItemId: {
    type: String,
    required: true,
  },
  owner: {
    type: String,
    required: true,
  },
  creation: {
    type: Date,
    required: true,
  },
  modified: {
    type: Date,
    required: true,
  },
  item: {
    type: String,
    require: true,
  },
  item_name: {
    type: String,
    require: true,
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
});

export default mongoose.model("ScheduleItemPacking", ScheduleItemPacking);
