import express from "express";
import {
  getAllHistory,
  createHistory,
} from "../controllers/ReportHistoriesController.js";
import {
  verifyUser,
  alloweRoles,
} from "../middleware/AuthUser.js";

const router = express.Router();

import multer from "multer";
import path from "path";
import fs from "fs";
const uploadFolder = "uploads/reports";
if (!fs.existsSync(uploadFolder)) {
  fs.mkdirSync(uploadFolder, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadFolder),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});
const upload = multer({ storage });

router.get(
  "/history",
  verifyUser,
  alloweRoles("Admin", "Admin Super", "Supervisor", "Manager"),
  getAllHistory,
);

router.post(
  "/history",
  verifyUser,
  alloweRoles("Admin", "Admin Super", "Supervisor", "Manager"),
  upload.single("file"),
  createHistory,
);

export default router;
