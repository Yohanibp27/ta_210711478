import express from "express";
import {
  getCalendarDays,
  createCalendarDay,
  updateCalendarDay,
  deleteCalendarDay,
} from "../controllers/CalendarController.js";
import {
//   authMiddleware,
  verifyUser,
  alloweRoles,
//   refreshTokenIfNeeded,
} from "../middleware/AuthUser.js";

const router = express.Router();

router.get(
  "/calendars",
  verifyUser,
  alloweRoles("Admin", "Admin Super", "Supervisor", "Manager", "User"),
  getCalendarDays,
);
router.post(
  "/calendars",
  verifyUser,
  alloweRoles("Admin, Supervisor"),
  createCalendarDay,
);
router.put(
  "/calendars/:id",
  verifyUser,
  alloweRoles("Admin, Supervisor"),
  updateCalendarDay,
);
router.delete(
  "/calendars/:id",
  verifyUser,
  alloweRoles("Admin, Supervisor"),
  deleteCalendarDay,
);

export default router;
