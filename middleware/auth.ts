import { NextFunction, Response, Request } from "express";
import catchAsyncError from "./catchAsyncErrors";
import ErrorHandler from "../utils/ErrorHandler";
import jwt, { JwtPayload } from "jsonwebtoken";
import User, { IUser } from "../models/User";
import redis from "../utils/redis";
import "../@types/custom";

export const verifyAuthenication = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    const accessToken = req.cookies.access_token as string;

    if (!accessToken) {
      return next(new ErrorHandler(400, "user not logged in"));
    }
    const decoded = jwt.verify(
      accessToken,
      process.env.ACCESS_TOKEN!
    ) as JwtPayload;
    console.log(decoded);
    if (!decoded) {
      return next(
        new ErrorHandler(400, "Please login to access this resource")
      );
    }
    const user = await redis.get(decoded.id);
    if (!user) {
      return next(
        new ErrorHandler(400, "Please login to update this resource")
      );
    }
    req.user = JSON.parse(user) as IUser;
    next();
  }
);

//validate user role

export const validateUser = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!roles.includes(req.user?.role || "")) {
      return next(
        new ErrorHandler(
          400,
          `Role : ${req.user?.role} is not allowed to acess this resource`
        )
      );
    }
    next();
  };
};
