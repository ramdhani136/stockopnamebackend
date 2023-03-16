import { Request, Response } from "express";
import axios from "axios";
import Redis from "../config/Redis";
import { IStateFilter } from "../Interfaces";
import { FilterQuery } from "../utils";
import IController from "./ControllerInterface";
import { ScheduleItem, ScheduleItemPacking } from "../models";
import { TypeOfState } from "../Interfaces/FilterInterface";

const Db = ScheduleItemPacking;
const RedisName = "scheduleitempacking";

const GetPackingIdErp = async (
  id_packing: string,
  scheduleItem: string
): Promise<any> => {
  const uri = `${process.env.ERP_HOST}/api/resource/Registration%20Packing%20ID/${id_packing}`;
  const headers = {
    Authorization: `${process.env.ERP_TOKEN}`,
  };
  try {
    const result = await axios.get(uri, { headers });
    const getScheduleItem = await ScheduleItem.findById(scheduleItem);
    if (getScheduleItem) {
      if (getScheduleItem.item_code === result.data.data.item) {
        if (result.data.data.is_out !== 0) {
          return {
            status: false,
            msg: "Error, Item not available in warehouse",
          };
        }
        result.data.data.scheduleItem = getScheduleItem.schedule;
        return { data: result.data, status: true };
      }
      return { status: false, msg: "Error, Incorrect item input" };
    }
    return { status: false, msg: "Not found" };
  } catch (error) {
    return { status: false, msg: error };
  }
};

class ScheduleItemPackingController implements IController {
  index = async (req: Request, res: Response): Promise<Response> => {
    const stateFilter: IStateFilter[] = [
      {
        name: "_id",
        operator: ["=", "!=", "like", "notlike"],
        typeOf: TypeOfState.String,
      },
      {
        name: "scheduleItem._id",
        operator: ["=", "!=", "like", "notlike"],
        typeOf: TypeOfState.String,
      },
      {
        name: "scheduleItem.schedule",
        operator: ["=", "!=", "like", "notlike"],
        typeOf: TypeOfState.String,
      },
      {
        name: "id_packing",
        operator: ["=", "!=", "like", "notlike"],
        typeOf: TypeOfState.String,
      },
      {
        name: "item",
        operator: ["=", "!=", "like", "notlike"],
        typeOf: TypeOfState.String,
      },
      {
        name: "item_name",
        operator: ["=", "!=", "like", "notlike"],
        typeOf: TypeOfState.String,
      },
      {
        name: "conversion",
        operator: ["=", "!=", "like", "notlike", ">", "<", ">=", "<="],
        typeOf: TypeOfState.Number,
      },
      {
        name: "actual_qty",
        operator: ["=", "!=", "like", "notlike", ">", "<", ">=", "<="],
        typeOf: TypeOfState.Number,
      },
      {
        name: "stock_uom",
        operator: ["=", "!=", "like", "notlike"],
        typeOf: TypeOfState.String,
      },
      {
        name: "owner",
        operator: ["=", "!=", "like", "notlike"],
        typeOf: TypeOfState.String,
      },
      {
        name: "modified",
        operator: ["=", "!=", "like", "notlike", ">", "<", ">=", "<="],
        typeOf: TypeOfState.Date,
      },
      {
        name: "creation",
        operator: ["=", "!=", "like", "notlike", ">", "<", ">=", "<="],
        typeOf: TypeOfState.Date,
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
            "item",
            "item_name",
            "conversion",
            "actual_qty",
            "stock_uom",
            "scheduleItem",
            "id_packing",
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
    if (!req.body.scheduleItemId) {
      return res
        .status(400)
        .json({ status: 400, msg: "scheduleItemId Required!" });
    }
    if (!req.body.id_packing) {
      return res.status(400).json({ status: 400, msg: "id_packing Required!" });
    }
    const getData = await GetPackingIdErp(
      req.body.id_packing,
      req.body.scheduleItemId
    );

  

    try {
      if (getData.status) {
        let data = getData.data.data;
        data.uniqId = `${data.id_packing}${req.body.scheduleItem}`;
        const result = new Db(data);
        const response = await result.save();
        await Redis.client.set(
          `${RedisName}-${response._id}`,
          JSON.stringify(response),
          {
            EX: 10,
          }
        );
        return res.status(200).json({ status: 200, data: response });
      } else {
        return res.status(404).json({ status: 400, msg: getData.msg });
      }
    } catch (error) {
      return res.status(400).json({ status: 400, msg: error });
    }
  };

  show = async (req: Request, res: Response): Promise<Response> => {
    try {
      const cache = await Redis.client.get(`${RedisName}-${req.params.id}`);
      if (cache) {
        console.log("Cache");
        return res.status(200).json({ status: 200, data: JSON.parse(cache) });
      }
      const result = await Db.findOne({ _id: req.params.id });
      await Redis.client.set(
        `${RedisName}-${req.params.id}`,
        JSON.stringify(result)
      );
      return res.status(200).json({ status: 200, data: result });
    } catch (error) {
      return res.status(404).json({ status: 404, data: error });
    }
  };

  update = async (req: Request, res: Response): Promise<Response> => {
    try {
      if (req.body.actual_qty>=0) {
        const prevData: any = await Db.findOne({ _id: req.params.id });
        if (req.body.actual_qty > prevData.conversion) {
          return res.status(400).json({
            status: 400,
            msg: "Actual Qty tidak dapat melebihi conversion!",
          });
        }
        if (req.body.actual_qty == prevData.conversion) {
          req.body.status = 1;
        } else {
          req.body.status = 0;
        }
      }

      const result = await Db.updateOne({ _id: req.params.id }, req.body);
      const getData = await Db.findOne({ _id: req.params.id });
      await Redis.client.set(
        `${RedisName}-${req.params.id}`,
        JSON.stringify(getData)
      );
      return res.status(200).json({ status: 200, data: result });
    } catch (error: any) {
      return res.status(404).json({ status: 404, msg: error });
    }
  };

  delete = async (req: Request, res: Response): Promise<Response> => {
    try {
      await Db.deleteMany({
        scheduleId: req.params.id,
      });

      const result = await Db.deleteOne({ _id: req.params.id });
      await Redis.client.del(`${RedisName}-${req.params.id}`);
      return res.status(200).json({ status: 200, data: result });
    } catch (error) {
      return res.status(404).json({ status: 404, data: error });
    }
  };
}

export default new ScheduleItemPackingController();
