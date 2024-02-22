import catchAsyncError from "../middleware/catchAsyncErrors";
import { Request, Response, NextFunction } from "express";
import Notification from "../models/Notification";
import ErrorHandler from "../utils/ErrorHandler";
import cron from "node-cron";

export const getAllNotifications = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const notifications = await Notification.find({
        userId: req.user?._id,
      }).sort({ createdAt: -1 });
      res.status(200).json({
        success: true,
        notifications,
      });
    } catch (err: any) {
      return next(new ErrorHandler(500, err.message));
    }
  }
);

export const updateNotificationStatus = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id;
      const notification = await Notification.findById(id);
      if (!notification)
        return next(new ErrorHandler(400, "notification is not found"));
      notification.status = "read";
      await notification.save();
      const notifications = await Notification.find().sort({ createdAt: -1 });
      res.status(200).json({
        success: true,
        notifications,
      });
    } catch (err: any) {
      return next(new ErrorHandler(500, err.message));
    }
  }
);

cron.schedule("0 0 0 * * *", async () => {
  const lastMonth = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  await Notification.deleteMany({
    status: "read",
    createdAt: { $lt: lastMonth },
  });
});
