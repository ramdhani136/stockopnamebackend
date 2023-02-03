import { Request, Response } from "express";
import { IStateFilter } from "../Interfaces";
import { Schedule, ScheduleItem } from "../models";
import { FilterQuery } from "../utils";
import axios from "axios";
const Db = ScheduleItem;

const getBinQty = async (bin: string): Promise<any> => {
  const uri = `${process.env.ERP_HOST}/api/resource/Bin/${bin}`;

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

class ScheduleItemController {
  index = async (req: Request, res: Response): Promise<Response> => {
    const stateFilter: IStateFilter[] = [
      {
        name: "schedule.name",
        operator: ["=", "!=", "like", "notlike"],
      },
      {
        name: "item_code",
        operator: ["=", "!=", "like", "notlike"],
      },
      {
        name: "item_name",
        operator: ["=", "!=", "like", "notlike"],
      },
      {
        name: "kategori_barang",
        operator: ["=", "!=", "like", "notlike"],
        targetdata: "users",
      },
      {
        name: "stocker",
        operator: ["=", "!=", "like", "notlike"],
      },
      {
        name: "warehouse",
        operator: ["=", "!=", "like", "notlike"],
      },
      {
        name: "stock_uom",
        operator: ["=", "!=", "like", "notlike"],
      },
      {
        name: "checkedBy",
        operator: ["=", "!=", "like", "notlike"],
      },
      {
        name: "status",
        operator: ["=", "!=", "like", "notlike"],
      },
      {
        name: "actual_qty",
        operator: ["=", "!=", "like", "notlike", ">", "<", ">=", "<="],
      },
      {
        name: "real_qty",
        operator: ["=", "!=", "like", "notlike", ">", "<", ">=", "<="],
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
            "item_code",
            "item_name",
            "stocker",
            "schedule.name",
            "actual_qty",
            "real_qty",
            "updatedAt",
            "stock_uom",
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
      const getAll = await Db.aggregate([
        {
          $lookup: {
            from: "schedules",
            localField: "schedule",
            foreignField: "_id",
            as: "schedule",
          },
        },
        {
          $match: isFilter.data,
        },
       
      ])

      const result = await Db.aggregate([
        {
          $lookup: {
            from: "schedules",
            localField: "schedule",
            foreignField: "_id",
            as: "schedule",
          },
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
          total: getAll[0].count,
          limit,
          nextPage: page + 1,
          hasMore: getAll[0].count > page * limit ? true : false,
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

  show = async (req: Request, res: Response): Promise<Response> => {
    try {
      const result: any = await Db.findOne({ _id: req.params.id }).populate(
        "schedule",
        "name"
      );
      if (result) {
        let qtyStok = result.actual_qty;
        const schedule: any = await Schedule.findOne({
          _id: result.schedule,
        });
        if (result.status == 0 && schedule.status == 1) {
          const resultErp: any = await getBinQty(result.bin);
          qtyStok = resultErp.data.data.actual_qty;
        }
        result.actual_qty = qtyStok;
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
