import { Request, Response, NextFunction } from "express";

export const AuthMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): any => {
  console.log("pengecekan data disini!");
  next();
};
