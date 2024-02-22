import { Request, Response, NextFunction } from "express";
import catchAsyncError from "../middleware/catchAsyncErrors";
import ErrorHandler from "../utils/ErrorHandler";
import cloudinary from "cloudinary";
import { createCourse } from "../services/course.services";
import Course from "../models/Course";
import redis from "../utils/redis";
import mongoose from "mongoose";
import sendMail from "../utils/sendmails";
import Notification from "../models/Notification";

export const uploadCourse = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = req.body;
      data.instructor = req.user?._id;
      const thumbnail = data.thumbnail && data.thumbnail.url; // Extracting the URL property
      if (!thumbnail) {
        const mycloud = await cloudinary.v2.uploader.upload(thumbnail, {
          folder: "courses",
        });
        data.thumbnail = {
          url: mycloud.secure_url,
          public_id: mycloud.public_id,
        };
      }
      createCourse(data, res, next);
    } catch (err: any) {
      return next(new ErrorHandler(500, err.message));
    }
  }
);

export const editCourse = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const courseId = req.params.id;

      const data = req.body;

      const courseExist = await Course.findById(courseId);
      if (courseExist?.instructor != req.user?._id)
        return next(
          new ErrorHandler(400, "You are not authorized to update this course")
        );
      const thumbnail = data.thumbnail && data.thumbnail.url; // Extracting the URL property
      if (!thumbnail) {
        await cloudinary.v2.uploader.destroy(thumbnail.public_id);
        const mycloud = await cloudinary.v2.uploader.upload(thumbnail, {
          folder: "courses",
        });
        data.thumbnail = {
          url: mycloud.secure_url,
          public_id: mycloud.public_id,
        };
      }
      const course = await Course.findByIdAndUpdate(
        courseId,
        { $set: data },
        { new: true }
      );
      res.status(200).json({
        success: true,
        message: "Course Edited Successfully",
        course,
      });
    } catch (err: any) {
      return next(new ErrorHandler(500, err.message));
    }
  }
);

// search for a single course unpurchased
export const getSingleCourse = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    const id = req.params.id;
    const isCacheExist = await redis.get(id);
    let course: any;
    if (isCacheExist) {
      course = JSON.parse(isCacheExist);
    } else {
      course = await Course.findById(id).select(
        "-courseData.links -courseData.suggestion -courseData.videoUrl  -courseData.questions"
      );
      await redis.set(id, JSON.stringify(course));
    }
    res.status(201).json({
      success: true,
      course,
    });
  }
);

export const getAllCourses = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    let courses: any;
    const isCacheExist = await redis.get("allCourses");
    if (isCacheExist) {
      courses = JSON.parse(isCacheExist);
    } else {
      courses = await Course.find().select(
        "-courseData.links -courseData.suggestion -courseData.videoUrl  -courseData.questions"
      );
      await redis.set("allCourses", JSON.stringify(courses));
    }
    res.status(201).json({
      success: true,
      courses,
    });
  }
);

export const getCourseContent = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    const courseId = req.params.id;
    const courses = req.user?.courses;
    const isExist = courses?.find(
      (course: any) => course._id.toString() === courseId
    );
    if (!isExist)
      return next(new ErrorHandler(400, "You are not enrolled in this course"));
    const course = await Course.findById(courseId);
    const content = course?.courseData;
    res.status(201).json({
      status: true,
      content,
    });
  }
);

interface IQuestion {
  question: string;
  contentId: string;
  courseId: string;
}

export const addQuestion = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    const { question, contentId, courseId }: IQuestion = req.body;
    try {
      if (!mongoose.Types.ObjectId.isValid(contentId))
        return next(new ErrorHandler(400, "content id is not valid"));

      const course = await Course.findById(courseId);
      if (!course) return next(new ErrorHandler(404, "Course is not found"));
      const courseContent: any = course?.courseData.find(
        (item: any) => item._id == contentId
      );
      if (!courseContent)
        return next(new ErrorHandler(400, "Content is not found"));
      const newQuestion: any = {
        user: req.user,
        question,
        questionReplies: [],
      };
      courseContent?.questions.push(newQuestion);
      await Notification.create({
        title: "New Question",
        message: `You have a new question in lesson ${courseContent.title} in course ${course.name}`,
        userId: course.instructor,
      });

      await course.save();
      res.status(201).json({
        success: true,
        course,
      });
    } catch (err: any) {
      return next(new ErrorHandler(500, err.message));
    }
  }
);

interface IAnswer {
  answer: string;
  courseId: string;
  contentId: string;
  questionId: string;
}

interface IMail {
  template: string;
  email: string;
  subject: string;
  data: string;
}
export const addQuestionReply = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    const { answer, courseId, contentId, questionId } = req.body as IAnswer;
    try {
      const course = await Course.findById(courseId);
      if (!course) return next(new ErrorHandler(404, "Course is not found"));
      if (!mongoose.Types.ObjectId.isValid(contentId))
        return next(new ErrorHandler(400, "content is not valid"));
      if (!mongoose.Types.ObjectId.isValid(questionId))
        return next(new ErrorHandler(400, "question is not valid"));

      const content = course?.courseData.find(
        (item: any) => item._id.toString() === contentId.toString()
      );
      if (!content) return next(new ErrorHandler(400, "Content is not found"));
      const question: any = content.questions.find(
        (ques: any) => ques._id.toString() == questionId.toString()
      );
      if (!question)
        return next(new ErrorHandler(400, "Question is not found"));
      const reply: any = {
        user: req.user,
        answer,
      };
      question?.questionReplies.push(reply);
      await course.save();
      if (req.user?._id === question.user._id) {
        await Notification.create({
          title: "New Question",
          message: `You have a new reply in lesson ${content.title} in course ${course.name}`,
          userId: req.user?._id,
        });
      } else {
        const data: any = {
          title: content.title,
          name: question.user.name,
        };
        const mail = {
          template: "questionReply-mail.ejs",
          subject: "Question Reply",
          email: question.user.email,
          data,
        };
        await sendMail(mail);
      }

      res.status(201).json({
        success: true,
        course,
      });
    } catch (err: any) {
      return next(new ErrorHandler(400, err.message));
    }
  }
);

interface IReview {
  rating: number;
  comment: string;
}

export const addReview = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    const { rating, comment } = req.body as IReview;
    const courseId = req.params.id;

    try {
      const courseList = req.user?.courses;
      const isExist = courseList?.find(
        (course: any) => course._id.toString() === courseId.toString()
      );
      if (!isExist)
        return next(
          new ErrorHandler(400, "You are not allowed to access this resource")
        );
      const course = await Course.findById(courseId);
      if (!course) return next(new ErrorHandler(404, "Course is not found"));

      const data: any = {
        rating,
        comment,
        user: req.user,
        commentReplies: [],
      };
      course?.reviews.push(data);
      let sum = 0;
      course?.reviews.map((rev) => (sum += rev.rating));
      if (course?.reviews.length) course.ratings = sum / course?.reviews.length;

      await course.save();

      res.status(201).json({
        success: true,
        course,
      });
    } catch (err: any) {
      return next(new ErrorHandler(400, err.message));
    }
  }
);

interface IReviewReply {
  comment: string;
  reviewId: string;
  courseId: string;
}

export const addReviewReply = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    const { comment, reviewId, courseId } = req.body as IReviewReply;
    const courseList = req.user?.courses;
    try {
      const isExist = courseList?.find(
        (course: any) => course._id.toString() === courseId.toString()
      );
      if (!isExist)
        return next(
          new ErrorHandler(400, "You are not allowed to access this resource")
        );
      //
      const course = await Course.findById(courseId);
      const review: any = course?.reviews.find(
        (rev: any) => rev._id.toString() === reviewId
      );
      const data = {
        user: req.user,
        comment,
      };
      if (!review) return next(new ErrorHandler(404, "review is not found"));
      console.log(review);
      review?.commentReplies.push(data);
      await course?.save();
      res.status(200).json({
        success: true,
        course,
      });
    } catch (err: any) {
      return next(new ErrorHandler(400, err.message));
    }
  }
);

//get all courses by instructor

export const getAllCoursesForInstructor = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    const instructor = req.params.id;
    try {
      const courses = await Course.find({ instructor });
      res.status(200).json({
        success: true,
        courses,
      });
    } catch (err: any) {
      return next(new ErrorHandler(500, err.message));
    }
  }
);

export const deleteCourse = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    const { courseId } = req.body;
    const course = await Course.findById(courseId);
    if (req.user?._id != course?.instructor && req.user?.role != "admin")
      return next(
        new ErrorHandler(500, "You are not authorized to delete this course")
      );
    const deleted = await Course.deleteOne({ _id: courseId });
    await redis.del(courseId);
    if (!deleted) return next(new ErrorHandler(400, "Course is not found"));
    res.status(200).json({
      success: true,
      message: "Course is deleted successfully",
    });
  }
);
