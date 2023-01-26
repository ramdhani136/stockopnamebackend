import mongoose from "mongoose";

const Contact = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    phone: {
      type: Number,
      required: true,
    },
    city: {
      type: String,
    },
    activeMenu: {
      type: String,
    },
    interest: {
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

export default mongoose.model("Contact", Contact);
