import express from "express";
import {
  getRoles,
  getRoleById,
  createRole,
  updateRole,
  deleteRole,
} from "../controllers/RoleController.js";
import {
  verifyUser,
  alloweRoles,
} from "../middleware/AuthUser.js";

const router = express.Router();

router.get(
  "/roles",
  verifyUser,
  alloweRoles("Admin", "Supervisor"),
  getRoles
);
router.get(
  "/roles/:id",
  verifyUser,
  alloweRoles("Admin", "Supervisor"),
  getRoleById
);
router.post(
  "/roles",
  verifyUser,
  alloweRoles("Admin", "Supervisor"),
  createRole
);
router.put(
  "/roles/:id",
  verifyUser,
  alloweRoles("Admin", "Supervisor"),
  updateRole
);
router.delete(
  "/roles/:id",
  verifyUser,
  alloweRoles("Admin", "Supervisor"),
  deleteRole
);

//  tambahkan route di index.js
export default router;
