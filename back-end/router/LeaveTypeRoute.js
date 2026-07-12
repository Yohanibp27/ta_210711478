import express from "express";
import {
  getLeaveTypes,
  getLeaveTypeById,
  createLeaveType,
  updateLeaveType,
  deleteLeaveType,
} from "../controllers/LeaveTypeController.js";
import {
  verifyUser,
  alloweRoles,
//   refreshTokenIfNeeded,
} from "../middleware/AuthUser.js";

const router = express.Router();

router.get(
  "/leavetypes",
  verifyUser,
  alloweRoles("Admin", "Super Admin", "Supervisor", "Manager", "User"),
  getLeaveTypes,
);
router.get(
  "/leavetypes/:id",
  verifyUser,
  alloweRoles("Admin"),
  getLeaveTypeById,
);
router.post(
  "/leavetypes",
  verifyUser,
  alloweRoles("Admin"),
  createLeaveType,
);
router.put(
  "/leavetypes/:id",
  verifyUser,
  alloweRoles("Admin"),
  updateLeaveType,
);
router.patch(
  "/leavetypes/:id",
  verifyUser,
  alloweRoles("Admin"),
  updateLeaveType,
);
router.delete(
  "/leavetypes/:id",
  verifyUser,
  alloweRoles("Admin"),
  deleteLeaveType,
);

export default router;
