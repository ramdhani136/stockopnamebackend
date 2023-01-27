import { Request, Response } from "express";
import Redis from "../config/Redis";
import { IStateFilter } from "../Interfaces";
import User from "../models/User";
import FilterQuery from "../utils/FilterQuery";
import IController from "./ControllerInterface";
const bcrypt = require("bcrypt");

class UserController implements IController {
  index = async (req: Request, res: Response): Promise<Response> => {
    const stateFilter: IStateFilter[] = [
      {
        name: "name",
        operator: ["=", "!=", "like", "notlike"],
        targetdata: "users",
      },
      {
        name: "username",
        operator: ["=", "!=", "like", "notlike"],
        targetdata: "users",
      },
      {
        name: "email",
        operator: ["=", "!=", "like", "notlike"],
        targetdata: "users",
      },
      {
        name: "status",
        operator: ["=", "!=", "like", "notlike"],
        targetdata: "users",
      },
      {
        name: "updatedAt",
        operator: ["=", "!=", "like", "notlike", ">", "<", ">=", "<="],
        targetdata: "users",
      },
      {
        name: "createdAt",
        operator: ["=", "!=", "like", "notlike", ">", "<", ">=", "<="],
        targetdata: "users",
      },
    ];
    try {
      // Mengambil query
      const filters: any = req.query.filters
        ? JSON.parse(`${req.query.filters}`)
        : [];
      const fields: any = req.query.fields
        ? JSON.parse(`${req.query.fields}`)
        : ["name"];
      const order_by: any = req.query.order_by
        ? JSON.parse(`${req.query.order_by}`)
        : { updatedAt: -1 };
      const last_id: number | string = parseInt(`${req.query.lastId}`) || 0;
      const limit: number | string = parseInt(`${req.query.limit}`) || 10;
      const offset: number | string = parseInt(`${req.query.offset}`) || 0;

      // Mengambil hasil fields
      let setField = FilterQuery.getField(fields);
      // End

      // Mengambil hasil filter
      let isFilter = FilterQuery.getFilter(filters, stateFilter);
      // End

      // Validasi apakah filter valid
      if (!isFilter.status) {
        return res
          .status(400)
          .json({ status: 400, msg: "Error, Filter Invalid " });
      }
      // End

      const getAll = await User.find(isFilter.data).count();
      const users = await User.find(isFilter.data, setField)
        .skip(offset)
        .limit(limit)
        .sort(order_by);

      return res.status(200).json({
        status: 200,
        offset,
        hasMore:getAll>=offset*limit?true:false,
        limit,
        last_id,
        total: getAll,
        data: users,
        filters: stateFilter,
      });
    } catch (error: any) {
      return res.status(400).json({
        status: 400,
        msg: Object.keys(error).length > 0 ? error : "Error,Invalid Request",
      });
    }
  };

  create = async (req: Request, res: Response): Promise<Response> => {
    if (!req.body.password) {
      return res.status(400).json({ status: 400, msg: "Password Required!" });
    }
    if (!req.body.name) {
      return res.status(400).json({ status: 400, msg: "Name Required!" });
    }
    if (!req.body.username) {
      return res.status(400).json({ status: 400, msg: "Username Required!" });
    }

    const salt = await bcrypt.genSalt();
    req.body.password = await bcrypt.hash(req.body.password, salt);
    try {
      const user = new User(req.body);
      const users = await user.save();
      await Redis.client.set(`user-${users._id}`, JSON.stringify(users), {
        EX: 10,
      });
      return res.status(200).json({ status: 200, data: users });
    } catch (error) {
      return res.status(400).json({ status: 400, data: error });
    }
  };

  show = async (req: Request, res: Response): Promise<Response> => {
    try {
      const cache = await Redis.client.get(`user-${req.params.id}`);
      if (cache) {
        console.log("Cache");
        return res.status(200).json({ status: 200, data: JSON.parse(cache) });
      }
      const users = await User.findOne({ _id: req.params.id });
      await Redis.client.set(`user-${req.params.id}`, JSON.stringify(users));
      // await Redis.client.set(`user-${req.params.id}`, JSON.stringify(users), {
      //   EX: 10,
      // });
      return res.status(200).json({ status: 200, data: users });
    } catch (error) {
      return res.status(404).json({ status: 404, data: error });
    }
  };

  update = async (req: Request, res: Response): Promise<Response> => {
    try {
      const result = await User.updateOne({ _id: req.params.id }, req.body);
      const users = await User.findOne({ _id: req.params.id });
      await Redis.client.set(`user-${req.params.id}`, JSON.stringify(users));
      return res.status(200).json({ status: 200, data: result });
    } catch (error: any) {
      return res.status(404).json({ status: 404, data: error });
    }
  };

  delete = async (req: Request, res: Response): Promise<Response> => {
    try {
      const users = await User.deleteOne({ _id: req.params.id });
      await Redis.client.del(`user-${req.params.id}`);
      return res.status(200).json({ status: 200, data: users });
    } catch (error) {
      return res.status(404).json({ status: 404, data: error });
    }
  };
}

export default new UserController();
