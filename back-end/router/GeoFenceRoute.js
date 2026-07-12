import express from "express";
import {
  createGeoFence,
  getActiveGeoFence,
  updateGeoFence,
  deleteGeoFence,
} from "../controllers/GeoFenceController.js";
// import { verifyUser, alloweRoles } from "../middleware/AuthUser.js";

const router = express.Router();

router.post("/", createGeoFence); // admin set geofence
router.get("/active", getActiveGeoFence);
router.put("/:id", updateGeoFence);
router.delete("/:id", deleteGeoFence);

export default router;
