import express from "express";
import {
  createUser,
  deleteUser,
  getUserById,
  getUsers,
  updateUser,
  updateUserByMobile,
  updateUserByNip,
  searchUsers,
} from "../controllers/UserController.js";
import {
  verifyUser,
  alloweRoles,
//   authMiddleware,
//   refreshTokenIfNeeded,
} from "../middleware/AuthUser.js";

const router = express.Router();

import multer from "multer";
import path from "path"; // opsional, untuk mengatur nama file
import fs from "fs";
const uploadFolder = "uploads/profilePhotos";
if (!fs.existsSync(uploadFolder)) {
  fs.mkdirSync(uploadFolder, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadFolder),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});
const upload = multer({ storage });

router.get(
  "/users",
  verifyUser,
  alloweRoles("Admin", "Super Admin", "Supervisor", "Manager"),
  getUsers,
);
router.get(
  "/users/search",
  verifyUser,
  alloweRoles("Admin", "Super Admin", "Supervisor", "Manager"),
  searchUsers,
);
router.get(
  "/users/:id",
  verifyUser,
  alloweRoles("Admin", "Super Admin", "Supervisor", "Manager"),
  getUserById,
);
router.post(
  "/users",
  verifyUser,
  alloweRoles("Admin", "Supervisor"),
  upload.single("profilePhoto"),
  createUser,
);
router.put(
  "/users/nip/:id",
  verifyUser,
  alloweRoles("Admin", "Supervisor"),
  updateUserByNip,
);
// Route Khusus Update Mandiri (Mobile/Self-Service)
router.put(
  "/users/me/:id",
  verifyUser,
  // Biasanya semua role (termasuk "User") boleh update profil sendiri
  alloweRoles("Admin", "Supervisor", "Super Admin", "Manager", "User"),
  upload.single("profilePhoto"),
  updateUserByMobile,
);
router.put(
  "/users/:id",
  verifyUser,
  alloweRoles("Admin", "Supervisor", "Super Admin", "Manager", "User"),
  upload.single("profilePhoto"),
  updateUser,
);
router.delete(
  "/users/:id",
  verifyUser,
  alloweRoles("Admin", "Supervisor"),
  deleteUser,
);

//  tambahkan route di index.js
export default router;
// import multer from "multer";
// const upload = multer();
// import { upload } from "../utils/uploadJob.js";

// import multer from "multer";
// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, "uploads/profilePhotos"); // pastikan folder ini ada
//   },
//   filename: (req, file, cb) => {
//     cb(null, Date.now() + "-" + file.originalname);
//   },
// });

// const upload = multer({ storage });
