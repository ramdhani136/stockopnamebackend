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

class PackingIdController {
  index = async (req: Request, res: Response): Promise<any> => {
    const stateFilter: IStateFilter[] = [
      {
        name: "owner",
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
        name: "KG",
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
      //   const filters: any = req.query.filters
      //     ? JSON.parse(`${req.query.filters}`)
      //     : [];
      //   const fields: any = req.query.fields
      //     ? JSON.parse(`${req.query.fields}`)
      //     : ["name", "user.name"];
      //   const order_by: any = req.query.order_by
      //     ? JSON.parse(`${req.query.order_by}`)
      //     : { updatedAt: -1 };
        const limit: number | string = parseInt(`${req.query.limit}`) || 10;
      //   let page: number | string = parseInt(`${req.query.page}`) || 1;
      //   let setField = FilterQuery.getField(fields);
      //   let isFilter = FilterQuery.getFilter(filters, stateFilter);

      //   if (!isFilter.status) {
      //     return res
      //       .status(400)
      //       .json({ status: 400, msg: "Error, Filter Invalid " });
      //   }
      // End
      const uri = `${process.env.ERP_HOST}/api/resource/Registration%20Packing%20ID?fields=["item_name","qr_code","purchase_receipt","item","conversion","stock_uom","is_out_name","id_packing"]&&filters=[["is_out","=","0"]]`;
      const headers = {
        Authorization: `${process.env.ERP_TOKEN}`,
      };
      // const getAll = await Db.find(isFilter.data).count();
      const result = await axios.get(uri, { headers });

      return res.status(200).json({
        // status: 200,
        // total: getAll,
        limit,
        // nextPage: page + 1,
        // hasMore: getAll > page * limit ? true : false,
        data: result.data.data,
        filters: stateFilter,
      });
    } catch (error: any) {
      return res.status(400).json({
        status: 400,
        msg: error,
      });
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
}

export default new PackingIdController();
