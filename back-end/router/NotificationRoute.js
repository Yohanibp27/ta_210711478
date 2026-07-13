import express from "express";
import { getNotifications } from "../controllers/NotificationController.js";
import { verifyToken } from "../middleware/AuthUser.js";

const router = express.Router();

router.get("/notifications", verifyToken, getNotifications);

export default router;
