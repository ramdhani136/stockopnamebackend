import { Request, Response } from "express";
import Redis from "../config/Redis";
import { IStateFilter } from "../Interfaces";
import Schedule from "../models/Schedule";
import { FilterQuery } from "../utils";
import IController from "./ControllerInterface";

class ScheduleController implements IController {
  index = async (req: Request, res: Response): Promise<Response> => {
    const stateFilter: IStateFilter[] = [
      {
        name: "name",
        operator: ["=", "!=", "like", "notlike"],
        targetdata: "schedule",
      },
      {
        name: "workflowState",
        operator: ["=", "!=", "like", "notlike"],
        targetdata: "workflow",
      },
      {
        name: "createdBy",
        operator: ["=", "!=", "like", "notlike"],
        targetdata: "user",
      },
      {
        name: "status",
        operator: ["=", "!=", "like", "notlike"],
        targetdata: "schedule",
      },
      {
        name: "startDate",
        operator: ["=", "!=", "like", "notlike", ">", "<", ">=", "<="],
        targetdata: "schedule",
      },
      {
        name: "dueDate",
        operator: ["=", "!=", "like", "notlike", ">", "<", ">=", "<="],
        targetdata: "schedule",
      },
      {
        name: "updatedAt",
        operator: ["=", "!=", "like", "notlike", ">", "<", ">=", "<="],
        targetdata: "schedule",
      },
      {
        name: "createdAt",
        operator: ["=", "!=", "like", "notlike", ">", "<", ">=", "<="],
        targetdata: "schedule",
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

      const getAll = await Schedule.find(isFilter.data).count();
      const result = await Schedule.find(isFilter.data, setField)
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
    if (!req.body.name) {
      return res.status(400).json({ status: 400, msg: "Name Required!" });
    }
    if (!req.body.startDate) {
      return res.status(400).json({ status: 400, msg: "StartDate Required!" });
    }
    if (!req.body.dueDate) {
      return res.status(400).json({ status: 400, msg: "DueDate Required!" });
    }
    if (!req.body.workflowState) {
      return res.status(400).json({ status: 400, msg: "WorkflowState Required!" });
    }
    if (!req.body.createdBy) {
      return res.status(400).json({ status: 400, msg: "CratedBy Required!" });
    }
    try {
      const result = new Schedule(req.body);
      const response = await result.save();
      await Redis.client.set(`schedule-${response._id}`, JSON.stringify(response), {
        EX: 10,
      });
      return res.status(200).json({ status: 200, data: response });
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
      const result = await Schedule.findOne({ _id: req.params.id });
      await Redis.client.set(`user-${req.params.id}`, JSON.stringify(result));
      // await Redis.client.set(`user-${req.params.id}`, JSON.stringify(users), {
      //   EX: 10,
      // });
      return res.status(200).json({ status: 200, data: result });
    } catch (error) {
      return res.status(404).json({ status: 404, data: error });
    }
  };

  update = async (req: Request, res: Response): Promise<Response> => {
    try {
      const result = await Schedule.updateOne({ _id: req.params.id }, req.body);
      const getData = await Schedule.findOne({ _id: req.params.id });
      await Redis.client.set(`schedule-${req.params.id}`, JSON.stringify(getData));
      return res.status(200).json({ status: 200, data: result });
    } catch (error: any) {
      return res.status(404).json({ status: 404, data: error });
    }
  };

  delete = async (req: Request, res: Response): Promise<Response> => {
    try {
      const result = await Schedule.deleteOne({ _id: req.params.id });
      await Redis.client.del(`schedule-${req.params.id}`);
      return res.status(200).json({ status: 200, data: result });
    } catch (error) {
      return res.status(404).json({ status: 404, data: error });
    }
  };
}

export default new ScheduleController();
