import express from "express";
import * as uc from "../controllers/user.controllers";
import { validateUser, verifyAuthenication } from "../middleware/auth";
const router = express.Router();

router.post("/registeration", uc.registerUser);
router.post("/activate-user", uc.activateUser);
router.post("/sign-in", uc.login);
router.post("/sign-out", verifyAuthenication, uc.logout);
router.get("/me", verifyAuthenication, uc.getUserInfo);
router.get("/refresh", verifyAuthenication, uc.updateToken);
router.post("/social-auth", uc.socialAuth);
router.put("/update-user", verifyAuthenication, uc.updateUserInfo);
router.put("/update-password", verifyAuthenication, uc.updatePassword);
router.put("/update-profile-pic", verifyAuthenication, uc.updateProfilePicture);
router.post("/refresh-token", uc.updateToken);
router.get(
  "/all-users",
  verifyAuthenication,
  validateUser("admin"),
  uc.getAllUsers
);

router.delete(
  "/del-user/:id",
  verifyAuthenication,
  validateUser("admin"),
  uc.deleteUser
);
export default router;
