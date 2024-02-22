import express from "express";
import * as lc from "../controllers/layout.controllers";
import { validateUser, verifyAuthenication } from "../middleware/auth";
const router = express.Router();

router.post(
  "/create-layout",
  verifyAuthenication,
  validateUser("admin"),
  lc.createLayout
);

router.put(
  "/edit-layout",
  verifyAuthenication,
  validateUser("admin"),
  lc.editLayout
);

router.delete(
  "/delete-layout",
  verifyAuthenication,
  validateUser("admin"),
  lc.deleteLayout
);

router.get(
  "/get-layout",
  verifyAuthenication,
  validateUser("admin"),
  lc.getLayout
);
export default router;
