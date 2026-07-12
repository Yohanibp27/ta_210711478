import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import session from "express-session";
import path from "path";
import { fileURLToPath } from "url";

import db from "./config/Database.js";
import "./models/association.js";
// import RefreshTokenRoute from "./router/RefreshTokenRoute.js";
import qrRoute from "./router/qrRoute.js";

import { autoAbsentJob } from "./utils/autoAbsentJob.js";
import { autoExpireLeaveJob } from "./utils/autoExpireLeaveJob.js";
import { autoExpireShiftExchangeJob } from "./utils/autoExpireShiftExchangeJob.js";
import { autoLeaveCheckerJob } from "./utils/autoLeaveCheckerJob.js";

import UserRoute from "./router/UserRoute.js";
import DepartmentRoute from "./router/DepartmentRoute.js";
import PositionRoute from "./router/PositionRoute.js";
import RoleRoute from "./router/RoleRouter.js";
import WorkShiftRoute from "./router/WorkShiftRoute.js";
import AttendanceRoute from "./router/AttendanceRoute.js";

import AuthRoute from "./router/AuthRoute.js";
import ProfessionRoute from "./router/ProfessionRoute.js";
import DivisionRoute from "./router/DivisionRoute.js";
import ShiftAssignmentRoute from "./router/ShiftAssignmentRoute.js";
import ShiftExchangeRoute from "./router/ShiftExchangeRoute.js";
import UserActivityRoute from "./router/UserActivityRoute.js";

// BUAT LANJUTAN TA
import LeaveTypeRoute from "./router/LeaveTypeRoute.js";
import LeaveSubTypeRoute from "./router/LeaveSubTypeRoute.js";
import LeaveRequestRoute from "./router/LeaveRequestRoute.js";
import GeoFence from "./router/GeoFenceRoute.js";
import QrRoute from "./router/qrRoute.js";
import MedicalActionRoute from "./router/MedicalActionRoute.js";
import CalendarRoute from "./router/CalendarRoute.js";
import ReportHistory from "./router/ReportHistoriesRoute.js";

dotenv.config();

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

(async () => {
  await db.sync();
  console.log("✅ Running Database...");
})();

app.use(
  cors({
    origin: "http://localhost:5173", // sesuaikan dengan port frontend
    // origin: "http://localhost:3000",
    credentials: true,
  }),
);
app.use(cookieParser());
app.use(
  session({
    secret: "yourSecretKey",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false, // true jika HTTPS
      httpOnly: true,
      sameSite: "lax", // atau "none" jika cross-site
    },
  }),
);
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
// app.use(express.json());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));
app.use(UserRoute);
app.use(DepartmentRoute);
app.use(PositionRoute);
app.use(RoleRoute);
app.use(WorkShiftRoute);
app.use(AttendanceRoute);
app.use(AuthRoute);
app.use(ProfessionRoute);
app.use(DivisionRoute);
app.use(ShiftAssignmentRoute);
app.use(ShiftExchangeRoute);
app.use(UserActivityRoute);

app.use(LeaveSubTypeRoute);
app.use(LeaveTypeRoute);
app.use(LeaveRequestRoute);
app.use(GeoFence);
app.use(QrRoute);
app.use(MedicalActionRoute);
app.use(CalendarRoute);
app.use(ReportHistory);

// app.use(RefreshTokenRoute);
app.use(qrRoute);
// store.sync(); // membuat tabel session jika belum ada

// Jalankan job cek presensi otomatis
autoAbsentJob();
autoExpireLeaveJob();
autoExpireShiftExchangeJob();
autoLeaveCheckerJob();

// app.listen(3000, () => {
//   console.log("Server up and running ...");
// });

app.listen(3000, "0.0.0.0", () => {
  console.log("Server up and running ... 17 April 2026");
});

// pada terminal nodemon index.js atau nodemon index

// ganti pake jsonwebtoken
// npm install jsonwebtoken
