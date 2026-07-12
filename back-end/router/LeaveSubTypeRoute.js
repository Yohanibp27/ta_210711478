import express from "express";
import {
  getLeaveSubTypes,
  getLeaveSubTypeById,
  createLeaveSubType,
  updateLeaveSubType,
  deleteLeaveSubType,
} from "../controllers/LeaveSubTypeController.js";
import {
  verifyUser,
  alloweRoles,
  //   refreshTokenIfNeeded,
} from "../middleware/AuthUser.js";

const router = express.Router();

router.get(
  "/leavesubtypes",
  verifyUser,
  alloweRoles("Admin", "Super Admin", "Supervisor", "Manager", "User"),
  getLeaveSubTypes,
);
router.get(
  "/leavesubtypes/:id",
  verifyUser,
  alloweRoles("Admin"),
  getLeaveSubTypeById,
);
router.post(
  "/leavesubtypes",
  verifyUser,
  alloweRoles("Admin"),
  createLeaveSubType,
);
router.put(
  "/leavesubtypes/:id",
  verifyUser,
  alloweRoles("Admin"),
  updateLeaveSubType,
);
router.delete(
  "/leavesubtypes/:id",
  verifyUser,
  alloweRoles("Admin"),
  deleteLeaveSubType,
);

export default router;
