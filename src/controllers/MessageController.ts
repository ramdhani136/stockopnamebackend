import { Request, Response } from "express";
import { ChatModel, User } from "../models";
import MessageModel from "../models/MessageModel";

class MessageController {
  allMessages = async (req: Request | any, res: Response): Promise<any> => {
    try {
      const messages = await MessageModel.find({ chat: req.params.chatId })
        .populate("sender", "name pic email")
        .populate("chat");
      return res.status(200).json({ status: 200, data: messages });
    } catch (error: any) {
      res.status(400);
      throw new Error(error.message);
    }
  };

  sendMessage = async (req: Request | any, res: Response): Promise<any> => {
    const { content, chatId } = req.body;

    if (!content) {
      return res.status(400).json({ status: 400, msg: "content Required!" });
    }

    if (!chatId) {
      return res.status(400).json({ status: 400, msg: "chatId Required!" });
    }

    var newMessage = {
      sender: req.userId,
      content: content,
      chat: chatId,
    };

    try {
      var message: any = await MessageModel.create(newMessage);
      message = await message.populate("sender", "name pic");
      message = await message.populate("chat");
      message = await User.populate(message, {
        path: "chat.users",
        select: "name pic email",
      });

      await ChatModel.findByIdAndUpdate(req.body.chatId, {
        latestMessage: message,
      });

      return res.status(200).json({ status: 200, data: message });
    } catch (error: any) {
      res.status(400);
      throw new Error(error.message);
    }
  };
}

export default new MessageController();
