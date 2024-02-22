import express from "express";
import * as oc from "../controllers/order.controllers";
import { validateUser, verifyAuthenication } from "../middleware/auth";
const router = express.Router();

router.post("/create-order", verifyAuthenication, oc.createOrder);
router.get(
  "/orders-instructors",
  verifyAuthenication,
  validateUser("instructor"),
  oc.getOrdersForInstructors
);
export default router;
