import express from "express";
import {
  getDailyQRCode,
  getDynamicQRCode,
} from "../controllers/QrController.js";
import {
  verifyUser,
  alloweRoles,
} from "../middleware/AuthUser.js";
const router = express.Router();

router.get(
  "/daily-qr",
  verifyUser,
  alloweRoles("Admin", "Supervisor"),
  getDailyQRCode
);

// PAKE YANG INI MULAI TANGGAL 18 JANUARI 2026
router.get(
  "/dynamic-qr",
  verifyUser,
  alloweRoles("Admin", "Supervisor"),
  getDynamicQRCode
);

export default router;
