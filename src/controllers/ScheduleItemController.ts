import { Request, Response } from "express";
import Redis from "../config/Redis";
import { IStateFilter } from "../Interfaces";
import { ScheduleItem } from "../models";
import { FilterQuery } from "../utils";
import IController from "./ControllerInterface";
const bcrypt = require("bcrypt");

const Db = ScheduleItem;
const redisName = "scheduleitem";

class ScheduleItemController implements IController {
  index = async (req: Request, res: Response): Promise<Response> => {
    const stateFilter: IStateFilter[] = [
      {
        name: "_id",
        operator: ["=", "!=", "like", "notlike"],
        targetdata: "users",
      },
      {
        name: "item_code",
        operator: ["=", "!=", "like", "notlike"],
        targetdata: "users",
      },
      {
        name: "item_name",
        operator: ["=", "!=", "like", "notlike"],
        targetdata: "users",
      },
      {
        name: "kategori_barang",
        operator: ["=", "!=", "like", "notlike"],
        targetdata: "users",
      },
      {
        name: "warehouse",
        operator: ["=", "!=", "like", "notlike"],
        targetdata: "users",
      },
      {
        name: "stock_uom",
        operator: ["=", "!=", "like", "notlike"],
        targetdata: "users",
      },
      {
        name: "checkedBy",
        operator: ["=", "!=", "like", "notlike"],
        targetdata: "users",
      },
      {
        name: "scheduleId",
        operator: ["=", "!=", "like", "notlike"],
        targetdata: "users",
      },
      {
        name: "status",
        operator: ["=", "!=", "like", "notlike"],
        targetdata: "users",
      },
      {
        name: "actual_qty",
        operator: ["=", "!=", "like", "notlike", ">", "<", ">=", "<="],
        targetdata: "users",
      },
      {
        name: "real_qty",
        operator: ["=", "!=", "like", "notlike", ">", "<", ">=", "<="],
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
        : ["item_code", "item_name", "scheduleId"];
      const order_by: any = req.query.order_by
        ? JSON.parse(`${req.query.order_by}`)
        : { updatedAt: -1 };
      const limit: number | string = parseInt(`${req.query.limit}`) || 10;
      let page: number | string = parseInt(`${req.query.page}`) || 1;

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

      const getAll = await Db.find(isFilter.data).count();
      const result = await Db.find(isFilter.data, setField)
        .skip(page * limit - limit)
        .limit(limit)
        .sort(order_by);

      if (result.length > 0) {
        return res.status(200).json({
          status: 200,
          total: getAll,
          limit,
          nextPage: page + 1,
          hasMore: getAll >= page * limit ? true : false,
          data: result,
          filters: stateFilter,
        });
      }
      return res.status(400).json({
        status: 404,
        msg: "Data Not found!",
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
      const data = new Db(req.body);
      const result = await data.save();
      // await Redis.client.set(`${redisName}-${result._id}`, JSON.stringify(result), {
      //   EX: 10,
      // });
      return res.status(200).json({ status: 200, data: result });
    } catch (error) {
      return res.status(400).json({ status: 400, data: error });
    }
  };

  show = async (req: Request, res: Response): Promise<Response> => {
    try {
      // const cache = await Redis.client.get(`${redisName}-${req.params.id}`);
      // if (cache) {
      //   console.log("Cache");
      //   return res.status(200).json({ status: 200, data: JSON.parse(cache) });
      // }
      const result: any = await Db.findOne({ _id: req.params.id });
      // await Redis.client.set(`${redisName}-${req.params.id}`, JSON.stringify(users));
      // await Redis.client.set(`user-${req.params.id}`, JSON.stringify(users), {
      //   EX: 10,
      // });
      if (result) {
        return res.status(200).json({ status: 200, data: result });
      }
      return res.status(404).json({ status: 404, msg: "Data Not Found" });
    } catch (error) {
      return res.status(400).json({ status: 400, data: error });
    }
  };

  update = async (req: Request, res: Response): Promise<Response> => {
    try {
      await Db.updateOne({ _id: req.params.id }, req.body);
      const result = await Db.findOne({ _id: req.params.id });
      // await Redis.client.set(`${redisName}-${req.params.id}`, JSON.stringify(result));
      return res.status(200).json({ status: 200, data: result });
    } catch (error: any) {
      return res.status(404).json({ status: 404, data: error });
    }
  };

  delete = async (req: Request, res: Response): Promise<Response> => {
    try {
      const result = await Db.deleteOne({ _id: req.params.id });
      // await Redis.client.del(`${redisName}-${req.params.id}`);
      return res.status(200).json({ status: 200, data: result });
    } catch (error) {
      return res.status(404).json({ status: 404, data: error });
    }
  };
}

export default new ScheduleItemController();
