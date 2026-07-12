import express from "express";
import {
  getAllActivities,
  getMyActivities,
  getActivityById,
  createActivity,
  markActivityAsRead,
  deleteActivity,
  getFilteredActivities,
} from "../controllers/UserActivityController.js";

import {
  verifyUser,
  alloweRoles,
//   authMiddleware,
//   refreshTokenIfNeeded,
} from "../middleware/AuthUser.js";

const router = express.Router();

router.get(
  "/activities",
  verifyUser,
  alloweRoles("Admin", "Supervisor"),
  getAllActivities
);

router.get(
  "/activities/me",
  verifyUser,
  alloweRoles("Admin", "Super Admin", "Supervisor", "Manager", "User"),
  getMyActivities
);

router.get(
  "/activities/me/filtered",
  verifyUser,
  alloweRoles("Admin", "Super Admin", "Supervisor", "Manager", "User"),
  getFilteredActivities
);

router.get(
  "/activities/:id",
  verifyUser,
  alloweRoles("Admin", "Super Admin", "Supervisor", "Manager", "User"),
  getActivityById
);

router.post(
  "/activities",
  verifyUser,
  alloweRoles("Admin", "Super Admin", "Supervisor", "Manager", "User"),
  createActivity
);

router.put(
  "/activities/:id/read",
  verifyUser,
  alloweRoles("Admin", "Super Admin", "Supervisor", "Manager", "User"),
  markActivityAsRead
);

router.delete(
  "/activities/:id",
  verifyUser,
  alloweRoles("Admin", "Supervisor"),
  deleteActivity
);

export default router;
