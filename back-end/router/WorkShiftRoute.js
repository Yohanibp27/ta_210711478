import express from "express";
import {
  getWorkShifts,
  getWorkShiftById,
  createWorkShift,
  updateWorkShift,
  deleteWorkShift,
} from "../controllers/WorkShiftController.js";
import {
  verifyUser,
  alloweRoles,
  //   authMiddleware,
  //   refreshTokenIfNeeded,
} from "../middleware/AuthUser.js";

const router = express.Router();

// router.get("/work-shifts", getWorkShifts);
// router.get("/work-shifts/:id", getWorkShiftById);
// router.post("/work-shifts", createWorkShift);
// router.put("/work-shifts/:id", updateWorkShift);
// router.delete("/work-shifts/:id", deleteWorkShift);

router.get(
  "/workshifts",
  verifyUser,
  alloweRoles("Admin", "Supervisor"),
  getWorkShifts,
);
router.get(
  "/workshifts/:id",
  verifyUser,
  alloweRoles("Admin", "Supervisor"),
  getWorkShiftById,
);
router.post(
  "/workshifts",
  verifyUser,
  alloweRoles("Admin", "Supervisor"),
  createWorkShift,
);
router.put(
  "/workshifts/:id",
  verifyUser,
  alloweRoles("Admin", "Supervisor"),
  updateWorkShift,
);
router.delete(
  "/workshifts/:id",
  verifyUser,
  alloweRoles("Admin", "Supervisor"),
  deleteWorkShift,
);

//  tambahkan route di index.js
export default router;
