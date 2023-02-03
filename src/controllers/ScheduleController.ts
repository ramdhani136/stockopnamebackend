import { Request, Response } from "express";
import axios from "axios";
import Redis from "../config/Redis";
import { IStateFilter } from "../Interfaces";
import Schedule from "../models/Schedule";
import { FilterQuery, PaddyData } from "../utils";
import IController from "./ControllerInterface";
import { ScheduleItem, User } from "../models";

const GetErpBin = async (warehouse: string): Promise<any> => {
  const uri = `${process.env.ERP_HOST}/api/resource/Bin?fields=[%22item_code%22,%22item_name%22,%22warehouse%22,%22actual_qty%22,%22stock_uom%22,%22modified%22,%22kategori_barang%22,%22stocker%22,%22name%22]&&filters=[[%22warehouse%22,%22=%22,%22${warehouse}%22],[%22disabled%22,%22=%22,%220%22]]&&limit=0`;
  const headers = {
    Authorization: "token 517ba90cd805072:c4303a3355cbca4",
  };
  try {
    const result = await axios.get(uri, { headers });
    return { data: result.data, status: true };
  } catch (error) {
    return { data: [], status: false, msg: error };
  }
};

class ScheduleController implements IController {
  index = async (req: Request, res: Response): Promise<Response> => {
    const stateFilter: IStateFilter[] = [
      {
        name: "_id",
        operator: ["=", "!=", "like", "notlike"],
      },
      {
        name: "name",
        operator: ["=", "!=", "like", "notlike"],
      },
      {
        name: "warehouse",
        operator: ["=", "!=", "like", "notlike"],
      },
      {
        name: "workflowState",
        operator: ["=", "!=", "like", "notlike"],
      },
      {
        name: "bin",
        operator: ["=", "!=", "like", "notlike"],
      },
      {
        name: "createdBy",
        operator: ["=", "!=", "like", "notlike"],
      },
      {
        name: "status",
        operator: ["=", "!=", "like", "notlike"],
      },
      {
        name: "startDate",
        operator: ["=", "!=", "like", "notlike", ">", "<", ">=", "<="],
      },
      {
        name: "dueDate",
        operator: ["=", "!=", "like", "notlike", ">", "<", ">=", "<="],
      },
      {
        name: "user.name",
        operator: ["=", "!=", "like", "notlike"],
      },
      {
        name: "updatedAt",
        operator: ["=", "!=", "like", "notlike", ">", "<", ">=", "<="],
      },
      {
        name: "createdAt",
        operator: ["=", "!=", "like", "notlike", ">", "<", ">=", "<="],
      },
    ];
    try {
      // Mengambil query
      const filters: any = req.query.filters
        ? JSON.parse(`${req.query.filters}`)
        : [];
      const fields: any = req.query.fields
        ? JSON.parse(`${req.query.fields}`)
        : [
            "name",
            "startDate",
            "dueDate",
            "workflowState",
            "warehouse",
            "createdBy",
            "status",
            "user.name",
          ];
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
      console.log(JSON.stringify(isFilter.data))
      const getAll = await Schedule.find(isFilter.data).count();
      const result = await Schedule.aggregate([
        {
          $lookup: {
            from: "users",
            localField: "user",
            foreignField: "_id",
            as: "user",
          },
        },
        {
          $unwind: "$user",
        },
        {
          $match: isFilter.data,
        },
        {
          $project: setField,
        },
        {
          $sort: order_by,
        },
        {
          $skip: page * limit - limit,
        },
        {
          $limit: limit,
        },
      ]);

      if (result.length > 0) {
        return res.status(200).json({
          status: 200,
          total: getAll,
          limit,
          nextPage: page + 1,
          hasMore: getAll > page * limit ? true : false,
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
    if (!req.body.startDate) {
      return res.status(400).json({ status: 400, msg: "StartDate Required!" });
    }
    if (!req.body.dueDate) {
      return res.status(400).json({ status: 400, msg: "DueDate Required!" });
    }
    if (!req.body.workflowState) {
      return res
        .status(400)
        .json({ status: 400, msg: "WorkflowState Required!" });
    }
    if (!req.body.user) {
      return res.status(400).json({ status: 400, msg: "userId Required!" });
    }

    try {
      const prevData: any = await Schedule.findOne().sort({ createdAt: -1 });

      const date =
        new Date().getFullYear().toString() +
        PaddyData(new Date().getMonth() + 1, 2).toString();

      if (!prevData) {
        req.body.name = "SCH" + date + PaddyData(1, 3).toString();
      } else {
        let masterNumber = parseInt(
          prevData.name.substr(9, prevData.name.length)
        );
        req.body.name =
          "SCH" + date + PaddyData(masterNumber + 1, 3).toString();
      }

      // cek user tersedia
      await User.find({ _id: req.body.userId }).count();
      // End

      const result = new Schedule(req.body);
      const response = await result.save();
      await Redis.client.set(
        `schedule-${response._id}`,
        JSON.stringify(response),
        {
          EX: 10,
        }
      );
      const scheduleId: any = response._id;
      const warehouse: any = response.warehouse;
      const insertItem = await GetErpBin(warehouse);

      if (!insertItem.status) {
        return res.status(400).json({
          status: 400,
          data: insertItem.msg ?? "Error, Invalid Request",
        });
      }

      if (insertItem.data.data.length > 0) {
        const finalData = insertItem.data.data.map((data: any) => {
          data.schedule = scheduleId;
          data.bin = data.name;
          return { ...data };
        });
        await ScheduleItem.insertMany(finalData);
        return res.status(200).json({ status: 200, data: response });
      }
      return res
        .status(400)
        .json({ status: 404, msg: "Error, failed to delete data" });
    } catch (error) {
      return res.status(400).json({ status: 400, data: error });
    }
  };

  show = async (req: Request, res: Response): Promise<Response> => {
    try {
      const cache = await Redis.client.get(`schedule-${req.params.id}`);
      if (cache) {
        console.log("Cache");
        return res.status(200).json({ status: 200, data: JSON.parse(cache) });
      }
      const result = await Schedule.findOne({ name: req.params.id }).populate(
        "user",
        "name"
      );
      await Redis.client.set(
        `schedule-${req.params.id}`,
        JSON.stringify(result)
      );
      return res.status(200).json({ status: 200, data: result });
    } catch (error) {
      return res.status(404).json({ status: 404, data: error });
    }
  };

  update = async (req: Request, res: Response): Promise<Response> => {
    try {
      const result = await Schedule.updateOne(
        { name: req.params.id },
        req.body
      );
      const getData = await Schedule.findOne({ name: req.params.id });
      await Redis.client.set(
        `schedule-${req.params.id}`,
        JSON.stringify(getData)
      );
      return res.status(200).json({ status: 200, data: result });
    } catch (error: any) {
      return res.status(404).json({ status: 404, data: error });
    }
  };

  delete = async (req: Request, res: Response): Promise<Response> => {
    try {
      const getData: any = await Schedule.findOne({ name: req.params.id });

      if (!getData) {
        return res.status(404).json({ status: 404, msg: "Not found!" });
      }
      await ScheduleItem.deleteMany({
        schedule: getData._id,
      });

      const checkDataItem = await ScheduleItem.findOne({
        schedule: getData._id,
      });

      if (checkDataItem) {
        return res.status(400).json({ status: 400, msg: "Error delete item" });
      }

      const result = await Schedule.deleteOne({ name: req.params.id });
      await Redis.client.del(`schedule-${req.params.id}`);
      return res.status(200).json({ status: 200, data: result });
    } catch (error) {
      return res.status(404).json({ status: 404, msg: error });
    }
  };
}

export default new ScheduleController();
