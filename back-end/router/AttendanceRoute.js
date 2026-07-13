import express from "express";
import {
  getAttendances,
  getAttendanceHistory,
  getAttendanceById,
  createAttendance,
  updateAttendance,
  deleteAttendance,
  getAttendanceByNipOrName,
  getMyAttedances,
  getAttendancesByUserId,
  getAttendanceReport,
  createAttendanceManual,
  importAttendances,
} from "../controllers/AttendanceController.js";
import {
  //   authMiddleware,
  verifyUser,
  alloweRoles,
  //   refreshTokenIfNeeded,
} from "../middleware/AuthUser.js";

const router = express.Router();
import multer from "multer";
const upload = multer();

router.get("/attendances", verifyUser, getAttendances);
router.get("/attendances/history", verifyUser, getAttendanceHistory);
router.get("/attendances/search", verifyUser, getAttendanceByNipOrName);
router.get("/attendances/me", verifyUser, getMyAttedances);
router.get("/attendances/:id", verifyUser, getAttendanceById);
router.get("/attendances/user/:id", verifyUser, getAttendancesByUserId);
router.get("/attendances-report", verifyUser, getAttendanceReport);
router.post("/attendances", verifyUser, createAttendance);
router.post(
  "/attendances/admin",
  verifyUser,
  alloweRoles("Admin", "Admin Super", "Supervisor", "Manager"),
  createAttendanceManual,
);
router.put(
  "/attendances/:id",
  verifyUser,
  alloweRoles("Admin", "Admin Super", "Supervisor", "Manager"),
  updateAttendance,
);
router.delete(
  "/attendances/:id",
  verifyUser,
  alloweRoles("Admin", "Supervisor"),
  deleteAttendance,
);
router.post(
  "/attendances/import",
  verifyUser,
  alloweRoles("Admin, Supervisor"),
  upload.single("file"),
  importAttendances,
);

export default router;
