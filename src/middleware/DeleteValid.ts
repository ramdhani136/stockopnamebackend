import { Request, Response, NextFunction } from "express";
import { Schedule } from "../models";

export const DeleteValid = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<any> => {
  try {
    switch (req.baseUrl) {
      case "/users":
        //check schedule
        const path = req.path.replace(/\//g, "");
        const schedule = await Schedule.findOne({ userId: path }).count();
        if (schedule > 0) {
          return res.status(400).json({
            status: 400,
            msg: `Error, The user is related to ${schedule} schedule documents`,
          });
        }
        //End
        next();
        break;
      //
      default:
        next();
    }
  } catch (error) {
    return res.status(400).json({
      status: 400,
      msg: error,
    });
  }
};
