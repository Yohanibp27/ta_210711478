import express from "express";
import {
  getProfessions,
  getProfessionById,
  createProfession,
  updateProfession,
  deleteProfession,
} from "../controllers/ProfessionController.js";
import {
  verifyUser,
  alloweRoles,
} from "../middleware/AuthUser.js";

const router = express.Router();

router.get(
  "/professions",
  verifyUser,
  alloweRoles("Admin", "Supervisor"),
  getProfessions
);
router.get(
  "/professions/:id",
  verifyUser,
  alloweRoles("Admin", "Supervisor"),
  getProfessionById
);
router.post(
  "/professions",
  verifyUser,
  alloweRoles("Admin", "Supervisor"),
  createProfession
);
router.put(
  "/professions/:id",
  verifyUser,
  alloweRoles("Admin", "Supervisor"),
  updateProfession
);
router.delete(
  "/professions/:id",
  verifyUser,
  alloweRoles("Admin", "Supervisor"),
  deleteProfession
);

//  tambahkan route di index.js
export default router;
