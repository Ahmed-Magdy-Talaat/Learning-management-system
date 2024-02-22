import { Response, NextFunction } from "express";
import catchAsyncError from "../middleware/catchAsyncErrors";
import Course from "../models/Course";
import ErrorHandler from "../utils/ErrorHandler";
export const createCourse = catchAsyncError(
  async (data: any, res: Response, next: NextFunction) => {
    try {
      const course = await Course.create(data);
      res.status(201).json({
        success: true,
        course,
      });
    } catch (err: any) {
      return next(new ErrorHandler(500, err.message));
    }
  }
);
