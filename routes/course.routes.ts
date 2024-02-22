import express from "express";
import * as cc from "../controllers/course.controllers";
import { validateUser, verifyAuthenication } from "../middleware/auth";
const router = express.Router();

router.post(
  "/upload-course",
  verifyAuthenication,
  validateUser("instructor"),
  cc.uploadCourse
);
router.put(
  "/update-course/:id",
  verifyAuthenication,
  validateUser("instructor"),
  cc.editCourse
);
router.get("/course/:id", cc.getSingleCourse);
router.get("/courses/all/", cc.getAllCourses);
router.get("/content/:id", verifyAuthenication, cc.getCourseContent);
router.post("/add-question", verifyAuthenication, cc.addQuestion);
router.post("/add-answer", verifyAuthenication, cc.addQuestionReply);
router.post("/add-review/:id", verifyAuthenication, cc.addReview);
router.post(
  "/add-review-reply",
  verifyAuthenication,
  validateUser("instructor"),
  cc.addReviewReply
);
router.get(
  "/get-courseForInstructor/:id",
  verifyAuthenication,
  cc.getAllCoursesForInstructor
);

router.delete(
  "/delete-course/:id",
  verifyAuthenication,
  validateUser("admin", "instructor"),
  cc.deleteCourse
);

export default router;
