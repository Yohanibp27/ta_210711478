import express from "express";
import {
  getDivisions,
  getDivisionsAll,
  getDivisionById,
  createDivision,
  updateDivision,
  deleteDivision,
} from "../controllers/DivisionController.js";
import {
  verifyUser,
  alloweRoles,
//   refreshTokenIfNeeded,
} from "../middleware/AuthUser.js";

const router = express.Router();

router.get(
  "/divisions",
  verifyUser,
  alloweRoles("Admin", "Admin Super", "Supervisor", "Manager", "User"),
  getDivisions,
);
router.get(
  "/divisionsAll",
  verifyUser,
  alloweRoles("Admin", "Supervisor"),
  getDivisionsAll,
);
router.get(
  "/divisions/:id",
  verifyUser,
  alloweRoles("Admin", "Supervisor"),
  getDivisionById,
);
router.post(
  "/divisions",
  verifyUser,
  alloweRoles("Admin", "Supervisor"),
  createDivision,
);
router.put(
  "/divisions/:id",
  verifyUser,
  alloweRoles("Admin", "Supervisor"),
  updateDivision,
);
router.delete(
  "/divisions/:id",
  verifyUser,
  alloweRoles("Admin", "Supervisor"),
  deleteDivision,
);

export default router;
