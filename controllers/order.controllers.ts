import Order from "../models/Order";
import { Request, Response, NextFunction } from "express";
import Notification from "../models/Notification";
import ErrorHandler from "../utils/ErrorHandler";
import catchAsyncErrosr from "../middleware/catchAsyncErrors";
import User from "../models/User";
import Course from "../models/Course";
import { INotification } from "../models/Notification";
import sendMail from "../utils/sendmails";
import redis from "../utils/redis";

interface IOrderData {
  courseId: string;
  userId: string;
  payment_info: object;
}

export const createOrder = catchAsyncErrosr(
  async (req: Request, res: Response, next: NextFunction) => {
    const { courseId, payment_info } = req.body as IOrderData;
    //
    try {
      const user = await User.findById(req.user?._id);
      const course = await Course.findById(courseId);
      if (!course) {
        return next(new ErrorHandler(404, " Course is not found "));
      }

      if (!user) return next(new ErrorHandler(404, " User is not found "));

      const courseList = user?.courses || [];
      const coursePurchased = courseList?.some(
        (course: any) => course._id == courseId
      );

      if (coursePurchased)
        return next(
          new ErrorHandler(400, "You have already purchased the course")
        );
      const data = {
        title: "New Order",
        message: `You have a new order from ${course.name}`,
        userId: course.instructor,
      };
      console.log(course);

      console.log("ins", course.instructor);
      const orderData = {
        courseId,
        userId: req.user?._id,
        instructorId: course.instructor,
        payment_info,
      };
      console.log(course._id);
      const order = await Order.create(orderData);
      if (courseId) user.courses.push({ _id: courseId });
      course.purchased ? (course.purchased += 1) : course.purchased;
      await course.save();
      await user.save();
      const mailData = {
        username: user?.name,
        coursename: course.name,
        price: course.price,
        date: new Date().toLocaleDateString("en-us", {
          year: "numeric",
          month: "long",
          day: "numeric",
        }),
      };

      await Notification.create(data);
      const mailOptions = {
        template: "orderConfirmation-mail.ejs",
        subject: "Order Confirmation",
        email: user?.email || "",
        data: mailData,
      };
      await sendMail(mailOptions);

      await user.save();
      await course.save();
      // await redis.set(user._id, JSON.stringify({ user }));
      res.status(200).json({
        success: true,
        order,
      });
    } catch (err: any) {
      return next(new ErrorHandler(500, err.message));
    }
  }
);

//get all oreders---only instructors
export const getOrdersForInstructors = catchAsyncErrosr(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const orders = await Order.find({ instructorId: req.user?._id });
      res.status(200).json({
        success: true,
        orders,
      });
    } catch (err: any) {
      return next(new ErrorHandler(500, err.message));
    }
  }
);
