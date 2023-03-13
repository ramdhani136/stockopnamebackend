import { Request, Response } from "express";
import { IStateFilter } from "../Interfaces";
import { Schedule, ScheduleItem } from "../models";
import { FilterQuery } from "../utils";
import axios from "axios";
import { TypeOfState } from "../Interfaces/FilterInterface";
import { ISearch } from "../utils/FilterQuery";
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
  index = async (req: Request|any, res: Response): Promise<Response> => {
    const stateFilter: IStateFilter[] = [
      {
        name: "schedule._id",
        operator: ["=", "!=", "like", "notlike"],
        typeOf: TypeOfState.String,
      },
      {
        name: "schedule.name",
        operator: ["=", "!=", "like", "notlike"],
        typeOf: TypeOfState.String,
      },
      {
        name: "item_code",
        operator: ["=", "!=", "like", "notlike"],
        typeOf: TypeOfState.String,
      },
      {
        name: "item_name",
        operator: ["=", "!=", "like", "notlike"],
        typeOf: TypeOfState.String,
      },
      {
        name: "kategori_barang",
        operator: ["=", "!=", "like", "notlike"],
        typeOf: TypeOfState.String,
      },
      {
        name: "stocker",
        operator: ["=", "!=", "like", "notlike"],
        typeOf: TypeOfState.String,
      },
      {
        name: "warehouse",
        operator: ["=", "!=", "like", "notlike"],
        typeOf: TypeOfState.String,
      },
      {
        name: "stock_uom",
        operator: ["=", "!=", "like", "notlike"],
        typeOf: TypeOfState.String,
      },
      {
        name: "checkedBy",
        operator: ["=", "!="],
        typeOf: TypeOfState.String,
      },
      {
        name: "status",
        operator: ["=", "!=", "like", "notlike"],
        typeOf: TypeOfState.String,
      },
      {
        name: "actual_qty",
        operator: ["=", "!=", "like", "notlike", ">", "<", ">=", "<="],
        typeOf: TypeOfState.Number,
      },
      {
        name: "real_qty",
        operator: ["=", "!=", "like", "notlike", ">", "<", ">=", "<="],
        typeOf: TypeOfState.Number,
      },
      {
        name: "updatedAt",
        operator: ["=", "!=", "like", "notlike", ">", "<", ">=", "<="],
        typeOf: TypeOfState.Date,
      },
      {
        name: "createdAt",
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
            "item_code",
            "item_name",
            "stocker",
            "schedule.name",
            "schedule._id",
            "actual_qty",
            "real_qty",
            "updatedAt",
            "stock_uom",
            "checkedBy",
          ];
      const order_by: any = req.query.order_by
        ? JSON.parse(`${req.query.order_by}`)
        : { updatedAt: -1 };
      const limit: number | string = parseInt(`${req.query.limit}`) || 0;
      let page: number | string = parseInt(`${req.query.page}`) || 1;

      let search: ISearch = {
        filter: ["item_code", "item_name"],
        value: req.query.search || "",
      };

      // Mengambil hasil fields
      let setField = FilterQuery.getField(fields);
      // End

      // Mengambil hasil filter
      let isFilter = FilterQuery.getFilter(filters, stateFilter, search);
      // End

      // Validasi apakah filter valid
      if (!isFilter.status) {
        return res
          .status(400)
          .json({ status: 400, msg: "Error, Filter Invalid " });
      }
      // End


      const getAll = await Db.find(isFilter.data)
        .populate("checkedBy", "name")
        .count();
      const result = await Db.find(isFilter.data, setField)
        .sort(order_by)
        .populate("checkedBy", "name")
        .skip(limit > 0 ? page * limit - limit : 0)
        .limit(limit > 0 ? limit : getAll)


      if (result.length > 0) {
        return res.status(200).json({
          status: 200,
          total: getAll,
          limit,
          nextPage: getAll > page * limit && limit > 0 ? page + 1 : page,
          hasMore: getAll > page * limit && limit > 0 ? true : false,
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
      const result: any = await Db.findOne({ _id: req.params.id })
        .populate("schedule", "name")
        .populate("checkedBy", "name");
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
