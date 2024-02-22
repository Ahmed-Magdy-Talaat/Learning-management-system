import express from "express";
import * as nc from "../controllers/notification.controllers";
import { validateUser, verifyAuthenication } from "../middleware/auth";
const router = express.Router();

router.get("/get-notifications", verifyAuthenication, nc.getAllNotifications);
router.put(
  "/update-notifications/:id",
  verifyAuthenication,
  nc.updateNotificationStatus
);
export default router;
