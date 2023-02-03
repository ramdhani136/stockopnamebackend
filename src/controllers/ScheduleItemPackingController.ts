import { Request, Response } from "express";
import axios from "axios";
import Redis from "../config/Redis";
import { IStateFilter } from "../Interfaces";
import { FilterQuery } from "../utils";
import IController from "./ControllerInterface";
import { ScheduleItemPacking } from "../models";

const Db = ScheduleItemPacking;
const RedisName = "scheduleitempacking";

const GetPackingIdErp = async (id_packing: string): Promise<any> => {
  const uri = `${process.env.ERP_HOST}/api/resource/Registration%20Packing%20ID/${id_packing}`;
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

class ScheduleItemPackingController implements IController {
  index = async (req: Request, res: Response): Promise<Response> => {
    const stateFilter: IStateFilter[] = [
      {
        name: "_id",
        operator: ["=", "!=", "like", "notlike"],
      },
      {
        name: "id_packing",
        operator: ["=", "!=", "like", "notlike"],
      },
      {
        name: "scheduleItemId",
        operator: ["=", "!=", "like", "notlike"],
      },
      {
        name: "item",
        operator: ["=", "!=", "like", "notlike"],
      },
      {
        name: "item_name",
        operator: ["=", "!=", "like", "notlike"],
      },
      {
        name: "conversion",
        operator: ["=", "!=", "like", "notlike", ">", "<", ">=", "<="],
      },
      {
        name: "actual_qty",
        operator: ["=", "!=", "like", "notlike", ">", "<", ">=", "<="],
      },
      {
        name: "stock_uom",
        operator: ["=", "!=", "like", "notlike"],
      },
      {
        name: "owner",
        operator: ["=", "!=", "like", "notlike"],
      },
      {
        name: "modified",
        operator: ["=", "!=", "like", "notlike", ">", "<", ">=", "<="],
      },
      {
        name: "creation",
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
        : ["item", "item_name", "conversion", "actual_qty", "stock_uom"];
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
    try {
      const getData = await GetPackingIdErp(req.body.id_packing);
      if (getData.status) {
        let data = getData.data.data;
        data._id = `${data.id_packing}${req.body.scheduleItemId}`;
        data.scheduleItemId = req.body.scheduleItemId;
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
        return res.status(404).json({ status: 400, msg: "Not found data!" });
      }
    } catch (error) {
      return res.status(400).json({ status: 400, msg: error });
    }
    // if (!req.body._id) {
    //   return res.status(400).json({ status: 400, msg: "_id Required!" });
    // }
    // if (!req.body.scheduleItemId) {
    //   return res
    //     .status(400)
    //     .json({ status: 400, msg: "scheduleItemId Required!" });
    // }
    // if (!req.body.owner) {
    //   return res.status(400).json({ status: 400, msg: "owner Required!" });
    // }
    // if (!req.body.id_packing) {
    //   return res.status(400).json({ status: 400, msg: "id_packing Required!" });
    // }
    // if (!req.body.creation) {
    //   return res.status(400).json({ status: 400, msg: "creation Required!" });
    // }
    // if (!req.body.modified) {
    //   return res.status(400).json({ status: 400, msg: "modified Required!" });
    // }
    // if (!req.body.item) {
    //   return res.status(400).json({ status: 400, msg: "item Required!" });
    // }
    // if (!req.body.item_name) {
    //   return res.status(400).json({ status: 400, msg: "item_name Required!" });
    // }
    // if (!req.body.conversion) {
    //   return res.status(400).json({ status: 400, msg: "cratedBy Required!" });
    // }
    // if (!req.body.stock_uom) {
    //   return res.status(400).json({ status: 400, msg: "stock_uom Required!" });
    // }
    // try {
    //   const result = new Db(req.body);
    //   const response = await result.save();
    //   await Redis.client.set(
    //     `${RedisName}-${response._id}`,
    //     JSON.stringify(response),
    //     {
    //       EX: 10,
    //     }
    //   );

    //   return res.status(200).json({ status: 200, data: response });
    // } catch (error) {
    //   return res.status(400).json({ status: 400, data: error });
    // }
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
      if (req.body.actual_qty) {
        const prevData: any = await Db.findOne({ _id: req.params.id });
        if (req.body.actual_qty > prevData.conversion) {
          return res.status(400).json({
            status: 400,
            msg: "Actual Qty tidak dapat melebihi conversion!",
          });
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
