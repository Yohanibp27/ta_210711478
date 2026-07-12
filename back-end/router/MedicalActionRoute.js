import express from "express";
import {
  importExcel,
  getMedicalActions,
  getDashboardSummary,
  getWorkloadDoctors,
  getUnitDistribution,
  getHeatmap,
  getAttendanceTimeline,
} from "../controllers/MedicalActionController.js";
import { verifyUser, alloweRoles } from "../middleware/AuthUser.js";

const router = express.Router();
import multer from "multer";

// Inisialisasi Multer (Simpan di memory sementara untuk diproses)
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.post(
  "/import-tindakan",
  verifyUser,
  alloweRoles("Admin", "Super Admin", "Supervisor", "Manager"),
  upload.single("file"),
  importExcel,
);
router.get(
  "/medical-actions",
  verifyUser,
  alloweRoles("Admin", "Super Admin", "Supervisor", "Manager"),
  getMedicalActions,
);
router.get(
  "/dashboard/summary",
  verifyUser,
  alloweRoles("Admin", "Super Admin", "Supervisor", "Manager"),
  getDashboardSummary,
);
router.get(
  "/dashboard/workload-doctors",
  verifyUser,
  alloweRoles("Admin", "Super Admin", "Supervisor", "Manager"),
  getWorkloadDoctors,
);
router.get(
  "/dashboard/unit-distribution",
  verifyUser,
  alloweRoles("Admin", "Super Admin", "Supervisor", "Manager"),
  getUnitDistribution,
);
router.get(
  "/dashboard/heatmap",
  verifyUser,
  alloweRoles("Admin", "Super Admin", "Supervisor", "Manager"),
  getHeatmap,
);
router.get(
  "/dashboard/attendance-timeline",
  verifyUser,
  alloweRoles("Admin", "Super Admin", "Supervisor", "Manager"),
  getAttendanceTimeline,
);

export default router;

// const upload = multer({ storage: multer.memoryStorage() });
// const multer = require("multer");
// router.post(
//   "/import-tindakan",
//   upload.single("file"),
//   importController.importExcel,
// );
