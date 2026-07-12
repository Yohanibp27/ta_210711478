import express from "express";
import {
  getDepartments,
  getDepartmentById,
  createDepartment,
  updateDepartment,
  deleteDepartment,
} from "../controllers/DepartmentController.js";
import {
  verifyUser,
  alloweRoles,
//   refreshTokenIfNeeded,
} from "../middleware/AuthUser.js";

const router = express.Router();

router.get(
  "/departments",
  verifyUser,
  alloweRoles("Admin", "Supervisor"),
  getDepartments
);
router.get(
  "/departments/:id",
  verifyUser,
  alloweRoles("Admin", "Supervisor"),
  getDepartmentById
);
router.post(
  "/departments",
  verifyUser,
  alloweRoles("Admin", "Supervisor"),
  createDepartment
);
router.put(
  "/departments/:id",
  verifyUser,
  alloweRoles("Admin", "Supervisor"),
  updateDepartment
);
router.delete(
  "/departments/:id",
  verifyUser,
  alloweRoles("Admin", "Supervisor"),
  deleteDepartment
);

export default router;
