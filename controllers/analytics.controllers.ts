import catchAsyncError from "../middleware/catchAsyncErrors";
import { Request, Response, NextFunction } from "express";
import ErrorHandler from "../utils/ErrorHandler";
import { generateLast12MonthsData } from "../utils/analytics.generator";
import User from "../models/User";
import Order from "../models/Order";
import Course from "../models/Course";
import { IUser } from "../models/User";

//get analytics for users --- only for admin
export const getUsersAnalytics = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const users = await User.find({});
      const analytics = await generateLast12MonthsData(users);
      res.status(200).json({
        success: true,
        analytics,
      });
    } catch (err: any) {
      return next(new ErrorHandler(500, err.message));
    }
  }
);

//get orders ---- only for admin (all orders ) or instructor (certain orders)
export const getOrdersAnalytics = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      let orders = [];
      if (req.user?.role === "admin") orders = await Order.find({});
      else orders = await Order.find({ instructorId: req.user?._id });
      if (!orders) return next(new ErrorHandler(400, "No orders are found"));
      const analytics = await generateLast12MonthsData(orders);
      res.status(200).json({
        success: true,
        analytics,
      });
    } catch (err: any) {
      return next(new ErrorHandler(500, err.message));
    }
  }
);

//get courses ---- only for admin (all courses ) or instructor (certain courses)
export const getCoursesAnalytics = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      let courses = [];
      if (req.user?.role === "admin") courses = await Course.find({});
      else courses = await Course.find({ instructor: req.user?._id });
      console.log(courses);
      if (!courses) return next(new ErrorHandler(400, "No courses are found"));
      const analytics = await generateLast12MonthsData(courses);
      res.status(200).json({
        success: true,
        analytics,
      });
    } catch (err: any) {
      return next(new ErrorHandler(500, err.message));
    }
  }
);
