import mongoose, { Schema } from "mongoose";

const ChatModel = new mongoose.Schema(
  {
    chatName: { type: String, trim: true },
    isGroupChat: { type: Boolean, default: false },
    users: [
      {
        type: Schema.Types.ObjectId,
        ref: "Users",
        required: true,
      },
    ],
    latesMessage: {
      type: Schema.Types.ObjectId,
      ref: "Message",
      required: true,
    },
    groupAdmin: {
      type: Schema.Types.ObjectId,
      ref: "Users",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Chat", ChatModel);
