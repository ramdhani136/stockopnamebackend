import { Request, Response } from "express";
import User from "../models/User";
import IController from "./ControllerInterface";
import { IStateFilter } from "./FilterInterface";
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

      // Fungsi set field yang ditampilkan
      let setField: any = {};
      for (const field of fields) {
        if (field != "password") {
          setField[field] = 1;
        }
      }

      // Mengeset semua filter
      let allFilter: any[] = [];
      let unicFilter: any[] = [];
      if (filters.length > 0) {
        for (const filter of filters) {
          let validFilter = stateFilter.filter((item) => {
            // Cek apakah operator valid
            let validOperator: any = item.operator.filter(
              (i: any) => i == filter[1]
            );
            // End
            return item.name === filter[0] && validOperator.length !== 0;
          });
          // Cek validasi filter tersedia
          if (validFilter.length === 0) {
            return res
              .status(400)
              .json({ status: 400, msg: "Error, invalid filters" });
          }
          // End
          let field: any = {};
          let child: any = {};

          switch (filter[1]) {
            case "like":
              child.$regex = filter[2];
              child.$options = "i";
              break;
            case "=":
              child.$eq = `${filter[2]}`;
              break;
            case "!=":
              child.$ne = `${filter[2]}`;
              break;
            case ">":
              child.$gt = filter[2];
              break;
            case ">=":
              child.$gte = filter[2];
              break;
            case "<":
              child.$lt = filter[2];
              break;
            case "<=":
              child.$lte = filter[2];
              break;
          }

          if (Object.keys(child).length) {
            field[filter[0]] = child;
          }
          let isDuplicate = allFilter.filter(
            (item) => Object.keys(item)[0] == filter[0]
          );
          allFilter.push(field);
          if (isDuplicate.length === 0) {
            unicFilter.push(filter[0]);
          }
        }
      }

      let finalFilter: any = [];
      for (const item of unicFilter) {
        let ismerge = allFilter.filter((all) => Object.keys(all)[0] === item);
        let simpan;
        if (ismerge.length > 1) {
          simpan = { $or: ismerge };
        } else {
          simpan = ismerge[0];
        }
        finalFilter.push(simpan);
      }

      let filterData: any =
        Object.keys(finalFilter).length > 0
          ? {
              $and: finalFilter,
            }
          : {};

      const getAll = await User.find(filterData).count();
      const users = await User.find(filterData, setField)
        .limit(limit)
        .sort(order_by);

      return res.status(200).json({
        status: 200,
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
      return res.status(200).json({ status: 200, data: users });
    } catch (error) {
      return res.status(400).json({ status: 400, data: error });
    }
  };

  show = async (req: Request, res: Response): Promise<Response> => {
    try {
      const users = await User.findOne({ _id: req.params.id });
      return res.status(200).json({ status: 200, data: users });
    } catch (error) {
      return res.status(404).json({ status: 404, data: error });
    }
  };

  update = async (req: Request, res: Response): Promise<Response> => {
    try {
      const users = await User.updateOne({ _id: req.params.id }, req.body);
      return res.status(200).json({ status: 200, data: users });
    } catch (error: any) {
      return res.status(404).json({ status: 404, data: error });
    }
  };

  delete = async (req: Request, res: Response): Promise<Response> => {
    try {
      const users = await User.deleteOne({ _id: req.params.id });
      return res.status(200).json({ status: 200, data: users });
    } catch (error) {
      return res.status(404).json({ status: 404, data: error });
    }
  };
}

export default new UserController();
