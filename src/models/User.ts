import mongoose from "mongoose";

const User = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  umur: {
    type: Number,
    required: true,
  },
  alamat: {
    type: String,
    required: true,
  },
  email: {
    type: String,
  },
  password: {
    type: String,
    required: true,
  },
});

export default mongoose.model("Users", User);
