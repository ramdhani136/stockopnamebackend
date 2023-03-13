import { Request, Response } from "express";
import Redis from "../config/Redis";
import { IStateFilter } from "../Interfaces";
import { FilterQuery } from "../utils";
import IController from "./ControllerInterface";
import { TypeOfState } from "../Interfaces/FilterInterface";
import { WorkflowAction } from "../models";
import axios from "axios";

const Db = WorkflowAction;
const redisName = "workflowaction";

class WarehouseController implements IController {
  index = async (req: Request, res: Response): Promise<any> => {
    // const stateFilter: IStateFilter[] = [
    //   {
    //     name: "_id",
    //     operator: ["=", "!=", "like", "notlike"],
    //     typeOf: TypeOfState.String,
    //   },
    //   {
    //     name: "name",
    //     operator: ["=", "!=", "like", "notlike"],
    //     typeOf: TypeOfState.String,
    //   },
    //   {
    //     name: "user.name",
    //     operator: ["=", "!=", "like", "notlike"],
    //     typeOf: TypeOfState.String,
    //   },
    //   {
    //     name: "updatedAt",
    //     operator: ["=", "!=", "like", "notlike", ">", "<", ">=", "<="],
    //     typeOf: TypeOfState.Date,
    //   },
    //   {
    //     name: "createdAt",
    //     operator: ["=", "!=", "like", "notlike", ">", "<", ">=", "<="],
    //     typeOf: TypeOfState.Date,
    //   },
    // ];
    try {
    //   const filters: any = req.query.filters
    //     ? JSON.parse(`${req.query.filters}`)
    //     : [];
    //   const fields: any = req.query.fields
    //     ? JSON.parse(`${req.query.fields}`)
    //     : ["name", "user.name"];
    //   const order_by: any = req.query.order_by
    //     ? JSON.parse(`${req.query.order_by}`)
    //     : { updatedAt: -1 };
    //   const limit: number | string = parseInt(`${req.query.limit}`) || 10;
    //   let page: number | string = parseInt(`${req.query.page}`) || 1;
    //   let setField = FilterQuery.getField(fields);
    //   let isFilter = FilterQuery.getFilter(filters, stateFilter);

    //   if (!isFilter.status) {
    //     return res
    //       .status(400)
    //       .json({ status: 400, msg: "Error, Filter Invalid " });
    //   }
      // End
      const uri = `${process.env.ERP_HOST}/api/resource/Warehouse`;
      const headers = {
        Authorization: `${process.env.ERP_TOKEN}`,
      };
      // const getAll = await Db.find(isFilter.data).count();
      const result = await axios.get(uri, { headers });

      return res.status(200).json({
        // status: 200,
        // total: getAll,
        // limit,
        // nextPage: page + 1,
        // hasMore: getAll > page * limit ? true : false,
        data: result.data.data,
        // filters: stateFilter,
      });
    } catch (error: any) {
      return res.status(400).json({
        status: 400,
        msg: error,
      });
    }
  };

  create = async (req: Request | any, res: Response): Promise<Response> => {
    if (!req.body.name) {
      return res.status(400).json({ status: 400, msg: "Name Required!" });
    }
    req.body.user = req.userId;
    try {
      const result = new Db(req.body);
      const response = await result.save();
      return res.status(200).json({ status: 200, data: response });
    } catch (error) {
      return res.status(400).json({ status: 400, data: error });
    }
  };

  show = async (req: Request, res: Response): Promise<Response> => {
    try {
      const cache = await Redis.client.get(`${redisName}-${req.params.id}`);
      if (cache) {
        console.log("Cache");
        return res.status(200).json({ status: 200, data: JSON.parse(cache) });
      }
      const result = await Db.findOne({ _id: req.params.id }).populate(
        "user",
        "name"
      );
      await Redis.client.set(
        `${redisName}-${req.params.id}`,
        JSON.stringify(result)
      );
      return res.status(200).json({ status: 200, data: result });
    } catch (error) {
      return res.status(404).json({ status: 404, data: error });
    }
  };

  update = async (req: Request, res: Response): Promise<Response> => {
    try {
      const result = await Db.updateOne({ name: req.params.id }, req.body);
      const getData = await Db.findOne({ name: req.params.id });
      await Redis.client.set(
        `${redisName}-${req.params.id}`,
        JSON.stringify(getData)
      );
      return res.status(200).json({ status: 200, data: result });
    } catch (error: any) {
      return res.status(404).json({ status: 404, data: error });
    }
  };

  delete = async (req: Request, res: Response): Promise<Response> => {
    try {
      const getData: any = await Db.findOne({ _id: req.params.id });

      if (!getData) {
        return res.status(404).json({ status: 404, msg: "Not found!" });
      }

      const result = await Db.deleteOne({ _id: req.params.id });
      await Redis.client.del(`${redisName}-${req.params.id}`);
      return res.status(200).json({ status: 200, data: result });
    } catch (error) {
      return res.status(404).json({ status: 404, msg: error });
    }
  };
}

export default new WarehouseController();
