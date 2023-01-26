import { Request, Response } from "express";
import { io, send } from "../index";
import User from "../models/User";
import IController from "./ControllerInterface";
const bcrypt = require("bcrypt");

class UserController implements IController {
  index = async (req: Request, res: Response): Promise<Response> => {
    // io.emit("coba", "ubah tiga");
    // send.wa.client.destroy();
    // send.wa.client.initialize();
    try {
      const users = await User.find();
      return res.status(200).json({ status: 200, data: users });
    } catch (error) {
      return res.status(400).json({ status: 400, data: error });
    }
  };

  create = async (req: Request, res: Response): Promise<Response> => {
    if(!req.body.password){
      return  res.status(400).json({ status: 400, msg:"Password Required!" });
    }
    if(!req.body.name){
      return  res.status(400).json({ status: 400, msg:"Name Required!" });
    }
    if(!req.body.username){
      return  res.status(400).json({ status: 400, msg:"Username Required!" });
    }

    const salt = await bcrypt.genSalt();
    req.body.password = await bcrypt.hash(req.body.password, salt);
    const user = new User(req.body);
    try {
      const users = await user.save();
      return res.status(200).json({ status: 200, data: users });
    } catch (error) {
      return res.status(400).json({ status: 400, data: error });
    }
  };

  show = async (req: Request, res: Response): Promise<Response> => {
    try {
      const users = await User.findOne({ _id: req.params.id });
      return res.status(200).json({ status: 200, data: users });
    } catch (error) {
      return res.status(404).json({ status: 404, data: error });
    }
  };
  update(req: Request, res: Response): Response {
    return res.send("update");
  }
  delete = async (req: Request, res: Response): Promise<Response> => {
    try {
      const users = await User.deleteOne({ _id: req.params.id });
      return res.status(200).json({ status: 200, data: users });
    } catch (error) {
      return res.status(404).json({ status: 404, data: error });
    }
  };
}

export default new UserController();
