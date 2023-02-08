import { Request, Response } from "express";
import Redis from "../config/Redis";
import { IStateFilter } from "../Interfaces";
import { TypeOfState } from "../Interfaces/FilterInterface";
import User from "../models/User";
import { FilterQuery } from "../utils";
import IController from "./ControllerInterface";
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

class UserController implements IController {
  index = async (req: Request, res: Response): Promise<Response> => {
    const stateFilter: IStateFilter[] = [
      {
        name: "name",
        operator: ["=", "!=", "like", "notlike"],
        typeOf: TypeOfState.String,
      },
      {
        name: "username",
        operator: ["=", "!=", "like", "notlike"],
        typeOf: TypeOfState.String,
      },
      {
        name: "email",
        operator: ["=", "!=", "like", "notlike"],
        typeOf: TypeOfState.String,
      },
      {
        name: "status",
        operator: ["=", "!=", "like", "notlike"],
        typeOf: TypeOfState.String,
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

      const getAll = await User.find(isFilter.data).count();
      const users = await User.find(isFilter.data, setField)
        .skip(page * limit - limit)
        .limit(limit)
        .sort(order_by);

      if (users.length > 0) {
        return res.status(200).json({
          status: 200,
          total: getAll,
          limit,
          nextPage: page + 1,
          hasMore: getAll >= page * limit ? true : false,
          data: users,
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
    req.body.username = req.body.username.toLowerCase();
    req.body.password = await bcrypt.hash(req.body.password, salt);
    try {
      const user = new User(req.body);
      const users = await user.save();
      await Redis.client.set(`user-${users._id}`, JSON.stringify(users), {
        EX: 10,
      });
      return res.status(200).json({ status: 200, data: users });
    } catch (error) {
      return res.status(400).json({ status: 400, data: error });
    }
  };

  show = async (req: Request, res: Response): Promise<Response> => {
    try {
      const cache = await Redis.client.get(`user-${req.params.id}`);
      if (cache) {
        console.log("Cache");
        return res.status(200).json({ status: 200, data: JSON.parse(cache) });
      }
      const users = await User.findOne({ _id: req.params.id });
      await Redis.client.set(`user-${req.params.id}`, JSON.stringify(users));
      // await Redis.client.set(`user-${req.params.id}`, JSON.stringify(users), {
      //   EX: 10,
      // });
      return res.status(200).json({ status: 200, data: users });
    } catch (error) {
      return res.status(404).json({ status: 404, data: error });
    }
  };

  update = async (req: Request, res: Response): Promise<Response> => {
    try {
      const result = await User.updateOne({ _id: req.params.id }, req.body);
      const users = await User.findOne({ _id: req.params.id });
      await Redis.client.set(`user-${req.params.id}`, JSON.stringify(users));
      return res.status(200).json({ status: 200, data: result });
    } catch (error: any) {
      return res.status(404).json({ status: 404, data: error });
    }
  };

  delete = async (req: Request, res: Response): Promise<Response> => {
    try {
      const users = await User.deleteOne({ _id: req.params.id });
      await Redis.client.del(`user-${req.params.id}`);
      return res.status(200).json({ status: 200, data: users });
    } catch (error) {
      return res.status(404).json({ status: 404, data: error });
    }
  };

  login = async (req: Request, res: Response): Promise<Response> => {
    if (!req.body.username) {
      return res.status(400).json({ status: 400, msg: "Username Required!" });
    }
    if (!req.body.password) {
      return res.status(400).json({ status: 400, msg: "Password Required!" });
    }
    try {
      const result: any = await User.findOne({
        $and: [{ username: req.body.username.toLowerCase() }],
      });
      if (!result) {
        return res.status(400).json({ status: 400, msg: "User not found" });
      }
      const match = await bcrypt.compare(req.body.password, result.password);
      if (!match) {
        return res.status(400).json({ status: 400, msg: "Wrong password" });
      }
      const accessToken = jwt.sign(
        {
          _id: result.id,
          name: result.name,
          username: result.username,
          status: result.status,
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
          expiresIn: "15s",
        }
      );
      const refreshToken = jwt.sign(
        {
          _id: result.id,
          name: result.name,
          username: result.username,
          status: result.status,
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
          expiresIn: "1d",
        }
      );

      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        maxAge: 20 * 60 * 60 * 1000,
        // secure:true
      });
      return res.status(200).json({ status: 200, token: accessToken });
    } catch (error) {
      return res
        .status(400)
        .json({ status: 400, msg: error ?? "Error, Connection" });
    }
  };

  logout = async (req: Request, res: Response): Promise<Response> => {
    try {
      res.clearCookie("refreshToken");
      return res.status(200).json({ status: 200, msg: "Logout success!" });
    } catch (error) {
      return res
        .status(400)
        .json({ status: 400, msg: error ?? "Error, Connection" });
    }
  };

  refreshToken = async (req: Request, res: Response): Promise<Response> => {
    try {
      const refreshToken = req.cookies.refreshToken;
      if (!refreshToken) {
        return res.status(401).json({
          status: 401,
          msg: "Unauthorized",
        });
      }

      return res.send("dd");
    } catch (error) {
      return res
        .status(400)
        .json({ status: 400, msg: error ?? "Error, Connection" });
    }
  };
}

export default new UserController();
