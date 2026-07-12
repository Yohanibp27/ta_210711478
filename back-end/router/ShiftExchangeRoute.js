import express from "express";
import {
  getAllShiftExchanges,
  getShiftExchangeById,
  requestShiftExchange,
  cancelShiftExchange,
  getUserShiftExchanges,
  approveByPartner,
  rejectByPartner,
  approveByManager,
  rejectByManager,
  approveBySDM,
  rejectBySDM,
  //   approveShiftExchange,
  //   rejectShiftExchange,
  //   createShiftExchange,
  //   deleteShiftExchange,
  getShiftByManager,
} from "../controllers/ShiftExchangeController.js";
import { verifyUser, alloweRoles } from "../middleware/AuthUser.js";

const router = express.Router();

/**
 * =========================
 * ADMIN SDM - Menampilkan semua pengajuan
 * =========================
 */
router.get(
  "/all-shift-exchanges",
  verifyUser,
  alloweRoles("Admin", "Supervisor", "Manager", "Admin Super"),
  getAllShiftExchanges,
);

/**
 * =========================
 * MANAGER - Menampilkan semua pengajuan berdasarkan FUNGSI MANAGER
 * =========================
 */
router.get(
  "/shift-exchanges/manager",
  verifyUser,
  alloweRoles("Admin", "Manager", "Supervisor"),
  getShiftByManager,
);

/**
 * =========================
 * SEMUA ROLE - Menampilkan pengajuan berdasarkan ID
 * =========================
 */
router.get(
  "/shift-exchanges/:id",
  verifyUser,
  alloweRoles("User", "Admin", "Supervisor", "Manager", "Admin Super", "User"),
  getShiftExchangeById,
);

/**
 * =========================
 * REQUESTER
 * =========================
 */
router.post(
  "/shift-exchanges/request",
  verifyUser,
  alloweRoles("Admin", "Admin Super", "Supervisor", "Manager", "User"),
  requestShiftExchange,
);

// --- Batalkan permintaan pertukaran shift ---
router.put(
  "/shift-exchanges/:id/cancel",
  verifyUser,
  alloweRoles("User", "Admin", "Supervisor", "Manager", "Admin Super"),
  cancelShiftExchange,
);

// User bisa melihat permintaan sendiri atau yang ditujukan kepadanya
router.get(
  "/shift-exchanges",
  verifyUser,
  alloweRoles("User", "Admin", "Supervisor", "Manager", "Super Admin"),
  getUserShiftExchanges,
);

// =========================
// PARTNER
// =========================
router.put(
  "/shift-exchange/:id/approve",
  verifyUser,
  alloweRoles("User", "Admin"),
  approveByPartner,
);

router.put(
  "/shift-exchange/:id/reject",
  verifyUser,
  alloweRoles("User", "Admin"),
  rejectByPartner,
);

// =========================
// MANAGER
// =========================
router.put(
  "/shift-exchange/:id/manager/approve",
  verifyUser,
  alloweRoles("Admin", "Manager"),
  approveByManager,
);

router.put(
  "/shift-exchange/:id/manager/reject",
  verifyUser,
  alloweRoles("Admin", "Manager"),
  rejectByManager,
);

// =========================
// SDM
// =========================
router.put(
  "/shift-exchange/:id/sdm/approve",
  verifyUser,
  alloweRoles("Admin", "Supervisor", "Admin Super", "Manager"),
  approveBySDM,
);

router.put(
  "/shift-exchange/:id/sdm/reject",
  verifyUser,
  alloweRoles("Admin", "Supervisor", "Admin Super", "Manager"),
  rejectBySDM,
);

export default router;

// // Hanya supervisor/admin yang bisa approve/reject
// router.put(
//   "/approve/:id",
//   refreshTokenIfNeeded,
//   verifyUser,
//   alloweRoles("Admin", "Supervisor"),
//   approveShiftExchange,
// );
// router.put(
//   "/reject/:id",
//   refreshTokenIfNeeded,
//   verifyUser,
//   alloweRoles("Admin", "Supervisor"),
//   rejectShiftExchange,
// );
// router.delete(
//   "/shift-exchanges/:id",
//   refreshTokenIfNeeded,
//   verifyUser,
//   alloweRoles("Admin"),
//   deleteShiftExchange,
// );
