import { Op } from "sequelize";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc.js";
import timezone from "dayjs/plugin/timezone.js";
import sequelize from "../config/Database.js";
import { Sequelize } from "sequelize";

import Attendances from "../models/AttendanceModel.js";
import Users from "../models/UserModel.js";
import Position from "../models/PositionModel.js";
import Department from "../models/DepartmentModel.js";
import Division from "../models/DivisionModel.js";
import Role from "../models/RoleModel.js";
import WorkShift from "../models/WorkShiftModel.js";
import Profession from "../models/ProfessionModel.js";
import ShiftAssignment from "../models/ShiftAssignmentModel.js";
import UserActivity from "../models/UserActivityModel.js";
import LeaveRequest from "../models/LeaveRequestModel.js";
import LeaveType from "../models/LeaveTypeModel.js";
import { isUserOnLeave } from "../helpers/isUserOnLeave.js";
import QrCodeToken from "../models/QrCodeToken.js";
import GeoFence from "../models/GeoFenceModel.js";
import { calculateDistance } from "../utils/calculateDistance.js";
import CalendarDay from "../models/CalendarModel.js";

import * as XLSX from "xlsx";
import moment from "moment";

dayjs.extend(utc);
dayjs.extend(timezone);

// jika rolenya admin, admin super, supervisor, dan manager menampilkan semua presensi termasuk dirinya sendiri, kalo selain role tersebut maka menampilkan presensinya sendiri
export const getAttendances = async (req, res) => {
  try {
    const period = req.query.period || "Bulanan";
    const selectedDateParam = req.query.month;
    let dateFilter = {};
    if (selectedDateParam) {
      let startDate, endDate;
      switch (period) {
        case "Harian":
          const targetDay = new Date(selectedDateParam);
          startDate = new Date(targetDay.setHours(0, 0, 0, 0));
          endDate = new Date(targetDay.setHours(23, 59, 59, 999));
          break;
        case "Mingguan":
          if (selectedDateParam.includes("-W")) {
            const [yearStr, weekStr] = selectedDateParam.split("-W");
            const year = parseInt(yearStr, 10);
            const week = parseInt(weekStr, 10);
            const simpleDate = new Date(year, 0, 1 + (week - 1) * 7);
            const dow = simpleDate.getDay();
            const ISOweekStart = simpleDate;
            if (dow <= 4) {
              ISOweekStart.setDate(
                simpleDate.getDate() - simpleDate.getDay() + 1,
              );
            } else {
              ISOweekStart.setDate(
                simpleDate.getDate() + 8 - simpleDate.getDay(),
              );
            }
            startDate = new Date(ISOweekStart);
            startDate.setHours(0, 0, 0, 0);
            endDate = new Date(startDate);
            endDate.setDate(startDate.getDate() + 6);
            endDate.setHours(23, 59, 59, 999);
          } else {
            const fallbackDate = new Date(selectedDateParam);
            const fbDay = fallbackDate.getDay();
            const fbDiffToMonday =
              fallbackDate.getDate() - fbDay + (fbDay === 0 ? -6 : 1);
            startDate = new Date(
              new Date(fallbackDate).setDate(fbDiffToMonday),
            );
            startDate.setHours(0, 0, 0, 0);
            endDate = new Date(
              new Date(startDate).setDate(startDate.getDate() + 6),
            );
            endDate.setHours(23, 59, 59, 999);
          }
          break;
        case "Bulanan":
        default:
          const targetMonth = new Date(selectedDateParam);
          startDate = new Date(
            targetMonth.getFullYear(),
            targetMonth.getMonth(),
            1,
            0,
            0,
            0,
          );
          endDate = new Date(
            targetMonth.getFullYear(),
            targetMonth.getMonth() + 1,
            0,
            23,
            59,
            59,
            999,
          );
          break;
      }
      dateFilter.date = { [Op.between]: [startDate, endDate] };
    }

    let response;
    if (["Admin", "Supervisor", "Manager", "Super Admin"].includes(req.role)) {
      response = await Attendances.findAll({
        where: { ...dateFilter },
        attributes: [
          "id",
          "date",
          "checkInTime",
          "checkOutTime",
          "checkInLocation",
          "checkOutLocation",
          "attendanceStatus",
          "notes",
          "source",
          "leaveRequestId",
          "workShiftId",
          //   "evidencePhoto",
          "checkInEvidencePhoto",
          "checkOutEvidencePhoto",
        ],
        include: [
          {
            model: Users,
            attributes: [
              "id",
              "titlePrefix",
              "fullName",
              "nip",
              "email",
              "profilePhoto",
              "employmentType",
            ],
            include: [
              {
                model: Position,
                attributes: ["id", "name"],
                include: [
                  {
                    model: Division,
                    attributes: ["id", "name"],
                    include: [
                      {
                        model: Department,
                        attributes: ["id", "name"],
                      },
                    ],
                  },
                ],
              },
              {
                model: Profession,
                attributes: ["id", "name"],
              },
              {
                model: WorkShift,
                attributes: ["id", "name", "startTime", "endTime"],
              },
              {
                model: Role,
              },
              {
                model: ShiftAssignment,
                attributes: ["id", "workShiftId", "date", "userId"],
                include: [
                  {
                    model: WorkShift,
                    attributes: ["id", "name", "startTime", "endTime"],
                  },
                ],
              },
            ],
          },
          {
            model: LeaveRequest,
            attributes: [
              "id",
              "userId",
              "leaveTypeId",
              "leaveSubTypeId",
              "startDate",
              "endDate",
              "note",
              "status",
            ],
          },
        ],
        order: [["date", "ASC"]],
      });
    } else {
      // hanya menampilkan data absensi user yang sedang login
      response = await Attendances.findAll({
        attributes: [
          "id",
          "date",
          "checkInTime",
          "checkOutTime",
          "checkInLocation",
          "checkOutLocation",
          "attendanceStatus",
          "notes",
          "source",
          "leaveRequestId",
        ],
        where: {
          userId: req.userId,
        },
      });
    }

    const dataWithAvatar = response.map((att) => {
      const attend = att.toJSON();

      if (attend.user) {
        attend.user.avatarUrl = attend.user.profilePhoto
          ? `http://localhost:3000/uploads/profilePhotos/${attend.user.profilePhoto}`
          : null;
      }
      return attend;
    });
    res.status(200).json({
      message: "Berhasil menampilkan data absensi",
      data: dataWithAvatar,
    });
  } catch (e) {
    console.log(e);
    res
      .status(500)
      .json({ message: "Gagal mengambil data absensi", error: e.message });
  }
};

// hanya admin, admin super, supervisor, dan manager
export const getAttendanceById = async (req, res) => {
  try {
    const attend = await Attendances.findOne({
      where: {
        id: req.params.id,
      },
      include: [
        {
          model: Users,
          attributes: [
            "id",
            "titlePrefix",
            "fullName",
            "titleSuffix",
            "nip",
            "email",
            "profilePhoto",
          ],
          include: [
            {
              model: Position,
              attributes: ["id", "name"],
              include: [
                {
                  model: Division,
                  attributes: ["id", "name"],
                  include: [
                    {
                      model: Department,
                      attributes: ["id", "name"],
                    },
                  ],
                },
              ],
            },
            {
              model: Profession,
              attributes: ["id", "name"],
            },
            {
              model: WorkShift,
              attributes: ["id", "name", "startTime", "endTime"],
            },
            {
              model: Role,
              attributes: ["id", "name"],
            },
            {
              model: ShiftAssignment,
              attributes: ["id", "workShiftId", "date", "userId"],
              include: [
                {
                  model: WorkShift,
                  attributes: ["id", "name", "startTime", "endTime"],
                },
              ],
            },
          ],
        },
        {
          model: LeaveRequest,
          attributes: [
            "id",
            "userId",
            "leaveTypeId",
            "leaveSubTypeId",
            "startDate",
            "endDate",
            "note",
            "status",
          ],
        },
      ],
    });

    if (!attend)
      return res.status(404).json({ message: "Data absensi tidak ditemukan" });

    if (
      req.role === "Admin" ||
      req.role === "Super Admin" ||
      req.role === "Supervisor" ||
      req.role === "Manager" ||
      attend.userId === req.userId
    ) {
      const dataUser = attend.toJSON();
      if (dataUser.user) {
        dataUser.user.avatarUrl = dataUser.user.profilePhoto
          ? `http://localhost:3000/uploads/profilePhotos/${dataUser.user.profilePhoto}`
          : null;
      }
      res.status(200).json({
        message: "Berhasil menampilkan data absensi by id",
        data: dataUser,
      });
    } else {
      res.status(403).json({
        message: "Akses ditolak!",
      });
    }
  } catch (e) {
    console.log(e);
    res.status(500).json({ message: e.message });
  }
};

export const getAttendanceByNipOrName = async (req, res) => {
  const { q } = req.query;
  if (!q)
    return res.status(400).json({ message: "Query pencarian diperlukan" });

  const query = q.trim();

  try {
    const attendance = await Attendances.findAll({
      include: [
        {
          model: Users,
          required: true,
          attributes: ["nip", "titlePrefix", "fullName", "titleSuffix"],
          where: {
            [Op.or]: [
              { nip: { [Op.like]: `%${query}%` } },
              { titlePrefix: { [Op.like]: `%${query}%` } },
              { fullName: { [Op.like]: `%${query}%` } },
              { titleSuffix: { [Op.like]: `%${query}%` } },
            ],
          },
        },
      ],
      order: [["date", "ASC"]],
    });

    if (!attendance.length) {
      return res.status(404).json({ message: "Data absensi tidak ditemukan" });
    }

    res.status(200).json({
      message: "Berhasil menampilkan data absensi",
      data: attendance,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Gagal menampilkan data absensi",
      error: error.message,
    });
  }
};

export const getMyAttedances = async (req, res) => {
  try {
    const response = await Attendances.findAll({
      where: {
        userId: req.userId,
      },
      attributes: [
        "id",
        "date",
        "checkInTime",
        "checkOutTime",
        "checkInLocation",
        "checkOutLocation",
        // "evidencePhoto",
        "checkInEvidencePhoto",
        "checkOutEvidencePhoto",
        "attendanceStatus",
        "notes",
      ],
      include: [
        {
          model: Users,
          attributes: [
            "id",
            "titlePrefix",
            "fullName",
            "titleSuffix",
            "nip",
            "email",
            "profilePhoto",
          ],
        },
      ],
      include: [
        {
          model: WorkShift,
          attributes: ["id", "name", "startTime", "endTime"],
        },
        {
          model: ShiftAssignment,
          attributes: ["id", "date", "workshiftId"],
          include: [
            {
              model: WorkShift,
              attributes: ["id", "name", "startTime", "endTime"],
            },
          ],
        },
      ],
      order: [["date", "DESC"]],
    });
    const dataWithLateInfo = response.map((attendance) => {
      const attendanceData = attendance.toJSON();
      let lateMinutes = 0;
      const workShift =
        attendanceData.WorkShift ||
        attendanceData.workShift ||
        (attendanceData.ShiftAssignment &&
          (attendanceData.ShiftAssignment.WorkShift ||
            attendanceData.ShiftAssignment.workShift));

      if (attendanceData.checkInTime && workShift && workShift.startTime) {
        const checkInDate = new Date(attendanceData.checkInTime);
        const checkInWIB = new Date(
          checkInDate.toLocaleString("en-US", { timeZone: "Asia/Jakarta" }),
        );
        const checkInTotalMins =
          checkInWIB.getHours() * 60 + checkInWIB.getMinutes();
        const [sHour, sMinute] = workShift.startTime.split(":");
        const shiftTotalMins = parseInt(sHour) * 60 + parseInt(sMinute);
        const toleranceThreshold = shiftTotalMins + 15;
        if (checkInTotalMins > toleranceThreshold) {
          lateMinutes = checkInTotalMins - toleranceThreshold;
        }
      }
      return {
        ...attendanceData,
        lateTime: lateMinutes > 0 ? lateMinutes : null,
      };
    });
    res.status(200).json({
      message: "Berhasil menampilkan data presensi diri sendir",
      data: dataWithLateInfo,
    });
  } catch (e) {
    res.status(500).json({
      message: "Gagal mengambil data presensi diri sendir",
      error: e.message,
    });
  }
};

export const getAttendancesByUserId = async (req, res) => {
  try {
    const response = await Attendances.findAll({
      where: {
        userId: req.params.id,
      },
      include: [
        {
          model: Users,
          attributes: [
            "titlePrefix",
            "fullName",
            "titleSuffix",
            "nip",
            "professionId",
            "positionId",
            "email",
            "phone",
            "joinDate",
            "employmentType",
            "status",
            "profilePhoto",
          ],
        },
      ],
    });

    if (!response) return res.status(404).json({ msg: "Data tidak ditemukan" });

    res.status(200).json({ data: response });
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};

export const getAttendanceReport = async (req, res) => {
  try {
    const now = dayjs();
    const month = req.query.month ? parseInt(req.query.month) : now.month() + 1;
    const year = req.query.year ? parseInt(req.query.year) : now.year();

    if (isNaN(month) || isNaN(year)) {
      return res
        .status(400)
        .json({ message: "Parameter bulan dan tahun harus berupa angka!" });
    }

    const attendances = await Attendances.findAll({
      where: {
        [Op.and]: [
          Sequelize.where(Sequelize.fn("MONTH", Sequelize.col("date")), month),
          Sequelize.where(Sequelize.fn("YEAR", Sequelize.col("date")), year),
        ],
      },
      include: [
        {
          model: Users,
          attributes: [
            "id",
            "fullName",
            "nip",
            "employmentType",
            "profilePhoto",
          ],
          include: [
            {
              model: Position,
              attributes: ["id", "name"],
              include: [
                {
                  model: Division,
                  attributes: ["id", "name"],
                  include: [{ model: Department, attributes: ["id", "name"] }],
                },
              ],
            },
          ],
        },
        {
          model: WorkShift,
          as: "workShift",
          attributes: ["startTime", "endTime", "name"],
        },
      ],
      order: [["date", "ASC"]],
    });

    const reportData = attendances.map((att) => {
      const item = att.toJSON();
      const user = item.user;

      // 1. Tentukan Jadwal Kerja
      let schedule = item.workShift ||
        (user && user.workShift) || {
          startTime: "07:00:00",
          endTime: "15:00:00",
        };

      // Definisikan jam mulai dan selesai di awal agar bisa dipakai di semua logika
      const [sHour, sMin] = schedule.startTime.split(":").map(Number);
      const [eHour, eMin] = schedule.endTime.split(":").map(Number);

      const TOLERANSI = 15;
      let lateMinutes = 0;
      let earlyDepartureMinutes = 0;
      let overtimeMinutes = 0;

      const checkIn = item.checkInTime
        ? dayjs(item.checkInTime).tz("Asia/Jakarta")
        : null;
      const checkOut = item.checkOutTime
        ? dayjs(item.checkOutTime).tz("Asia/Jakarta")
        : null;

      // 2. Logika Hitung Telat (Check In)
      //   if (item.checkInTime && item.attendanceStatus !== "Tidak Hadir") {
      //     const checkIn = dayjs(item.checkInTime).tz("Asia/Jakarta");
      //     const [sHour, sMin] = schedule.startTime.split(":").map(Number);
      //     const totalMinIn = checkIn.hour() * 60 + checkIn.minute();
      //     const totalMinShift = sHour * 60 + sMin;

      //     let diffIn = 0;
      //     if (sHour === 23 && checkIn.hour() < 12) {
      //       diffIn = totalMinIn + 1440 - totalMinShift;
      //     } else {
      //       diffIn = totalMinIn - totalMinShift;
      //     }

      //     // if (diffIn > TOLERANSI) lateMinutes = diffIn;
      //     if (diffIn > TOLERANSI) {
      //       // Jika lebih dari 15 menit, hitung full menit telatnya
      //       lateMinutes = diffIn;
      //     } else {
      //       // Jika 0-15 menit, dianggap tepat waktu (0 menit telat)
      //       lateMinutes = 0;
      //     }
      //   }
      if (checkIn && item.attendanceStatus !== "Tidak Hadir") {
        const totalMinIn = checkIn.hour() * 60 + checkIn.minute();
        const totalMinShift = sHour * 60 + sMin;

        let diffIn = 0;
        // Penanganan shift malam (contoh mulai jam 23:00)
        if (sHour === 23 && checkIn.hour() < 12) {
          diffIn = totalMinIn + 1440 - totalMinShift;
        } else {
          diffIn = totalMinIn - totalMinShift;
        }

        lateMinutes = diffIn > TOLERANSI ? diffIn : 0;
      }

      // 3. Logika Hitung Pulang Cepat (Check Out)
      //   if (item.checkOutTime) {
      //     const checkOut = dayjs(item.checkOutTime).tz("Asia/Jakarta");
      //     const [eHour, eMin] = schedule.endTime.split(":").map(Number);
      //     const totalMinOut = checkOut.hour() * 60 + checkOut.minute();
      //     const totalMinShiftOut = eHour * 60 + eMin;

      //     // Selisih jika pulang sebelum jamnya
      //     // (Bisa dikembangkan lagi jika ada shift malam yang pulang besok paginya)
      //     const diffOut = totalMinShiftOut - totalMinOut;
      //     if (diffOut > 0) {
      //       earlyDepartureMinutes = diffOut;
      //     }
      //   }
      if (checkOut) {
        // Tentukan waktu seharusnya selesai (sEnd)
        let sEnd = dayjs(item.date)
          .tz("Asia/Jakarta")
          .hour(eHour)
          .minute(eMin)
          .second(0);

        // Jika shift malam (pulang besoknya), tambah 1 hari pada target pulang
        if (eHour < sHour) {
          sEnd = sEnd.add(1, "day");
        }

        // Hitung Lembur (Checkout SETELAH jadwal selesai)
        const diffOvertime = checkOut.diff(sEnd, "minute");
        if (diffOvertime > 0) {
          overtimeMinutes = diffOvertime;
        }

        // Hitung Pulang Cepat (Checkout SEBELUM jadwal selesai)
        const diffEarly = sEnd.diff(checkOut, "minute");
        if (diffEarly > 0) {
          earlyDepartureMinutes = diffEarly;
        }
      }

      //   // 4. Logika Hitung Lembur (Checkout > ScheduleEnd)
      //   if (item.checkOutTime) {
      //     const checkOut = dayjs(item.checkOutTime).tz("Asia/Jakarta");
      //     const [eHour, eMin] = schedule.endTime.split(":").map(Number);

      //     let sEnd = dayjs(item.date).tz("Asia/Jakarta").hour(eHour).minute(eMin);
      //     // Jika shift malam (pulang besoknya)
      //     if (eHour < sHour) sEnd = sEnd.add(1, "day");

      //     const diffOvertime = checkOut.diff(sEnd, "minute");
      //     if (diffOvertime > 0) {
      //       overtimeMinutes = diffOvertime; // Inilah menit lemburnya
      //     }
      //   }

      const avatarUrl = user?.profilePhoto
        ? `http://localhost:3000/uploads/profilePhotos/${user.profilePhoto}`
        : null;

      return {
        id: item.id,
        date: item.date,
        checkInTime: item.checkInTime,
        checkOutTime: item.checkOutTime,
        attendanceStatus: item.attendanceStatus,
        lateMinutes: lateMinutes,
        earlyDepartureMinutes: earlyDepartureMinutes,
        scheduleName: schedule.name || "Normal",
        scheduleIn: schedule.startTime,
        scheduleOut: schedule.endTime,
        overtimeMinutes: overtimeMinutes,
        divisionName: user?.position?.division?.name || "Tanpa Divisi",
        positionName: user?.position?.name || "Tanpa Unit",
        user: {
          ...user,
          avatarUrl,
        },
      };
    });

    res.status(200).json({
      message: "Berhasil memproses laporan presensi",
      count: reportData.length,
      data: reportData,
    });
  } catch (e) {
    console.error("REPORT_ERROR:", e);
    res
      .status(500)
      .json({ message: "Gagal memproses laporan", error: e.message });
  }
};

// PRESENSI LENGKAP (PRESENSI DALAM DAN DINAS LUAR)
export const createAttendance = async (req, res) => {
  try {
    const userId = req.user?.id || req.body.userId;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const {
      checkInLocation,
      checkOutLocation,
      qrToken,
      //   evidencePhoto
      checkInEvidencePhoto,
      checkOutEvidencePhoto,
      attendanceType: reqAttendanceType,
    } = req.body;
    if (!checkInLocation && !checkOutLocation) {
      return res.status(400).json({ message: "Lokasi presensi wajib diisi!" });
    }

    // 1. SETUP WAKTU ZONA JAKARTA (Konsistensi Data)
    const now = dayjs().tz("Asia/Jakarta");
    const todayStr = now.format("YYYY-MM-DD");
    const yesterdayStr = now.subtract(1, "day").format("YYYY-MM-DD");

    // 2. AMBIL IDENTITAS USER
    const user = await Users.findOne({
      where: { id: userId },
      include: [{ model: WorkShift, as: "workShift" }],
    });

    if (!user || user.status === "Nonaktif") {
      return res
        .status(403)
        .json({ message: "Akun Anda tidak aktif. Hubungi tim TI!" });
    }

    // =========================================================================
    // 3. LOGIKA CERDAS PENENTUAN JADWAL (MENGHINDARI TABRAKAN SHIFT & MENDUKUNG LEMBUR)
    // =========================================================================
    let activeShift = null; // Objek shift yang terpilih
    let workingDate = todayStr; // Tanggal kerja yang direkam
    let existingAttendance = null; // Data presensi yang sudah ada di DB
    let isCheckOutAction = false; // Flag apakah user sedang check-out

    // Batas Toleransi Lembur Seragam (Shift & Non-Shift): Maksimal 14 jam setelah jam kerja selesai
    // Contoh: Non-shift selesai 15:00 -> batas checkout 05:00 pagi besoknya.
    // Contoh: Shift Malam selesai 07:00 -> batas checkout 21:00 hari yang sama.
    const MAX_OVERTIME_HOURS = 14;

    // Ambil data libur hari ini jika ada pada database
    const todayHoliday = await CalendarDay.findOne({
      where: { date: todayStr, isHoliday: true },
    });

    if (user.employmentType === "Shift") {
      const assignments = await ShiftAssignment.findAll({
        where: { userId, date: [yesterdayStr, todayStr] },
        include: [{ model: WorkShift, as: "workShift" }],
        order: [
          ["date", "ASC"],
          [{ model: WorkShift, as: "workShift" }, "startTime", "ASC"],
        ],
      });

      // LOOPING UNTUK MENCARI TARGET SHIFT
      for (const sa of assignments) {
        const [sh, sm] = sa.workShift.startTime.split(":").map(Number);
        const [eh, em] = sa.workShift.endTime.split(":").map(Number);

        const sStart = dayjs.tz(
          `${sa.date} ${String(sh).padStart(2, "0")}:${String(sm).padStart(2, "0")}:00`,
          "Asia/Jakarta",
        );
        let sEnd = dayjs.tz(
          `${sa.date} ${String(eh).padStart(2, "0")}:${String(em).padStart(2, "0")}:00`,
          "Asia/Jakarta",
        );
        if (sEnd.isBefore(sStart)) sEnd = sEnd.add(1, "day"); // Penanganan shift lintas hari (malam)

        const maxCheckOutLimit = sEnd.add(MAX_OVERTIME_HOURS, "hour");

        // Cek apakah ada record di DB untuk jadwal ini
        const attend = await Attendances.findOne({
          where: { userId, shiftAssignmentId: sa.id },
        });

        // PRIORITAS 1: Apakah ada shift menggantung? (Sudah check-in, belum check-out, dan masih dalam batas lembur)
        if (attend && attend.checkInTime && !attend.checkOutTime) {
          if (now.isBefore(maxCheckOutLimit)) {
            activeShift = sa;
            workingDate = sa.date;
            existingAttendance = attend;
            isCheckOutAction = true;
            break; // Hentikan pencarian, selesaikan shift ini dulu
          }
        }

        // PRIORITAS 2: Mencari shift yang terbuka untuk Check-in (H-1 Jam s/d Shift Selesai)
        // Jika statusnya sudah "Tidak Hadir" (dibuat oleh Auto-Job), kita abaikan jadwal ini
        const isMissedShift =
          attend &&
          attend.attendanceStatus === "Tidak Hadir" &&
          attend.checkInTime === null;

        if (!isCheckOutAction && !isMissedShift) {
          if (now.isAfter(sStart.subtract(1, "hour")) && now.isBefore(sEnd)) {
            // Memastikan belum ada presensi masuk
            if (!attend || (attend && !attend.checkInTime)) {
              //   activeShift = sa;
              //   workingDate = sa.date;
              //   existingAttendance = attend; // Null jika belum ada record sama sekali
              //   isCheckOutAction = false;
              //   // Jangan break dulu, biarkan loop berjalan siapa tahu ada Prioritas 1 di jadwal berikutnya

              // PERBAIKAN 2: Jika activeShift KOSONG, baru diisi.
              // Jika sudah ada isinya (misal dari shift pagi), JANGAN ditimpa oleh shift siang!
              if (!activeShift) {
                activeShift = sa;
                workingDate = sa.date;
                existingAttendance = attend;
                isCheckOutAction = false;
              }
            }
          }
        }
      }
    } else {
      // LOGIKA KARYAWAN NON-SHIFT (PNS / BIASA)
      // PRIORITAS 1: Cari apakah ada presesi menggantung dari hari INI atau KEMARIN
      const pendingAttend = await Attendances.findOne({
        where: {
          userId,
          workShiftId: user.workShiftId,
          date: [todayStr, yesterdayStr],
          checkInTime: { [Op.not]: null },
          checkOutTime: null,
          attendanceStatus: {
            [Op.notIn]: ["Tidak Valid", "Tidak Hadir"],
          },
        },
      });

      let handledAsCheckout = false;
      if (pendingAttend) {
        // ADA DATA MENGGANTUNG -> INI ADALAH PROSES CHECK-OUT LEMBUR
        const sEnd = dayjs.tz(`${pendingAttend.date} 15:00:00`, "Asia/Jakarta");
        const maxCheckOutLimit = sEnd.add(MAX_OVERTIME_HOURS, "hour");
        if (now.isBefore(maxCheckOutLimit)) {
          // Masih dalam batas waktu lembur/kepulangan
          activeShift = { id: null, workShift: user.workShift };
          existingAttendance = pendingAttend;
          isCheckOutAction = true;
          workingDate = pendingAttend.date; // PENTING: Set tanggal kerja ke hari Jumat (hari dia masuk)
          // PERBAIKAN: SET FLAG INI AGAR TIDAK TERBACA SEBAGAI CHECK-IN BARU!
          handledAsCheckout = true;
        }
        // else {
        //   return res.status(400).json({
        //     message: "Batas waktu kepulangan jam kerja Anda telah berakhir!",
        //   });
        // }
      }

      if (!handledAsCheckout) {
        // PRIORITAS 2: TIDAK ADA DATA MENGGANTUNG -> INI PROSES CHECK-IN
        // Karena ini Check-in, barulah kita validasi apakah hari ini libur
        if (now.day() === 0 || now.day() === 6) {
          return res
            .status(200)
            .json({ message: "Hari libur, tidak perlu presensi!" });
        }
        // Jika hari ini libur nasional/RS dan berlaku untuk Non-Medis atau Semua
        if (
          todayHoliday &&
          ["Semua", "Non-Medis"].includes(todayHoliday.appliesTo)
        ) {
          return res.status(200).json({
            message: `Hari ini libur: ${todayHoliday.description}. Anda tidak perlu presensi`,
          });
        }

        // Anggap jadwal adalah hari ini
        const sStart = dayjs.tz(`${todayStr} 07:00:00`, "Asia/Jakarta");
        const sEnd = dayjs.tz(`${todayStr} 15:00:00`, "Asia/Jakarta");
        const maxCheckOutLimit = sEnd.add(MAX_OVERTIME_HOURS, "hour"); // Batas absen pulang jam 05:00 besoknya

        const attend = await Attendances.findOne({
          where: { userId, date: todayStr, workShiftId: user.workShiftId },
        });

        // Tentukan apakah sedang Check-Out atau Check-In
        if (attend && attend.checkInTime && !attend.checkOutTime) {
          if (now.isBefore(maxCheckOutLimit)) {
            activeShift = { id: null, workShift: user.workShift };
            existingAttendance = attend;
            isCheckOutAction = true;
          } else {
            return res.status(400).json({
              message:
                "Batas waktu kepulangan untuk shift Anda telah berakhir!",
            });
          }
        } else {
          // Logika Check-In Non-Shift
          if (now.isAfter(sStart.subtract(1, "hour")) && now.isBefore(sEnd)) {
            if (!attend || (attend && !attend.checkInTime)) {
              activeShift = { id: null, workShift: user.workShift };
              existingAttendance = attend;
              isCheckOutAction = false;
            }
          }
        }
      }
    }
    // Jika tidak ditemukan shift yang valid untuk interaksi
    if (!activeShift) {
      return res.status(404).json({
        message:
          "Tidak ada jadwal aktif untuk presensi saat ini, atau jam kerja telah berakhir!",
      });
    }

    // 4. VALIDASI IZIN / DINAS LUAR
    const onLeave = await isUserOnLeave(userId, workingDate);
    let isDinasLuar = false;
    let attendanceType = "INSIDE";
    let relatedLeaveId = null;

    if (isCheckOutAction && existingAttendance) {
      // Jika sedang Checkout, warisi status Dinas Luar dari saat Check-in!
      isDinasLuar = existingAttendance.attendanceType === "OUTSIDE";
      attendanceType = existingAttendance.attendanceType;
    } else {
      // Jika Check-in baru, cek tabel Cuti/Izin
      if (onLeave) {
        // const typeName = onLeave.leaveType?.name.toUpperCase();
        const typeName = onLeave.leavetype?.name.toUpperCase();
        if (typeName === "DINAS LUAR") {
          isDinasLuar = true;
          attendanceType = "OUTSIDE";
          relatedLeaveId = onLeave.id;
        } else if (["CUTI", "IZIN"].includes(typeName)) {
          return res.status(403).json({
            message: `Anda sedang ${typeName} pada tanggal ${workingDate}.`,
          });
        }
      }
      if (!isDinasLuar && reqAttendanceType === "OUTSIDE") {
        isDinasLuar = true;
        attendanceType = "OUTSIDE";
      }
    }
    const activeEvidencePhoto = isCheckOutAction
      ? checkOutEvidencePhoto
      : checkInEvidencePhoto;

    // 5. VALIDASI QR & GEOFENCE
    if (isDinasLuar) {
      //   if (!evidencePhoto)
      if (!activeEvidencePhoto)
        return res
          .status(400)
          .json({ message: "Dinas Luar wajib unggah foto bukti!" });
    } else {
      if (!qrToken)
        return res.status(400).json({ message: "QR Code tidak ditemukan!" });

      const qr = await QrCodeToken.findOne({ where: { token: qrToken } });
      if (!qr || dayjs().isAfter(dayjs(qr.expiresAt))) {
        return res
          .status(400)
          .json({ message: "QR Code tidak valid atau kedaluwarsa!" });
      }
      //   // Cek Geofence
      //   let geoFence = await GeoFence.findOne({ where: { isActive: true } });
      //   if (!geoFence) {
      //     // Fallback Geofence
      //     geoFence = {
      //       latitude: parseFloat(process.env.GEOFENCE_LAT),
      //       longitude: parseFloat(process.env.GEOFENCE_LNG),
      //       radius: 150,
      //     };
      //   }

      //   const locationCheck = checkInLocation || checkOutLocation;
      //   const [lat, lng] = locationCheck
      //     .split(",")
      //     .map((c) => parseFloat(c.trim()));
      //   if (isNaN(lat) || isNaN(lng))
      //     return res.status(400).json({ message: "Format lokasi tidak valid!" });

      //   const distance = calculateDistance(
      //     geoFence.latitude,
      //     geoFence.longitude,
      //     lat,
      //     lng,
      //   );
      //   if (distance > geoFence.radius) {
      //     return res.status(400).json({
      //       message: `Anda di luar area! Jarak: ${Math.round(distance)}m. Maks: ${geoFence.radius}m`,
      //     });
      //   }
    }

    // 6. EKSEKUSI PRESENSI (CHECK-OUT ATAU CHECK-IN)
    const shift = activeShift.workShift;
    const [sh, sm] = shift.startTime.split(":").map(Number);
    const shiftStart = dayjs.tz(
      `${workingDate} ${String(sh).padStart(2, "0")}:${String(sm).padStart(2, "0")}:00`,
      "Asia/Jakarta",
    );
    const toleranceBound = shiftStart.add(15, "minute"); // Toleransi keterlambatan 15 menit

    // --- PROSES CHECK-OUT ---
    if (isCheckOutAction) {
      // Validasi tambahan: Jika mencoba pulang sebelum jadwal selesai (Optional, sesuaikan aturan RS)
      // Jika RS membolehkan pulang cepat (dengan status tertentu), hapus if ini.
      let sEnd = dayjs.tz(
        `${workingDate} ${activeShift.workShift.endTime}`,
        "Asia/Jakarta",
      );
      if (sEnd.isBefore(shiftStart)) sEnd = sEnd.add(1, "day"); // format lintas hari

      if (now.isBefore(sEnd)) {
        return res.status(400).json({
          message: "Belum waktunya pulang! Tunggu hingga jam kerja berakhir",
        });
      }

      existingAttendance.checkOutTime = now.toDate();
      existingAttendance.checkOutLocation = checkOutLocation || checkInLocation;

      //   // TAMBAHAN: Simpan foto pulang ke kolom yang benar
      //   if (isDinasLuar && evidencePhoto) {
      //     existingAttendance.checkOutEvidencePhoto = evidencePhoto;
      //   }
      if (isDinasLuar && checkOutEvidencePhoto) {
        existingAttendance.checkOutEvidencePhoto = checkOutEvidencePhoto;
      }

      // Jika saat masuk "Tidak Valid" (karena koneksi dsb), kita perbaiki statusnya saat pulang
      if (existingAttendance.attendanceStatus === "Tidak Valid") {
        existingAttendance.attendanceStatus = dayjs(
          existingAttendance.checkInTime,
        ).isAfter(toleranceBound)
          ? "Terlambat"
          : "Hadir";
      }

      await existingAttendance.save();
      await UserActivity.create({
        userId,
        category: "attendance",
        action: "completed",
        title: "Presensi Pulang Berhasil",
        referenceId: existingAttendance.id,
        description: `Presensi pulang berhasil pada jam ${now.format("HH:mm")}`,
      });

      return res.status(200).json({
        message: "Presensi pulang berhasil!",
        data: existingAttendance,
      });
    }

    // --- PROSES CHECK-IN ---
    else {
      // PERBAIKAN LOGIKA DISINI: Default presensi adalah "Hadir"
      //   let statusAttend = "Hadir";
      let statusAttend = isDinasLuar ? "Dinas Luar" : "Hadir";
      if (!isDinasLuar && now.isAfter(toleranceBound))
        statusAttend = "Terlambat";

      const workShiftId = activeShift.workShift.id || user.workShiftId;
      const newAttend = await Attendances.create({
        userId,
        date: workingDate,
        checkInTime: now.toDate(),
        checkInLocation: checkInLocation,
        attendanceStatus: statusAttend,
        attendanceType: attendanceType,
        source: isDinasLuar ? "Pengajuan" : "Presensi",
        // evidencePhoto: evidencePhoto || null,
        // checkInEvidencePhoto: evidencePhoto || null,
        checkInEvidencePhoto: isDinasLuar ? checkInEvidencePhoto : null,
        shiftAssignmentId: activeShift.id || null,
        workShiftId: workShiftId,
        leaveRequestId: relatedLeaveId || null,
      });

      await UserActivity.create({
        userId,
        category: "attendance",
        action: statusAttend === "Terlambat" ? "late" : "success",
        referenceId: newAttend.id,
        //     title: "Presensi Masuk Berhasil",
        //     description: `Presensi ${statusAttend} berhasil pada jam ${now.format("HH:mm")}`,
        title:
          statusAttend === "Terlambat"
            ? "Presensi Terlambat"
            : "Presensi Masuk Berhasil",
        // description:
        //   statusAttend === "Terlambat"
        //     ? `Anda terlambat melakukan presensi pada tanggal ${now.format("DD MMMM YYYY")} pukul ${now.format("HH:mm")}`
        //     : `Presensi masuk berhasil pada tanggal ${now.format("DD MMMM YYYY")} pukul ${now.format("HH:mm")}`,
        description:
          statusAttend === "Terlambat"
            ? `Anda terlambat melakukan presensi pada pukul ${now.format("HH:mm")}`
            : `Presensi masuk berhasil pada pukul ${now.format("HH:mm")}`,
      });
      return res.status(201).json({
        message: `Presensi masuk berhasil! Status Anda: ${statusAttend}`,
        data: newAttend,
      });
    }
  } catch (error) {
    console.error("EROR_PRESENSI:", error);
    return res
      .status(500)
      .json({ message: "Terjadi kesalahan server", error: error.message });
  }
};

export const updateAttendance = async (req, res) => {
  const { id } = req.params;
  const {
    date,
    checkInTime,
    checkOutTime,
    checkInLocation,
    checkOutLocation,
    attendanceStatus,
    notes,
    source,
    attendanceType,
  } = req.body;

  try {
    const attendance = await Attendances.findOne({ where: { id: id } });
    if (!attendance) {
      return res
        .status(404)
        .json({ message: "Data presensi tidak ditemukan!" });
    }

    // const combineDateTime = (dateStr, timeStr) => {
    //   if (!timeStr || timeStr === "-" || timeStr === "") return null;
    //   return new Date(`${dateStr}T${timeStr}:00`);
    // };

    const parseDateTime = (dateTimeStr) => {
      if (!dateTimeStr || dateTimeStr === "-" || dateTimeStr === "")
        return null;
      return new Date(dateTimeStr); // Sequelize akan otomatis menyimpannya sebagai DATETIME
    };

    await Attendances.update(
      {
        date,
        // checkInTime: combineDateTime(date, checkInTime),
        // checkOutTime: combineDateTime(date, checkOutTime),
        checkInTime: parseDateTime(checkInTime),
        checkOutTime: parseDateTime(checkOutTime),
        checkInLocation: checkInLocation === "-" ? null : checkInLocation,
        checkOutLocation: checkOutLocation === "-" ? null : checkOutLocation,
        attendanceStatus,
        notes,
        source: source || "Manual", // Default ke Manual jika diupdate admin
        attendanceType: attendanceType || attendance.attendanceType || "INSIDE",
      },
      { where: { id: id } },
    );

    const updatedAttendance = await Attendances.findOne({
      where: { id: id },
      include: [
        {
          model: Users,
          attributes: [
            "id",
            "titlePrefix",
            "fullName",
            "titleSuffix",
            "nip",
            "email",
            "employmentType",
          ],
          include: [
            {
              model: Position,
              attributes: ["id", "name"],
              include: [
                {
                  model: Division,
                  attributes: ["id", "name"],
                  include: [{ model: Department, attributes: ["id", "name"] }],
                },
              ],
            },
            {
              model: Profession,
              attributes: ["id", "name"],
            },
            {
              model: WorkShift,
              attributes: ["id", "name", "startTime", "endTime"],
            },
            {
              model: Role,
            },
            {
              model: ShiftAssignment,
              attributes: ["id", "workShiftId", "date", "userId"],
              include: [
                {
                  model: WorkShift,
                  attributes: ["id", "name", "startTime", "endTime"],
                },
              ],
            },
          ],
        },
      ],
    });

    res.status(200).json({
      message: "Berhasil mengubah data absensi",
      data: updatedAttendance,
    });
  } catch (e) {
    console.error(e);
    res
      .status(500)
      .json({ message: "Gagal mengubah data absensi", error: e.message });
  }
};

export const deleteAttendance = async (req, res) => {
  const { id } = req.params;

  try {
    const attendance = await Attendances.findOne({ where: { id: id } });
    if (!attendance) {
      return res.status(404).json({ message: "Data absensi tidak ditemukan" });
    }

    await Attendances.destroy({ where: { id: id } });
    res.status(200).json({ message: "Berhasil menghapus data absensi" });
  } catch (e) {
    console.error(e);
    res
      .status(500)
      .json({ message: "Gagal menghapus data absensi", error: e.message });
  }
};

export const createAttendanceManual = async (req, res) => {
  try {
    const {
      userId,
      date,
      checkInTime,
      checkOutTime,
      checkInLocation,
      checkOutLocation,
      attendanceStatus,
      notes,
    } = req.body;

    if (!userId || !date || !checkInTime || !attendanceStatus) {
      return res
        .status(400)
        .json({ message: "Data wajib diisi belum lengkap!" });
    }

    const user = await Users.findOne({
      where: { id: userId },
      include: [{ model: WorkShift, as: "workShift" }],
    });

    if (!user) return res.status(404).json({ message: "User tidak ditemukan" });

    let finalShiftAssignmentId = null;
    let finalWorkShiftId = user.workShiftId;

    if (user.employmentType === "Shift") {
      // Cari SEMUA assignment user di tanggal tersebut (bisa > 1)
      const assignments = await ShiftAssignment.findAll({
        where: { userId, date: date },
        include: [{ model: WorkShift, as: "workShift" }],
      });

      if (assignments.length === 0) {
        return res.status(404).json({
          message: "Karyawan tidak memiliki jadwal shift pada tanggal ini!",
        });
      }

      if (assignments.length === 1) {
        // Jika hanya 1 shift, langsung pakai
        finalShiftAssignmentId = assignments[0].id;
        finalWorkShiftId = assignments[0].workShiftId;
      } else {
        // LOGIKA SHIFT GANDA: Cari shift yang paling sesuai dengan jam masuk yang diinput admin
        const inputTime = dayjs(`${date} ${checkInTime}`);
        let bestMatch = null;

        for (const sa of assignments) {
          const [sh, sm] = sa.workShift.startTime.split(":").map(Number);
          const [eh, em] = sa.workShift.endTime.split(":").map(Number);

          const shiftStart = dayjs(
            `${date} ${String(sh).padStart(2, "0")}:${String(sm).padStart(2, "0")}`,
          );
          let shiftEnd = dayjs(
            `${date} ${String(eh).padStart(2, "0")}:${String(em).padStart(2, "0")}`,
          );

          if (shiftEnd.isBefore(shiftStart)) shiftEnd = shiftEnd.add(1, "day");

          // Kita beri toleransi: jam masuk manual berada di rentang
          // (Shift Start - 2 jam) sampai (Shift End)
          if (
            inputTime.isAfter(shiftStart.subtract(2, "hour")) &&
            inputTime.isBefore(shiftEnd)
          ) {
            bestMatch = sa;
            break;
          }
        }

        if (bestMatch) {
          finalShiftAssignmentId = bestMatch.id;
          finalWorkShiftId = bestMatch.workShiftId;
        } else {
          // Jika admin input jam yang tidak masuk di akal untuk kedua shift tersebut
          return res.status(400).json({
            message:
              "Jam masuk yang diinput tidak cocok dengan jadwal shift manapun pada hari tersebut!",
          });
        }
      }
    }

    // Cek apakah sudah ada presensi untuk shift yang terpilih ini
    const existing = await Attendances.findOne({
      where: {
        userId,
        date,
        shiftAssignmentId: finalShiftAssignmentId,
        workShiftId: finalWorkShiftId,
      },
    });

    if (existing) {
      return res
        .status(400)
        .json({ message: "Data presensi untuk user ini sudah ada!" });
    }

    const manualAttend = await Attendances.create({
      userId,
      date,
      checkInTime: dayjs(`${date} ${checkInTime}`).toDate(),
      checkOutTime: checkOutTime
        ? dayjs(`${date} ${checkOutTime}`).toDate()
        : null,
      checkInLocation: req.body.checkInLocation || "",
      checkOutLocation: req.body.checkOutLocation || (checkOutTime ? "" : null),
      attendanceStatus,
      attendanceType: "INSIDE",
      source: "Manual",
      notes: notes,
      workShiftId: finalWorkShiftId,
      shiftAssignmentId: finalShiftAssignmentId,
    });

    return res.status(201).json({
      message: "Presensi manual berhasil disimpan!",
      data: manualAttend,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const parseIndonesianDate = (dateStr) => {
  if (!dateStr) return null;
  if (typeof dateStr === "number") {
    return moment(Math.round((dateStr - 25569) * 86400 * 1000)).format(
      "YYYY-MM-DD",
    );
  }
  const normalized = dateStr
    .toString()
    .replace(/Peb/gi, "Feb")
    .replace(/Mei/gi, "May")
    .replace(/Agt/gi, "Aug")
    .replace(/Okt/gi, "Oct")
    .replace(/Nop/gi, "Nov")
    .replace(/Des/gi, "Dec");
  return moment(normalized, "DD MMM YYYY").format("YYYY-MM-DD");
};

// Helper 2: Ubah angka desimal Excel menjadi format Jam
const parseExcelTime = (excelTime) => {
  if (excelTime === undefined || excelTime === null || excelTime === "")
    return null;
  // Jika Excel membaca waktu sebagai angka pecahan hari (misal 0.333333)
  if (typeof excelTime === "number") {
    const totalSeconds = Math.round(excelTime * 86400); // 1 hari = 86400 detik
    const hours = Math.floor(totalSeconds / 3600) % 24;
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  }
  return excelTime.toString().trim();
  // // Fix format string yang cacat dari mesin fingerprint
  // let strTime = excelTime.toString().trim();
  // const parts = strTime.split(/[:.]/);
  // if (parts.length >= 2) {
  //   const h = parts[0].padStart(2, "0");
  //   const m = parts[1].padStart(2, "0");
  //   const s = parts[2] ? parts[2].padStart(2, "0") : "00";
  //   return `${h}:${m}:${s}`;
  // }
  // return strTime;
};

// KETIKA TERJADI PERMASALAHAN NORMALISASI DATA, KETIKA LOGIKA SPLIT INDEX 0 UNTUK PENGAMBILAN DATA PERTAMA PADA KOLOM SHIFT TERDAPAT TULISAN "PAGI OK" KEMUDIAN DILAKUKAN PENCARIAN BERNAMA PAGI DAN BERHASIL DIKENALI PADA TABEL WORKSHIFT ADA ID YANG BERNAMA PAGI. NAMUNK KETIKA TERDAPAT TULISAN "P1 WAT A", "P NICU/PICU", "SM RADIOLOGI", "ATAU MIDDLE" KETIKA DILAKUKAN PENCARIAN SHIFT BERNAMA P1, P, SM, ATAU MIDDLE PADA TABEL WORHSIFT HASILNYA TIDAK DITEMUKAN SEHINGGA ASSIGNMENT GAGAL DIHASILKAN DAN SHIFTASSIGNMENT ID NULL. SOLUSI/PENANGANAN SECARA DASARNYA DARI HASIL WAWANCARA OPERASIONAL RUMAH SAKIT HANYA DIBAGI MENJADI 3 SESI UTAMA: PAGI, SIANG, DAN MALAM. YANG PERLU DILAKUKAN PADA BACKEND DENGAN MEMBUAT FUNGSI MAPPER/PENERJEMAH YANG AKAN MENGELOMPOKKAN BERBAGAI MACAM NAMA UNIK DARI EXCEL KE DALAM 3 KATEGORI STANDAR SHIFT. PERLU DILAKUKAN CREATE SHIFTASSIGNMENT SECARA OTOMATIS OLEH SISTEM (FIND OR CREATE) BERDASARKAN DATA FILE EXCEL, DISEBUT "AUTO ASSIGN SCHEDULE BASED ON ATTENDANCE"

const mapExcelShiftToStandard = (excelShiftName) => {
  if (!excelShiftName) return "Pagi";
  const upperName = excelShiftName.toUpperCase();
  if (
    upperName.includes("24 JAM") ||
    upperName.includes("RK ") ||
    upperName.includes("PK ") ||
    upperName.includes("PK 24 AMBULANCE") ||
    upperName.includes("PK JANGUM")
  )
    return "24 Jam";

  // Ekstrak angka jam pertama dari teks (contoh "14.00-07.00" atau "07:00:00")
  const timeMatch = excelShiftName.match(/(\d{2})[:.]\d{2}/);
  if (timeMatch) {
    const startHour = parseInt(timeMatch[1], 10);
    if (startHour >= 5 && startHour <= 12) return "Pagi";
    if (startHour >= 13 && startHour <= 18) return "Siang";
    if (startHour >= 19 || startHour <= 4) return "Malam";
  }

  if (
    upperName.includes("PAGI") ||
    upperName.includes("P1 ") ||
    upperName.includes("P2 GIZI") ||
    upperName.includes("PS GIZI")
  )
    return "Pagi";

  if (
    upperName.includes("SIANG") ||
    upperName.includes("P2 ") ||
    // upperName.includes("P2 WAT") ||
    // upperName.includes("P2 ICU") ||
    // upperName.includes("P2 BIDAN") ||
    upperName.includes("S ") ||
    upperName.includes("S CCSD") ||
    upperName.includes("MIDDLE ") ||
    upperName.includes("SM ") ||
    upperName.includes("SM RADIOLOGI") ||
    upperName.includes("SM PENDAFTARAN")
  )
    return "Siang";

  if (
    upperName.includes("MALAM") ||
    upperName.includes("P3 ") ||
    upperName.includes("M ") ||
    upperName.includes("MALAM ") ||
    upperName.includes("MALAM RADIOLOGI") ||
    upperName.includes("MALAM SECURITY") ||
    upperName.includes("MALAM KASIR")
  )
    return "Malam";

  return "Pagi";
};

// USER DENGAN SESI SIANG HD: 10.00-18.00 DIANGGAP SESI SIANG (15.00-23.00) PADA SISTEM TAPI SISTEM KETERLAMBATAN MENYANGKUT PADA SESI SIANG HD: 10.00-18.00 ASLINYA, JIKA DATANG SEBELUM JAM 10 DIANGGAP HADIR, JIKA DATANG SETELAH JAM 10 DIANGGAP TERLAMBAT

export const importAttendances = async (req, res) => {
  try {
    if (!req.file) {
      return res
        .status(400)
        .json({ message: "File presensi tidak ditemukan!" });
    }

    const workbook = XLSX.read(req.file.buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rawData = XLSX.utils.sheet_to_json(sheet, { range: 8 });
    const results = { success: 0, failed: 0, details: [] };
    const allUsers = await Users.findAll();

    for (const row of rawData) {
      const namaExcel = row["Nama Pegawai"];
      const nipExcel = row["NIP"] ? row["NIP"].toString() : null;
      const tglPresensiStr = row["Tgl. Presensi"];
      const shiftNameExcel = row["Shift Kerja"];
      const rawJamMasuk =
        row["Datang"] !== undefined && row["Datang"] !== ""
          ? row["Datang"]
          : row["Masuk"];
      const rawJamKeluar =
        row["Pulang"] !== undefined && row["Pulang"] !== ""
          ? row["Pulang"]
          : row["Keluar"];

      if (!namaExcel || !tglPresensiStr) continue;

      try {
        let user = null;
        let nipPrefix = null;
        if (nipExcel) {
          const strNip = nipExcel.toUpperCase();
          //   const strNip = nipExcel.toString().toUpperCase();
          if (strNip.includes("E")) {
            nipPrefix = strNip.split("E")[0].replace(/[^0-9]/g, ""); // "5,01995E+15" -> "501995"
          } else {
            // nipPrefix = strNip.replace(/[^0-9]/g, "");
            // KITA AMBIL 6 DIGIT PERTAMA SAJA UNTUK AMANNYA
            // nipPrefix = strNip.replace(/[^0-9]/g, "").substring(0, 6);
            nipPrefix = strNip.replace(/[^0-9]/g, "").substring(0, 10);
          }
        }

        // Cari user yang NIP-nya berawalan sama dengan nipPrefix DAN namanya mengandung kata kunci
        if (nipPrefix) {
          const namaSukuPertama = namaExcel
            .split(",")[0]
            .replace(/^(H\.|Hj\.|Bdn\.|dr\.|Ns\.|drg\.|Drg\.|M\.)\s+/gi, "")
            .trim()
            .split(" ")[0]
            .toLowerCase();
          user = allUsers.find(
            (u) =>
              u.nip.startsWith(nipPrefix) &&
              u.fullName.toLowerCase().includes(namaSukuPertama),
          );
        }

        // MATCHING LAPIS 2: FUZZY NAMA (Jika NIP tetap tidak ketemu)
        if (!user) {
          let cleanExcelName = namaExcel.split(",")[0].trim().toLowerCase();
          user = allUsers.find(
            (u) => u.fullName.toLowerCase() === cleanExcelName,
          );

          if (!user) {
            const excelWords = cleanExcelName
              .replace(/[^a-z\s]/g, " ")
              .split(/\s+/)
              .filter((w) => w.length >= 3);
            let bestScore = 0;

            for (const u of allUsers) {
              let cleanDbName = u.fullName.toLowerCase();
              const dbWords = cleanDbName
                .replace(/[^a-z\s]/g, " ")
                .split(/\s+/);
              let score = 0;
              for (const w of excelWords) {
                if (dbWords.includes(w)) score++;
              }
              if (score > bestScore) {
                bestScore = score;
                user = u;
              }
            }
            if (bestScore === 0) user = null;
          }
        }

        if (!user) {
          results.failed++;
          results.details.push({
            nama: namaExcel,
            reason: "User tidak ditemukan di database",
          });
          continue;
        }

        // 2. PARSING TANGGAL INDONESIA -> INGGRIS
        const formattedDate = parseIndonesianDate(tglPresensiStr);
        if (formattedDate === "Invalid date")
          throw new Error("Format tanggal salah");

        // EKSTRAK JAM JADWAL DARI TEKS EXCEL (Penting untuk kalkulasi Lintas Hari & Terlambat)
        let excelStartHourStr = null;
        let isExcelOvernight = false;

        if (shiftNameExcel) {
          const timeRangeMatch = shiftNameExcel.match(
            /(\d{2})[:.](\d{2})(?:[:.]\d{2})?[-\s]+(\d{2})[:.]\d{2}/,
          );
          if (timeRangeMatch) {
            const eStartH = parseInt(timeRangeMatch[1], 10);
            const eEndH = parseInt(timeRangeMatch[3], 10);
            excelStartHourStr = `${timeRangeMatch[1]}:${timeRangeMatch[2]}:00`; // Contoh: "10:00:00"

            if (eStartH > eEndH) isExcelOvernight = true; // Contoh 15 > 07 (Pasti lintas hari)
          }
        }

        const jamMasukStr = parseExcelTime(rawJamMasuk);
        const jamKeluarStr = parseExcelTime(rawJamKeluar);

        let checkInTime = null;
        let checkOutTime = null;
        let shiftDetail = null;
        let workShiftId = user.workShiftId;
        let shiftAssignmentId = null;

        if (user.employmentType === "Shift") {
          const standardShiftName = mapExcelShiftToStandard(shiftNameExcel);
          const standardShift = await WorkShift.findOne({
            where: { name: { [Op.like]: `%${standardShiftName}%` } },
          });
          if (standardShift) {
            workShiftId = standardShift.id;
            shiftDetail = standardShift;
            const [assignment] = await ShiftAssignment.findOrCreate({
              where: {
                userId: user.id,
                date: formattedDate,
                workShiftId: standardShift.id,
              },
              defaults: {
                userId: user.id,
                date: formattedDate,
                workShiftId: standardShift.id,
              },
            });
            shiftAssignmentId = assignment.id;
          }
        } else if (workShiftId) {
          shiftDetail = await WorkShift.findByPk(workShiftId);
        }

        // 2. Kalkulasi Waktu Check-In & Check-Out
        if (jamMasukStr) {
          checkInTime = moment(
            `${formattedDate} ${jamMasukStr}`,
            "YYYY-MM-DD HH:mm:ss",
          ).toDate();
          if (isNaN(checkInTime.getTime())) checkInTime = null;
        }
        if (jamKeluarStr) {
          checkOutTime = moment(
            `${formattedDate} ${jamKeluarStr}`,
            "YYYY-MM-DD HH:mm:ss",
          ).toDate();
          if (isNaN(checkOutTime.getTime())) checkOutTime = null;
        }

        // 3. Logika +1 Hari (Cross-day)
        if (checkInTime && checkOutTime) {
          //   const isNightShift =
          //     shiftDetail &&
          //     (shiftDetail.name.toLowerCase().includes("malam") ||
          //       shiftDetail.startTime > shiftDetail.endTime);
          const is24HourShift =
            shiftDetail && shiftDetail.name.toLowerCase().includes("24 jam");
          if (checkOutTime < checkInTime) {
            // Kasus umum: masuk 23:00 pulang 07:00
            checkOutTime = moment(checkOutTime).add(1, "days").toDate();
          } else if (is24HourShift) {
            // Kasus Catu Anggun: 24 jam penuh, checkout pasti di hari berikutnya
            // Meskipun 07:18 > 06:58, kita tahu ini shift 24 jam maka harus +1 hari
            checkOutTime = moment(checkOutTime).add(1, "days").toDate();
          } else if (
            isExcelOvernight &&
            moment(checkInTime).hour() <= 12 &&
            moment(checkOutTime).hour() <= 12
          ) {
            // Kasus Nita Fatona: Jadwal Malam (15-07), tapi check-in pagi & check-out pagi
            checkOutTime = moment(checkOutTime).add(1, "days").toDate();
          }
        }

        // LOGIKA STATUS KEHADIRAN & KETERLAMBATAN DENGAN DYNAMIC OVERRIDE
        let attendanceStatus = "Hadir";
        if (!jamMasukStr && !jamKeluarStr) {
          attendanceStatus = "Tidak Hadir";
        } else if (!jamMasukStr || !jamKeluarStr) {
          attendanceStatus = "Tidak Valid";
          // } else if (checkInTime && shiftDetail && shiftDetail.startTime) {
          //   const expectedInTime = moment(
          //     `${formattedDate} ${shiftDetail.startTime}`,
          //     "YYYY-MM-DD HH:mm:ss",
          //   );
          //   const toleranceMinutes =
          //     shiftDetail.tolerance !== null ? shiftDetail.tolerance : 15;
          //   const maxInTime = expectedInTime.add(toleranceMinutes, "minutes");
          //   if (moment(checkInTime).isAfter(maxInTime)) {
          //     attendanceStatus = "Terlambat";
          //   }
          // }
        } else if (checkInTime) {
          // KUNCI: Gunakan jam dari string Excel jika ada (Misal: 10:00:00),
          // Jika tidak ada, baru pakai jam dari database WorkShift
          const targetInTimeStr =
            excelStartHourStr || (shiftDetail ? shiftDetail.startTime : null);

          if (targetInTimeStr) {
            const expectedInTime = moment(
              `${formattedDate} ${targetInTimeStr}`,
              "YYYY-MM-DD HH:mm:ss",
            );
            const toleranceMinutes =
              shiftDetail && shiftDetail.tolerance !== null
                ? shiftDetail.tolerance
                : 15;
            const maxInTime = expectedInTime.add(toleranceMinutes, "minutes");

            if (moment(checkInTime).isAfter(maxInTime)) {
              attendanceStatus = "Terlambat";
            }
          }
        }

        // 6. CEK DUPLIKASI MANUAL (Menggantikan Upsert)
        const whereClause = { userId: user.id, date: formattedDate };
        // Jika Medis/Shift, bedakan record berdasarkan Shift-nya agar shift ganda dalam 1 hari tidak tertimpa
        if (user.employmentType === "Shift" && shiftAssignmentId !== null) {
          whereClause.shiftAssignmentId = shiftAssignmentId;
        }

        const existingAttendance = await Attendances.findOne({
          where: whereClause,
        });
        const attendanceData = {
          userId: user.id,
          date: formattedDate,
          checkInTime,
          checkOutTime,
          attendanceStatus,
          attendanceType: "INSIDE",
          source: "Manual",
          workShiftId,
          shiftAssignmentId,
        };

        if (existingAttendance) {
          await existingAttendance.update(attendanceData);
        } else {
          await Attendances.create(attendanceData);
        }
        results.success++;
      } catch (err) {
        results.failed++;
        results.details.push({ nama: namaExcel, reason: err.message });
      }
    }
    res.status(200).json({
      message: "Proses import file presensi berhasil!",
      data: results,
    });
  } catch (e) {
    console.error("Error import presensi:", e);
    res.status(500).json({
      message: "Terjadi kesalahan pada server saat import presensi",
      error: e.message,
    });
  }
};
