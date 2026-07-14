import "dotenv/config";

import express from "express";
import cors from "cors";
// import dotenv from "dotenv"; // kalo dihapus maka dotenv.config() di comment
import cookieParser from "cookie-parser";
import session from "express-session";
import path from "path";
import { fileURLToPath } from "url";

import db from "./config/Database.js";
import "./models/association.js";
// import RefreshTokenRoute from "./router/RefreshTokenRoute.js";
// import qrRoute from "./router/qrRoute.js";

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
import ReportHistoriesRoute from "./router/ReportHistoriesRoute.js";
import NotificationRoute from "./router/NotificationRoute.js";

// dotenv.config();

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isProduction = process.env.NODE_ENV === "production";
const PORT = Number(process.env.PORT) || 3000;

if (isProduction) {
  app.set("trust proxy", 1);
}

// (async () => {
//   await db.sync();
//   console.log("✅ Running Database...");
// })();

(async () => {
  try {
    await db.authenticate();

    if (!isProduction) {
      await db.sync();
    }
  } catch (e) {
    console.error("❌ Database connection failed:", e);
    process.exit(1);
  }
})();

app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    // origin: "http://localhost:5173", // sesuaikan dengan port frontend
    // origin: "http://localhost:3000",
    credentials: true,
  }),
);

/*
|--------------------------------------------------------------------------
| Middleware dasar
|--------------------------------------------------------------------------
*/
app.use(cookieParser());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));
app.use(
  session({
    // secret: "yourSecretKey",
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      //   secure: false, // true jika HTTPS
      secure: isProduction,
      httpOnly: true,
      //   sameSite: "lax", // atau "none" jika cross-site
      sameSite: isProduction ? "none" : "lax",
    },
  }),
);

const getMemoryUsageMb = () => {
  const memory = process.memoryUsage();

  return {
    heapUsed: Math.round(memory.heapUsed / 1024 / 1024),
    heapTotal: Math.round(memory.heapTotal / 1024 / 1024),
    rss: Math.round(memory.rss / 1024 / 1024),
  };
};

app.use((req, res, next) => {
  const startMemory = getMemoryUsageMb();

  console.log(
    `[REQUEST START] ${req.method} ${req.originalUrl} | ` +
      `heap=${startMemory.heapUsed}/${startMemory.heapTotal} MB | ` +
      `rss=${startMemory.rss} MB`,
  );

  res.on("finish", () => {
    const endMemory = getMemoryUsageMb();

    console.log(
      `[REQUEST END] ${req.method} ${req.originalUrl} | ` +
        `status=${res.statusCode} | ` +
        `heap=${endMemory.heapUsed}/${endMemory.heapTotal} MB | ` +
        `rss=${endMemory.rss} MB`,
    );
  });

  next();
});

/*
|--------------------------------------------------------------------------
| File upload
|--------------------------------------------------------------------------
*/
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

/*
|--------------------------------------------------------------------------
| Health check
|--------------------------------------------------------------------------
*/
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    message: "Backend berjalan",
  });
});

/*
|--------------------------------------------------------------------------
| Routes
|--------------------------------------------------------------------------
*/
// app.use(express.json());
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
app.use(ReportHistoriesRoute);
app.use(NotificationRoute);

// app.use(RefreshTokenRoute);
// app.use(qrRoute);
// store.sync(); // membuat tabel session jika belum ada

// Jalankan job cek presensi otomatis
autoAbsentJob();
autoExpireLeaveJob();
autoExpireShiftExchangeJob();
autoLeaveCheckerJob();

// app.listen(3000, () => {
//   console.log("Server up and running ...");
// });

// app.listen(3000, "0.0.0.0", () => {
//   console.log("Server up and running ... 17 April 2026");
// });

console.log("=== TIMEZONE CHECK ===");
console.log("TZ ENV:", process.env.TZ);
console.log("Node Time:", new Date().toString());
console.log(
  "Resolved Timezone:",
  Intl.DateTimeFormat().resolvedOptions().timeZone,
);

// 13 juli 2026
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server up and running on port ${PORT}`);
});

// pada terminal nodemon index.js atau nodemon index

// ganti pake jsonwebtoken
// npm install jsonwebtoken
