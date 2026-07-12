import express from "express";
import {
  getAllShifts,
  getShiftByUser,
  getShiftById,
  createShift,
  updateShift,
  deleteShift,
  getExchangeOptions,
  importShifts,
  getMyExchangeShiftOptions,
  getMyShifts,
} from "../controllers/ShiftAssignmentController.js";
import {
  verifyUser,
  alloweRoles,
  //   authMiddleware,
} from "../middleware/AuthUser.js";

const router = express.Router();
import multer from "multer";
const upload = multer();

router.get(
  "/my-shifts/exchange-options",
  verifyUser,
  alloweRoles("Admin", "Supervisor", "Manager", "Super Admin", "User"),
  getMyExchangeShiftOptions,
);
router.get(
  "/shifts/exchange-options",
  verifyUser,
  alloweRoles("Admin", "Supervisor", "Manager", "Super Admin", "User"),
  getExchangeOptions,
);
router.get(
  "/my-shifts",
  verifyUser,
  alloweRoles("Admin", "Supervisor", "Manager", "Super Admin", "User"),
  getMyShifts,
);
router.get(
  "/shifts",
  verifyUser,
  alloweRoles("Admin", "Supervisor", "Manager", "Super Admin"),
  getAllShifts,
);
router.get(
  "/shifts/:id",
  verifyUser,
  alloweRoles("Admin", "Supervisor", "Manager", "Super Admin"),
  getShiftById,
);
router.get(
  "/shifts/user/:id",
  verifyUser,
  alloweRoles("Admin", "Supervisor", "Manager", "Super Admin", "User"),
  getShiftByUser,
);
router.post(
  "/shifts",
  verifyUser,
  alloweRoles("Admin, Supervisor"),
  createShift,
);
router.put(
  "/shifts/:id",
  verifyUser,
  alloweRoles("Admin, Supervisor"),
  updateShift,
);
router.delete(
  "/shifts/:id",
  verifyUser,
  alloweRoles("Admin, Supervisor"),
  deleteShift,
);
router.post(
  "/shifts/import",
  verifyUser,
  alloweRoles("Admin, Supervisor"),
  upload.single("file"),
  importShifts,
);

export default router;
