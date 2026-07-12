import express from "express";
import {
  getAllLeaveQuota,
  getMyLeaveQuota,
  createLeaveRequest,
  getLeaveRequests,
  getLeaveRequestById,
  approveByManager,
  rejectByManager,
  approveBySDM,
  rejectBySDM,
  getMyLeaveRequests,
  cancelLeaveRequest,
  getLeaveByManager,
} from "../controllers/LeaveRequestController.js";
import {
  verifyUser,
  alloweRoles,
  //   authMiddleware,
  //   verifyToken,
  //   refreshTokenIfNeeded,
} from "../middleware/AuthUser.js";

const router = express.Router();

import multer from "multer";
import path from "path";
import fs from "fs";
// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, "uploads/evidence/");
//   },
//   filename: (req, file, cb) => {
//     cb(null, Date.now() + path.extname(file.originalname));
//   },
// });
// const upload = multer({ storage: storage });

const uploadDir = "uploads/evidence";
if (!fs.existsSync(uploadDir)) {
  // recursive: true agar folder induk juga dibuat jika belum ada
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log("Folder uploads/evidence berhasil dibuat.");
}
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // Limit 5MB
});

// =========================
// USER - REQUESTER
// =========================
router.get(
  "/leavequota",
  verifyUser,
  alloweRoles("Admin", "Admin Super", "Supervisor", "Manager"),
  getAllLeaveQuota,
);
router.get(
  "/my-leavequota",
  verifyUser,
  alloweRoles("Admin", "Admin Super", "Supervisor", "Manager", "User"),
  getMyLeaveQuota,
);
// MANAGER - Menampilkan semua pengajuan berdasarkan FUNGSI MANAGER
router.get(
  "/leave-requests/manager",
  verifyUser,
  alloweRoles("Admin", "Manager", "Supervisor"),
  getLeaveByManager,
);

// create
router.post(
  "/leave-requests",
  verifyUser,
  alloweRoles("Admin", "Admin Super", "Supervisor", "Manager", "User"),
  upload.single("evidenceFile"),
  createLeaveRequest,
);
// cancel
router.put(
  "/leave-requests/:id/cancel",
  verifyUser,
  alloweRoles("Admin", "Admin Super", "Supervisor", "Manager", "User"),
  cancelLeaveRequest,
);
router.get(
  "/leave-requests",
  verifyUser,
  alloweRoles("Admin", "Admin Super", "Supervisor", "Manager", "User"),
  getLeaveRequests,
);
router.get(
  "/leave-requests/:id",
  verifyUser,
  alloweRoles("Admin", "Admin Super", "Supervisor", "Manager", "User"),
  getLeaveRequestById,
);
router.get(
  "/my-leave-requests",
  verifyUser,
  alloweRoles("Admin", "Admin Super", "Supervisor", "Manager", "User"),
  getMyLeaveRequests,
);

// =========================
// MANAGER
// =========================
router.put(
  "/leave-requests/:id/manager/approve",
  verifyUser,
  alloweRoles("Admin", "Manager"),
  approveByManager,
);

router.put(
  "/leave-requests/:id/manager/reject",
  verifyUser,
  alloweRoles("Admin", "Manager"),
  rejectByManager,
);

// =========================
// SDM
// =========================
router.put(
  "/leave-requests/:id/sdm/approve",
  verifyUser,
  alloweRoles("Admin", "Supervisor", "Manager", "Admin Super"),
  approveBySDM,
);

router.put(
  "/leave-requests/:id/sdm/reject",
  verifyUser,
  alloweRoles("Admin", "Supervisor", "Manager", "Admin Super"),
  rejectBySDM,
);

export default router;
