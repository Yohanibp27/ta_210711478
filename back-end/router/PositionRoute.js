import express from "express";
import {
  getPositions,
  getPositionsAll,
  getPositionById,
  createPosition,
  updatePosition,
  deletePosition,
} from "../controllers/PositionController.js";
import { verifyUser, alloweRoles } from "../middleware/AuthUser.js";

const router = express.Router();

router.get(
  "/positions",
  verifyUser,
  alloweRoles("Admin", "Supervisor"),
  getPositions
);
router.get(
  "/positionsAll",
  verifyUser,
  alloweRoles("Admin", "Supervisor"),
  getPositionsAll
);
router.get(
  "/positions/:id",
  verifyUser,
  alloweRoles("Admin", "Supervisor"),
  getPositionById
);
router.post(
  "/positions",
  verifyUser,
  alloweRoles("Admin", "Supervisor"),
  createPosition
);
router.put(
  "/positions/:id",
  verifyUser,
  alloweRoles("Admin", "Supervisor"),
  updatePosition
);
router.delete(
  "/positions/:id",
  verifyUser,
  alloweRoles("Admin", "Supervisor"),
  deletePosition
);

//  tambahkan route di index.js
export default router;
