import express from "express";
import {
  Login,
  StayLoggedIn,
  LogOut,
  ForgotPassword,
  ResetPassword,
  RefreshToken,
} from "../controllers/AuthController.js";
import { verifyUser, verifyTokenForReset } from "../middleware/AuthUser.js";

const router = express.Router();

router.post("/login", Login);
router.get("/stay", verifyUser, StayLoggedIn);
router.delete("/logout", LogOut); // hanya respon, token dihapus di client
router.post("/forgot-password", ForgotPassword);
router.post("/reset-password/:token", verifyTokenForReset, ResetPassword);
router.get("/token", RefreshToken); // memperbarui access token (Tanpa middleware)

export default router;
