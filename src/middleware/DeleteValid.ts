import { Request, Response, NextFunction } from "express";
import {
  RoleList,
  RoleProfile,
  Schedule,
  ScheduleItem,
  ScheduleItemPacking,
} from "../models";

// const deleSchedulePackingList = async (doc:string):Promise<void> => {
//   await ScheduleItemPacking.deleteMany({
//     "schedule.name": doc,
//   });
//   const checkDoc = await ScheduleItem.countDocuments({ "schedule.name": doc });
//   if (checkDoc === 0) {
//     return true;
//   }
//   return false;
// }

const deleteScheduleItem = async (doc: string): Promise<boolean> => {
  await ScheduleItem.deleteMany({
    "schedule.name": doc,
  });
  const checkDoc = await ScheduleItem.countDocuments({ "schedule.name": doc });
  if (checkDoc === 0) {
    return true;
  }
  return false;
};

const deleteRoleList = async (doc: string): Promise<boolean> => {
  await RoleList.deleteMany({
    _id: doc,
  });
  const checkDoc = await RoleList.countDocuments({ _id: doc });
  if (checkDoc === 0) {
    return true;
  }
  return false;
};

export const DeleteValid = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<any> => {
  const path = req.path.replace(/\//g, "");
  try {
    switch (req.baseUrl) {
      case "/users":
        //check schedule
        const userschedule = await Schedule.findOne({ user: path }).count();
        if (userschedule > 0) {
          return res.status(400).json({
            status: 400,
            msg: `Error, The user is related to ${userschedule} schedule documents`,
          });
        }
        // End

        // ScheduleItem
        const userscheduleItem = await ScheduleItem.findOne({
          checkedBy: path,
        }).count();
        if (userscheduleItem > 0) {
          return res.status(400).json({
            status: 400,
            msg: `Error, The user is related to ${userscheduleItem} scheduleitem documents`,
          });
        }
        //End

        // RoleProfile
        const userRoleProfile = await RoleProfile.findOne({
          user: path,
        }).count();

        if (userRoleProfile > 0) {
          return res.status(400).json({
            status: 400,
            msg: `Error, The user is related to ${userRoleProfile} role profile documents`,
          });
        }
        // End
        next();
        break;

      case "/schedule":
        //check schedule
        const deleteRelasi = await deleteScheduleItem(path);
        if (deleteRelasi) {
          next();
          return;
        }
        return res.status(400).json({
          status: 400,
          msg: `Error, delete!`,
        });

      case "/roleprofile":
        //check schedule
        const roleprofilerolist = await deleteRoleList(path);
        if (roleprofilerolist) {
          next();
          return;
        }
        return res.status(400).json({
          status: 400,
          msg: `Error, delete!`,
        });
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
