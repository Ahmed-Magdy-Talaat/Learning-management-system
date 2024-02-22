import express from "express";
import * as ac from "../controllers/analytics.controllers";
import { validateUser, verifyAuthenication } from "../middleware/auth";
const router = express.Router();

router.get(
  "/get-analytics-users",
  verifyAuthenication,
  validateUser("admin"),
  ac.getUsersAnalytics
);
router.get(
  "/get-analytics-courses",
  verifyAuthenication,
  validateUser("admin", "instructor"),
  ac.getCoursesAnalytics
);

router.get(
  "/get-analytics-orders",
  verifyAuthenication,
  validateUser("admin", "instructor"),
  ac.getOrdersAnalytics
);
export default router;
