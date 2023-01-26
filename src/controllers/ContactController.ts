import { Request, Response } from "express";
// import { io, send } from "../index";
import Contact from "../models/Contact";
import IController from "./ControllerInterface";

class ContactController implements IController {
  index = async (req: Request, res: Response): Promise<Response> => {
    // io.emit("coba", "ubah tiga");
    // send.wa.client.destroy();
    // send.wa.client.initialize();
    const filters = req.query.filters ? JSON.parse(`${req.query.filters}`) : [];
    console.log(filters);
    try {
      let result: any = await Contact.find();

      return res.status(200).json({ status: 200, data: result, filters });
    } catch (error) {
      return res.status(400).json({ status: 400, data: error });
    }
  };

  create = async (req: Request, res: Response): Promise<Response> => {
    if (!req.body.name) {
      return res.status(400).json({ status: 400, msg: "Name Required!" });
    }
    if (!req.body.phone) {
      return res.status(400).json({ status: 400, msg: "Phone Required!" });
    }

    try {
      const contact = new Contact(req.body);
      const result = await contact.save();
      return res.status(200).json({ status: 200, data: result });
    } catch (error) {
      return res.status(400).json({ status: 400, data: error });
    }
  };

  show = async (req: Request, res: Response): Promise<Response> => {
    try {
      const result = await Contact.findOne({ _id: req.params.id });
      return res.status(200).json({ status: 200, data: result });
    } catch (error) {
      return res.status(404).json({ status: 404, data: error });
    }
  };

  update = async (req: Request, res: Response): Promise<Response> => {
    try {
      const result = await Contact.updateOne({ _id: req.params.id }, req.body);
      return res.status(200).json({ status: 200, data: result });
    } catch (error: any) {
      return res.status(404).json({ status: 404, data: error });
    }
  };

  delete = async (req: Request, res: Response): Promise<Response> => {
    try {
      const result = await Contact.deleteOne({ _id: req.params.id });
      return res.status(200).json({ status: 200, data: result });
    } catch (error) {
      return res.status(404).json({ status: 404, data: error });
    }
  };
}

export default new ContactController();
