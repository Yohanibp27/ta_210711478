import xlsx from "xlsx";
import { Op, Sequelize, fn, col, literal } from "sequelize";
import moment from "moment-timezone";
import ActionData from "../models/MedicalActionModel.js";
import Users from "../models/UserModel.js";
import Attendances from "../models/AttendanceModel.js";
import ShiftAssignment from "../models/ShiftAssignmentModel.js";
import WorkShift from "../models/WorkShiftModel.js";
import Profession from "../models/ProfessionModel.js";
import Position from "../models/PositionModel.js";
import Division from "../models/DivisionModel.js";
import Department from "../models/DepartmentModel.js";
import Role from "../models/RoleModel.js";
import db from "../config/Database.js";

const TIMEZONE_OFFSET = 7 * 60;
const normalizeClock = (value) => {
  if (!value) return null;

  const time = String(value).trim();

  if (/^\d{2}:\d{2}$/.test(time)) {
    return `${time}:00`;
  }

  if (/^\d{2}:\d{2}:\d{2}$/.test(time)) {
    return time;
  }

  return null;
};

const toWibInstant = (value) => {
  return moment(value).utcOffset(TIMEZONE_OFFSET);
};

const buildWibDateTime = (date, time) => {
  const normalizedTime = normalizeClock(time);

  if (!date || !normalizedTime) {
    return null;
  }

  const parsed = moment(
    `${date} ${normalizedTime}`,
    "YYYY-MM-DD HH:mm:ss",
    true,
  ).utcOffset(TIMEZONE_OFFSET, true);

  return parsed.isValid() ? parsed : null;
};

// helper penentu shift dokte berdasarkan jam
function determineShiftId(userType, checkInTime, workshifts) {
  const hour = moment(checkInTime).tz("Asia/Jakarta").hour();

  if (userType === "Dokter Spesialis") {
    if (hour >= 7 && hour < 12) {
      return workshifts.find((s) => s.name === "Pagi - Dokter")?.id;
    } else {
      return workshifts.find((s) => s.name === "Siang - Dokter")?.id;
    }
  } else {
    if (hour >= 6 && hour < 14) {
      return workshifts.find((s) => s.name === "Pagi")?.id;
    } else if (hour >= 14 && hour < 22) {
      return workshifts.find((s) => s.name === "Siang")?.id;
    } else {
      return workshifts.find((s) => s.name === "Malam")?.id;
    }
  }
}

// 11 FEBRUARI 2026
export const importExcel = async (req, res) => {
  if (!req.file)
    return res.status(400).json({ message: "File Excel wajib diupload!" });

  try {
    const workbook = xlsx.read(req.file.buffer, { type: "buffer" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rawData = xlsx.utils.sheet_to_json(sheet, { header: 1 });

    // 1. Deteksi Header secara Dinamis
    let headerRowIndex = rawData.findIndex(
      (row) =>
        row.includes("NO RM") ||
        row.includes("DOKTER") ||
        row.includes("JENIS KUNJUNGAN") ||
        row.includes("NAMA TINDAKAN"),
    );

    if (headerRowIndex === -1) {
      return res.status(400).json({
        message:
          "Format file salah, kolom 'DOKTER' atau 'NAMA TINDAKAN' tidak ditemukan!",
      });
    }

    const data = xlsx.utils.sheet_to_json(sheet, { range: headerRowIndex });

    // 2. Fungsi Helper Pembersih Nama (Cerdas)
    const normalize = (str) => {
      if (!str) return "";
      return str
        .toLowerCase()
        .replace(/(drg\.|dr\.|spec\.|sp\.|mm\.|mdsc\.|md\.|phd|,.+)/g, "") // Hapus gelar umum & setelah koma
        .replace(/[^a-z0-9]/g, "") // Hapus spasi dan simbol
        .trim();
    };

    // 3. Ambil Data User (Dokter/Perawat) dari Database
    const allUsers = await Users.findAll({
      attributes: [
        "id",
        "fullName",
        "nip",
        "titlePrefix",
        "titleSuffix",
        "professionId",
      ],
      include: [
        {
          model: Profession,
          attributes: ["name"], // Pastikan model Profession punya field 'name'
        },
      ],
    });

    const userMap = new Map();
    allUsers.forEach((u) => {
      // Simpan data profesi di object untuk dipakai nanti di 4.7
      u.dataValues.professionName = u.Profession ? u.Profession.name : "";
      // Mapping 1: Berdasarkan Nama Lengkap Tanpa Gelar
      userMap.set(normalize(u.fullName), u.id);
      // Mapping 2: Berdasarkan NIP (Jika Excel menyertakan NIP/ID Dokter)
      if (u.nip) userMap.set(u.nip.toString(), u.id);
    });

    const batchId = `IMPORT_${moment().format("YYYYMMDD_HHmmss")}`;

    // 4. Proses Mapping Baris per Baris
    const payload = data
      .map((row) => {
        const excelDocName = row["DOKTER"] || "";
        const excelRM = row["NO RM"] || row["NORM"] || "";
        const actionName = row["NAMA TINDAKAN"] || ""; // FIX: Dideklarasikan di atas agar terbaca bawahnya

        // Cari ID User menggunakan nama yang dinormalisasi
        let userId = userMap.get(normalize(excelDocName)) || null; // FIX: Gunakan 'let' bukan 'const'

        // =========================================================================
        // PENCEGAHAN PRESENSI GAIB (EXCEPTION RULE)
        // Jika tindakan adalah "konsultasi dokter spesialis", maka yang melakukan
        // tindakan adalah tenaga medis lain, bukan dokter spesialis yang bersangkutan.
        // Kita set userId menjadi null agar tidak men-trigger kehadiran untuk dokter ini.
        // =========================================================================
        if (actionName.toLowerCase().includes("konsultasi dokter spesialis")) {
          userId = null;
        }

        // Parsing Tanggal (Gunakan WIB agar tidak geser jamnya)
        let rawDate = row["TGL TINDAKAN"] || row["TGL KUNJUNGAN"];
        let validDate = null;
        if (rawDate) {
          validDate = moment
            .tz(rawDate, "DD-MM-YYYY HH:mm:ss", "Asia/Jakarta")
            .format("YYYY-MM-DD HH:mm:ss");
        }

        return {
          dateOfAction: validDate,
          serviceUnit: row["UNIT PELAYANAN"] || "UMUM",
          visitType: row["JENIS KUNJUNGAN"],
          doctorName: excelDocName, // Simpan nama asli untuk kroscek manual
          //   actionName: row["NAMA TINDAKAN"],
          actionName: actionName,
          noRM: excelRM,
          userId: userId,
          rawFileId: batchId,
        };
      })
      .filter((item) => item.dateOfAction && item.actionName);

    // MULAI PENAMBAHAN LOGIKA PRESENSI & SHIFT ASSIGNMENT
    // =========================================================================
    // 4.5. Ekstrak Waktu Tindakan untuk dijadikan Presensi
    const attendanceMap = new Map();

    for (const item of payload) {
      if (!item.userId) continue; // Skip jika user tidak terdaftar di database

      // -----------------------------------------------------------------
      // ATURAN ATMA JAYA / RS: BYPASS KONSULTASI SPESIALIS UNTUK PRESENSI
      // Jam masuk & pulang tidak boleh dihitung dari item konsultasi gadungan ini
      // -----------------------------------------------------------------
      if (
        item.actionName.toLowerCase().includes("konsultasi dokter spesialis")
      ) {
        continue; // Lewati item ini, cari tindakan fisik nyata (USG, Visite, Operasi, dll)
      }

      const dateOnly = moment(item.dateOfAction).format("YYYY-MM-DD");
      const key = `${item.userId}_${dateOnly}`;
      const actionTime = moment(item.dateOfAction);

      if (!attendanceMap.has(key)) {
        attendanceMap.set(key, {
          userId: item.userId,
          date: dateOnly,
          checkInTime: actionTime.format("YYYY-MM-DD HH:mm:ss"),
          checkOutTime: actionTime.format("YYYY-MM-DD HH:mm:ss"),
        });
      } else {
        // Update waktu check-in (cari yang paling awal) dan check-out (paling akhir)
        const existing = attendanceMap.get(key);
        // Jam Masuk diambil dari tindakan pertama (non-konsultasi)
        if (actionTime.isBefore(moment(existing.checkInTime))) {
          existing.checkInTime = actionTime.format("YYYY-MM-DD HH:mm:ss");
        }
        // Jam Pulang diambil dari tindakan terakhir (non-konsultasi)
        if (actionTime.isAfter(moment(existing.checkOutTime))) {
          existing.checkOutTime = actionTime.format("YYYY-MM-DD HH:mm:ss");
        }
      }
    }

    // 4.6. Ambil data Workshift (Master Data)
    const masterShifts = await WorkShift.findAll();

    // 4.7. Proses penentuan Shift dan Simpan Presensi
    for (const [key, attendanceData] of attendanceMap.entries()) {
      const user = allUsers.find((u) => u.id === attendanceData.userId);
      const professionName = user?.dataValues.professionName || "";
      const userType = professionName.toLowerCase().includes("spesialis")
        ? "Dokter Spesialis"
        : "Dokter Umum";

      let assignedShift = await ShiftAssignment.findOne({
        where: { userId: attendanceData.userId, date: attendanceData.date },
      });

      let currentWorkShiftId = null;
      let currentShiftAssignmentId = null; // TAMBAHAN: Buat penampung ID Assignment

      if (assignedShift) {
        // currentWorkShiftId = assignedShift.workShiftId; // Gunakan jadwal existing
        // PERHATIKAN CAMELCASE: Pastikan field di modelmu adalah workShiftId
        currentWorkShiftId =
          assignedShift.workShiftId || assignedShift.workShiftId;
        currentShiftAssignmentId = assignedShift.id; // TAMBAHAN: Tangkap ID-nya
      } else {
        // Fallback: Tentukan shift otomatis berdasarkan jam check-in
        currentWorkShiftId = determineShiftId(
          userType,
          attendanceData.checkInTime,
          masterShifts,
        );

        // Buat record shift assignment baru agar relasi tidak putus
        if (currentWorkShiftId) {
          assignedShift = await ShiftAssignment.create({
            userId: attendanceData.userId,
            workShiftId: currentWorkShiftId,
            date: attendanceData.date,
            isAutoAssigned: true,
          });
          currentShiftAssignmentId = assignedShift.id; // TAMBAHAN: Tangkap ID yang baru di-create
        }
      }

      attendanceData.workShiftId = currentWorkShiftId;
      attendanceData.shiftAssignmentId = currentShiftAssignmentId; // TAMBAHAN

      let attendanceStatus = "Hadir";
      const currentShift = masterShifts.find(
        (s) => s.id === currentWorkShiftId,
      );

      if (currentShift && userType === "Dokter Spesialis") {
        // Gabungkan tanggal tindakan dengan jam selesai shift reguler (ex: "15:00:00")
        const shiftEndDateTime = moment.tz(
          `${attendanceData.date} ${currentShift.endTime}`,
          "YYYY-MM-DD HH:mm:ss",
          "Asia/Jakarta",
        );
        const actualCheckOut = moment.tz(
          attendanceData.checkOutTime,
          "YYYY-MM-DD HH:mm:ss",
          "Asia/Jakarta",
        );

        // // Jika jam pulang nyata melewati batas jam shift reguler, set jadi Cito
        // if (actualCheckOut.isAfter(shiftEndDateTime)) {
        //   attendanceStatus = "Cito";
        // }
      }

      // 4.8. Cek dan Simpan/Update data ke tabel Attendances
      const existingAttendance = await Attendances.findOne({
        where: { userId: attendanceData.userId, date: attendanceData.date },
      });

      if (existingAttendance) {
        // Jika sudah ada (mungkin user tap kartu RFID/QR Code juga), kita update check-out nya saja
        // atau pertahankan yang lebih luas rentang waktunya.
        await existingAttendance.update({
          checkOutTime: attendanceData.checkOutTime,
          workShiftId: attendanceData.workShiftId, // Update jaga-jaga jika berubah
          shiftAssignmentId: attendanceData.shiftAssignmentId, // Update jaga-jaga jika berubah
          updatedAt: new Date(),
        });
      } else {
        // Jika belum ada presensi sama sekali, buat baru
        await Attendances.create({
          userId: attendanceData.userId,
          workShiftId: attendanceData.workShiftId, // SEKARANG MASUK
          shiftAssignmentId: attendanceData.shiftAssignmentId, // SEKARANG MASUK
          date: attendanceData.date,
          checkInTime: attendanceData.checkInTime,
          checkOutTime: attendanceData.checkOutTime,
          attendanceStatus: "Hadir", // Atau status lain sesuai logikamu
          attendanceType: "INSIDE",
          source: "Manual",
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }
    }
    // AKHIR PENAMBAHAN LOGIKA PRESENSI
    // =========================================================================

    // 5. Simpan dengan Chunking (Cegah Memory Leak)
    const chunkSize = 500;
    for (let i = 0; i < payload.length; i += chunkSize) {
      //   await ActionData.bulkCreate(payload.slice(i, i + chunkSize));

      const chunk = payload.slice(i, i + chunkSize);
      await ActionData.bulkCreate(chunk, {
        ignoreDuplicates: true, // JIKA DATA (RM, TGL, NAMA TINDAKAN) SUDAH ADA, SKIP!
      });
    }

    // // 6. Response Detail untuk Laporan TA
    // const mappedCount = payload.filter((p) => p.userId !== null).length;
    // res.status(201).json({
    //   message: "Data Berhasil Diimport",
    //   batchId,
    //   summary: {
    //     totalImported: payload.length,
    //     successfullyMapped: mappedCount,
    //     failedMapping: payload.length - mappedCount,
    //     info: "Data duplikat yang sudah ada di database otomatis dilewati.",
    //   },
    // });
    // 6. Hitung hasil import sebenarnya
    const totalImported = payload.length;

    // Hitung data dari batch ini yang benar-benar berhasil masuk database
    const successfullyImported = await ActionData.count({
      where: {
        rawFileId: batchId,
      },
    });

    // Data yang tidak masuk karena duplikat
    const duplicateCount = totalImported - successfullyImported;

    // Mapping dokter tetap dihitung terpisah jika masih dibutuhkan
    const mappedCount = payload.filter((p) => p.userId !== null).length;
    const failedMappingCount = payload.length - mappedCount;

    res.status(201).json({
      message: "Data Berhasil Diimport",
      batchId,
      summary: {
        totalImported,
        successfullyImported,
        duplicateCount,

        // Informasi mapping dokter
        successfullyMapped: mappedCount,
        failedMapping: failedMappingCount,

        info: "Data duplikat yang sudah ada di database otomatis dilewati.",
      },
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Internal Server Error", error: error.message });
  }
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
const cleanDoctorName = (name) => {
  if (!name) return "Tenaga Medis Lainnya";
  let cleaned = name
    .toLowerCase()
    .replace(
      /^(dr\.|drg\.|dr|drg|prof\.|prof|perawat|bidan|staf|dr\s+|drg\s+)/g,
      "",
    )
    .split(",")[0]
    .replace(/[^a-z\s]/g, "")
    .replace(/\b(sp|spd|og|anes|rad|pk|pd|tht|anes|mkes|si|psi|mm)\b/g, "")
    .trim();

  return (
    cleaned.replace(/\b\w/g, (l) => l.toUpperCase()) || "Tenaga Medis Lainnya"
  );
};

const normalizeDoctorKey = (name) => {
  if (!name) return "tenaga_medis_lainnya";
  return name.toLowerCase().replace(/\s+/g, " ").trim();
};

const formatDoctorDisplayName = (name) => {
  if (!name) return "Tenaga Medis Lainnya";
  const mainName = name.split(",")[0];
  return mainName
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .map((word) => {
      if (["dr.", "dr", "drg.", "drg"].includes(word)) {
        return word.toLowerCase();
      }
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(" ");
};

// ── Filter tanggal ────────
const buildDashboardFilters = (req) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  const search = req.query.search_query || "";
  const sortKey = req.query.sort_key || "dateOfAction";
  const sortDirection = req.query.sort_direction || "DESC";

  const rawPeriod = String(req.query.period || "month").toLowerCase();

  //   const period =
  //     req.query.period ||
  //     (req.query.day ? "Harian" : req.query.week ? "Mingguan" : "Bulanan");
  //  const selectedDateParam = req.query.week || req.query.day || req.query.month;
  const period =
    rawPeriod === "day" || rawPeriod === "harian"
      ? "Harian"
      : rawPeriod === "week" || rawPeriod === "mingguan"
        ? "Mingguan"
        : "Bulanan";

  let selectedDateParam = req.query.week || req.query.day || req.query.month;
  if (!selectedDateParam) {
    if (period === "Harian") {
      selectedDateParam = moment().format("YYYY-MM-DD");
    } else if (period === "Mingguan") {
      selectedDateParam = moment().format("GGGG-[W]WW");
    } else {
      selectedDateParam = moment().format("YYYY-MM");
    }
  }

  const selectedUnit = req.query.unit || "Semua Divisi";

  let dateFilter = {};
  let attendanceDateFilter = {};
  let shiftDateFilter = {};
  let startDate, endDate;

  if (selectedDateParam) {
    const [yearStr, monthStr, dayStr] = selectedDateParam.split("-");
    // if (period === "Mingguan" || selectedDateParam.includes("-W")) {
    //   const momentWeek = moment(selectedDateParam, "YYYY-[W]WW");
    //   startDate = momentWeek.clone().startOf("isoWeek").toDate();
    //   endDate = momentWeek.clone().add(1, "weeks").startOf("isoWeek").toDate();
    // } else {
    //   const year = parseInt(yearStr, 10);
    //   const month = parseInt(monthStr, 10) - 1;

    //   if (period === "Harian" || dayStr) {
    //     const day = parseInt(dayStr, 10) || 1;
    //     startDate = new Date(year, month, day);
    //     endDate = new Date(year, month, day + 1);
    //   } else {
    //     startDate = new Date(year, month, 1);
    //     endDate = new Date(year, month + 1, 1);
    //   }
    // }

    if (period === "Mingguan" || selectedDateParam.includes("-W")) {
      const startMoment = moment(selectedDateParam, "GGGG-[W]WW", true)
        .utcOffset(TIMEZONE_OFFSET, true)
        .startOf("isoWeek");

      const endMoment = startMoment.clone().add(1, "week");

      startDate = startMoment.toDate();
      endDate = endMoment.toDate();
    } else if (period === "Harian" || dayStr) {
      const startMoment = moment(
        `${selectedDateParam} 00:00:00`,
        "YYYY-MM-DD HH:mm:ss",
        true,
      ).utcOffset(TIMEZONE_OFFSET, true);

      const endMoment = startMoment.clone().add(1, "day");

      startDate = startMoment.toDate();
      endDate = endMoment.toDate();
    } else {
      const startMoment = moment(
        `${selectedDateParam}-01 00:00:00`,
        "YYYY-MM-DD HH:mm:ss",
        true,
      ).utcOffset(TIMEZONE_OFFSET, true);

      const endMoment = startMoment.clone().add(1, "month");

      startDate = startMoment.toDate();
      endDate = endMoment.toDate();
    }

    dateFilter.dateOfAction = { [Op.gte]: startDate, [Op.lt]: endDate };
    const startStr = moment(startDate).format("YYYY-MM-DD");
    const endStr = moment(endDate).format("YYYY-MM-DD");
    const prevDayStr = moment(startDate)
      .subtract(1, "days")
      .format("YYYY-MM-DD");

    attendanceDateFilter.date = { [Op.gte]: prevDayStr, [Op.lt]: endStr };
    shiftDateFilter.date = { [Op.gte]: prevDayStr, [Op.lt]: endStr };
  }

  if (selectedUnit !== "Semua Divisi" && selectedUnit !== "") {
    dateFilter.serviceUnit = selectedUnit;
  }

  // FILTER KHUSUS WORKLOAD (Hanya yang memiliki Dokter)
  const baseWhere = { ...dateFilter };
  const validDoctorWhere = {
    ...baseWhere,
    doctorName: { [Op.not]: null, [Op.not]: "" },
    userId: { [Op.not]: null },
  };

  return {
    baseWhere,
    validDoctorWhere,
    attendanceDateFilter,
    shiftDateFilter,
    startDate,
    endDate,
    page,
    limit,
    offset,
    search,
    sortKey,
    sortDirection,
  };
};

// Dashboard summary - menghitung total SDM, total tindakan, total pasien
export const getDashboardSummary = async (req, res) => {
  try {
    const filters = buildDashboardFilters(req);
    const { baseWhere, attendanceDateFilter, startDate, endDate } = filters;

    const periodDuration = endDate - startDate;
    const prevStartDate = new Date(startDate.getTime() - periodDuration);
    const prevEndDate = new Date(startDate);

    const prevBaseWhere = {
      ...baseWhere,
      dateOfAction: { [Op.gte]: prevStartDate, [Op.lt]: prevEndDate },
    };

    const prevAttendanceDateFilter = {
      date: {
        [Op.gte]: moment(prevStartDate).format("YYYY-MM-DD"),
        [Op.lt]: moment(prevEndDate).format("YYYY-MM-DD"),
      },
    };

    const prevShiftDateFilter = {
      date: {
        [Op.gte]: moment(prevStartDate).format("YYYY-MM-DD"),
        [Op.lt]: moment(prevEndDate).format("YYYY-MM-DD"),
      },
    };

    const [
      totalTindakan,
      totalPasienUnik,
      totalSDM,
      totalTenagaMedisAktif,
      attendances,
      prevTotalTindakan,
      prevTotalPasienUnik,
      prevAttendances,
      prevTotalTenagaMedisAktif,
    ] = await Promise.all([
      ActionData.count({ where: baseWhere }),
      ActionData.count({ where: baseWhere, distinct: true, col: "noRM" }),
      Users.count(),
      ShiftAssignment.count({
        distinct: true,
        col: "userId",
        where: filters.shiftDateFilter,
        include: [
          {
            model: Users,
            as: "user",
            attributes: [],
            where: { employmentType: "Shift" },
          },
        ],
      }),
      Attendances.findAll({
        where: attendanceDateFilter,
        attributes: [
          "id",
          "userId",
          "date",
          "checkInTime",
          "checkOutTime",
          "attendanceStatus",
        ],
        include: [
          {
            model: Users,
            attributes: ["id", "employmentType"],
            include: [
              {
                model: Position,
                include: [
                  {
                    model: Division,
                    include: [
                      {
                        model: Department,
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
        raw: true,
        nest: true,
      }),
      ActionData.count({ where: prevBaseWhere }),
      ActionData.count({ where: prevBaseWhere, distinct: true, col: "noRM" }),
      Attendances.findAll({
        where: prevAttendanceDateFilter,
        attributes: [
          "id",
          "userId",
          "date",
          "checkInTime",
          "checkOutTime",
          "attendanceStatus",
        ],
        include: [
          {
            model: Users,
            attributes: ["id", "employmentType"],
            include: [
              {
                model: Position,
                include: [
                  {
                    model: Division,
                    include: [
                      {
                        model: Department,
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
        raw: true,
        nest: true,
      }),
      ShiftAssignment.count({
        distinct: true,
        col: "userId",
        where: prevShiftDateFilter,
        include: [
          {
            model: Users,
            as: "user",
            attributes: [],
            where: { employmentType: "Shift" },
          },
        ],
      }),
    ]);

    if (totalTindakan === 0 || attendances.length === 0) {
      return res.json({
        stats: {
          totalSDM: null,
          totalTindakan: null,
          totalPasien: null,
          totalJamKehadiran: null,
          totalTenagaMedisAktif: null,
          rataRataBebanKerja: null,
        },
        deltas: {
          tindakan: null,
          jam: null,
          pasien: null,
          rataRata: null,
        },
      });
    }

    // FUNGSI FILTER DEPARTEMEN & DIVISI (MENGGUNAKAN INCLUDES AGAR FLEKSIBEL)
    const isValidHospitalUnit = (att) => {
      const userObj = att.User || att.user;
      if (!userObj) return false;

      const position = userObj.Position || userObj.position;
      const division = position?.Division || position?.division;
      const department =
        division?.Department ||
        division?.department ||
        division?.Departement ||
        division?.departement;

      // Jika relasi tabel tidak terbaca sama sekali, skip perhitungan
      if (!department || !division) return false;

      const deptName = (department.name || department.nama || "").toUpperCase();
      const divName = (division.name || division.nama || "").toUpperCase();

      // 1. SUBBID YANMEDDOKPOL
      if (deptName.includes("YANMEDDOKPOL") && divName.includes("YANMED"))
        return true;

      // 2. JANMEDUM
      if (deptName.includes("JANMEDUM")) {
        const allowed = [
          "CCSD",
          "FARMASI",
          "GIZI",
          "LABORATORIUM",
          "PDP JANGMEDUM",
          "RADIOLOGI",
        ];
        if (allowed.some((d) => divName.includes(d))) return true;
      }

      // 3. YANWAT
      if (deptName.includes("YANWAT")) {
        // "POLIKLIN" akan cocok untuk "POLIKLINIK" maupun "POLIKLINK"
        const allowed = [
          "ICU",
          "IGD",
          "KAMAR OPERASI",
          "NICU",
          "PICU",
          "PDP",
          "POLIKLINIK",
          "PONEK",
          "PURI",
          "YANWAT",
        ];
        if (allowed.some((d) => divName.includes(d))) return true;
      }

      return false;
    };

    const filteredAttendances = attendances.filter(isValidHospitalUnit);
    const filteredPrevAttendances = prevAttendances.filter(isValidHospitalUnit);

    let totalJamSemuaKehadiran = 0;
    // attendances.forEach((att) => {
    filteredAttendances.forEach((att) => {
      const userObj = att.User || att.user;
      if (att.checkInTime && att.checkOutTime) {
        let inTime = new Date(att.checkInTime);
        if (isNaN(inTime.getTime()))
          inTime = new Date(`${att.date}T${att.checkInTime}`);
        let outTime = new Date(att.checkOutTime);
        if (isNaN(outTime.getTime()))
          outTime = new Date(`${att.date}T${att.checkOutTime}`);

        if (!isNaN(inTime.getTime()) && !isNaN(outTime.getTime())) {
          let diffHours = (outTime - inTime) / (1000 * 60 * 60);
          if (diffHours < 0) diffHours += 24;

          const attendanceDate = new Date(att.date);
          const isInRange =
            attendanceDate >= startDate && attendanceDate < endDate;

          if (
            isInRange &&
            userObj?.employmentType === "Shift" &&
            ["Hadir", "Terlambat"].includes(att.attendanceStatus)
          ) {
            totalJamSemuaKehadiran += diffHours;
          }
        }
      }
    });

    // Hitung jam kehadiran periode sebelumnya
    let prevTotalJam = 0;
    // prevAttendances.forEach((att) => {
    filteredPrevAttendances.forEach((att) => {
      const userObj = att.User || att.user;
      if (att.checkInTime && att.checkOutTime) {
        let inTime = new Date(att.checkInTime);
        if (isNaN(inTime.getTime()))
          inTime = new Date(`${att.date}T${att.checkInTime}`);
        let outTime = new Date(att.checkOutTime);
        if (isNaN(outTime.getTime()))
          outTime = new Date(`${att.date}T${att.checkOutTime}`);

        if (!isNaN(inTime.getTime()) && !isNaN(outTime.getTime())) {
          let diffHours = (outTime - inTime) / (1000 * 60 * 60);
          if (diffHours < 0) diffHours += 24;

          const attendanceDate = new Date(att.date);
          const isPrevInRange =
            attendanceDate >= prevStartDate && attendanceDate < prevEndDate;

          if (
            isPrevInRange &&
            userObj?.employmentType === "Shift" &&
            ["Hadir", "Terlambat"].includes(att.attendanceStatus)
          ) {
            prevTotalJam += diffHours;
          }
        }
      }
    });

    const calcDelta = (current, previous) => {
      if (previous === 0 || !previous) {
        return current > 0 ? null : 0.0;
      }
      return parseFloat((((current - previous) / previous) * 100).toFixed(1));
    };

    const rataRataBebanKerja =
      totalTenagaMedisAktif > 0 ? totalPasienUnik / totalTenagaMedisAktif : 0;

    const finalTotalJamKehadiran =
      filteredAttendances.length === 0 ? 0 : Math.round(totalJamSemuaKehadiran);

    const prevRataRataBebanKerja =
      prevTotalTenagaMedisAktif > 0
        ? prevTotalPasienUnik / prevTotalTenagaMedisAktif
        : 0;

    res.json({
      stats: {
        totalSDM,
        totalTindakan,
        totalPasien: totalPasienUnik,
        totalJamKehadiran: finalTotalJamKehadiran,
        totalTenagaMedisAktif,
        rataRataBebanKerja: parseFloat(rataRataBebanKerja.toFixed(2)),
      },
      deltas: {
        tindakan: calcDelta(totalTindakan, prevTotalTindakan),
        jam: calcDelta(finalTotalJamKehadiran, prevTotalJam),
        pasien: calcDelta(totalPasienUnik, prevTotalPasienUnik),
        rataRata: calcDelta(rataRataBebanKerja, prevRataRataBebanKerja),
      },
    });

    // const formatIntegerID = (value) => {
    //   if (value === null || value === undefined) return null;

    //   return Number(value).toLocaleString("id-ID", {
    //     minimumFractionDigits: 0,
    //     maximumFractionDigits: 0,
    //   });
    // };

    // const formatDecimalID = (value, digit = 1) => {
    //   if (value === null || value === undefined) return null;

    //   return Number(value).toLocaleString("id-ID", {
    //     minimumFractionDigits: digit,
    //     maximumFractionDigits: digit,
    //   });
    // };

    // const stats = {
    //   totalSDM,
    //   totalTindakan,
    //   totalPasien: totalPasienUnik,
    //   totalJamKehadiran: finalTotalJamKehadiran,
    //   totalTenagaMedisAktif,
    //   rataRataBebanKerja: parseFloat(rataRataBebanKerja.toFixed(2)),
    // };

    // const deltas = {
    //   tindakan: calcDelta(totalTindakan, prevTotalTindakan),
    //   jam: calcDelta(finalTotalJamKehadiran, prevTotalJam),
    //   pasien: calcDelta(totalPasienUnik, prevTotalPasienUnik),
    //   rataRata: calcDelta(rataRataBebanKerja, prevRataRataBebanKerja),
    // };

    // res.json({
    //   stats,
    //   statsFormatted: {
    //     totalSDM: formatIntegerID(stats.totalSDM),
    //     totalTindakan: formatIntegerID(stats.totalTindakan),
    //     totalPasien: formatIntegerID(stats.totalPasien),
    //     totalJamKehadiran: formatIntegerID(stats.totalJamKehadiran),
    //     totalTenagaMedisAktif: formatIntegerID(stats.totalTenagaMedisAktif),
    //     rataRataBebanKerja: formatDecimalID(stats.rataRataBebanKerja, 2),
    //   },
    //   deltas,
    //   deltasFormatted: {
    //     tindakan: formatDecimalID(deltas.tindakan, 1),
    //     jam: formatDecimalID(deltas.jam, 1),
    //     pasien: formatDecimalID(deltas.pasien, 1),
    //     rataRata: formatDecimalID(deltas.rataRata, 1),
    //   },
    // });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Workload doctors - menghitung beban kerja dokter
export const getWorkloadDoctors = async (req, res) => {
  try {
    const filters = buildDashboardFilters(req);
    const {
      baseWhere,
      validDoctorWhere,
      attendanceDateFilter,
      shiftDateFilter,
    } = filters;

    const [workloadRaw, allUsersData, attendances, allActions, shiftsRaw] =
      await Promise.all([
        ActionData.findAll({
          where: validDoctorWhere,
          attributes: [
            ["doctorName", "name"],
            "userId",
            [fn("COUNT", col("id")), "tindakan"],
            [fn("COUNT", fn("DISTINCT", col("noRM"))), "pasien"],
          ],
          group: ["doctorName", "userId"],
          raw: true,
        }),
        Users.findAll({
          attributes: [
            "id",
            "titlePrefix",
            "fullName",
            "titleSuffix",
            "nip",
            "employmentType",
          ],
          include: [
            { model: Profession, attributes: ["name"] },
            {
              model: Position,
              attributes: ["name"],
              include: [
                {
                  model: Division,
                  attributes: ["name"],
                  include: [{ model: Department, attributes: ["name"] }],
                },
              ],
            },
          ],
          nest: true,
          raw: true,
        }),
        Attendances.findAll({
          where: attendanceDateFilter,
          raw: true,
          nest: true,
        }),
        ActionData.findAll({
          where: baseWhere,
          attributes: ["id", "doctorName", "userId", "dateOfAction", "noRM"],
          raw: true,
        }),
        ShiftAssignment.findAll({
          where: shiftDateFilter,
          include: [
            {
              model: Users,
              as: "user",
              attributes: [
                "id",
                "titlePrefix",
                "fullName",
                "titleSuffix",
                "nip",
                "employmentType",
              ],
              include: [
                {
                  model: Position,
                  as: "position",
                  attributes: ["id", "name"],
                  include: [{ model: Division, attributes: ["id", "name"] }],
                },
              ],
            },
            {
              model: WorkShift,
              as: "workShift",
              attributes: ["id", "name", "startTime", "endTime"],
            },
          ],
          raw: true,
          nest: true,
        }),
      ]);

    const userMasterMap = {};
    allUsersData.forEach((u) => {
      userMasterMap[u.id] = u;
    });

    let globalValidTindakan = 0;
    const globalValidPatients = new Set();
    const actionMap = {};

    allActions.forEach((act) => {
      if (!actionMap[act.userId]) actionMap[act.userId] = [];
      actionMap[act.userId].push(act);
      if (act.userId) {
        const userDb = userMasterMap[act.userId];
        if (userDb) {
          const prefixDb = userDb.titlePrefix || "";
          const isDoctorPrefix = /^(dr\.|drg\.|dr|drg)/i.test(prefixDb.trim());
          const doctorName = act.doctorName || "";
          const isDoctorExcel =
            /^(dr\.|drg\.)/i.test(doctorName.trim()) ||
            /\bSp\./i.test(doctorName);
          if (isDoctorPrefix || isDoctorExcel) {
            globalValidTindakan++;
            if (act.noRM) globalValidPatients.add(act.noRM);
          }
        }
      }
    });

    const attendanceDetailMap = {};
    attendances.forEach((att) => {
      if (!attendanceDetailMap[att.userId])
        attendanceDetailMap[att.userId] = [];
      attendanceDetailMap[att.userId].push(att);
    });

    const workloadGrouped = {};
    let total = {
      tindakan: globalValidTindakan,
      pasien: globalValidPatients.size,
      jam: 0,
      totalHariHadir: 0,
      validActivity: 0,
      outOfShift: 0,
    };
    const processedUserIds = new Set();
    const normalizeDoctorKey = (name) => name.toLowerCase().trim();

    workloadRaw.forEach((row) => {
      if (!row.name || !row.userId) return;
      const userDb = userMasterMap[row.userId];
      if (!userDb) return;

      const prefixDb = userDb.titlePrefix || "";
      const isDoctorPrefix = /^(dr\.|drg\.|dr|drg)/i.test(prefixDb.trim());
      const isDoctorExcel =
        /^(dr\.|drg\.)/i.test(row.name.trim()) || /\bSp\./i.test(row.name);

      if (!isDoctorPrefix && !isDoctorExcel) return;

      const prefix = userDb.titlePrefix ? userDb.titlePrefix.trim() + " " : "";
      const suffix = userDb.titleSuffix ? ", " + userDb.titleSuffix.trim() : "";
      const displayName = userDb.fullName
        ? `${prefix}${userDb.fullName}${suffix}`
        : formatDoctorDisplayName(row.name);

      const doctorKey = normalizeDoctorKey(displayName);
      if (!workloadGrouped[doctorKey]) {
        const docShifts = shiftsRaw
          .filter((s) => s.userId === userDb.id)
          .sort((a, b) => new Date(b.date) - new Date(a.date));
        const latestShift = docShifts.length > 0 ? docShifts[0] : null;

        workloadGrouped[doctorKey] = {
          userId: userDb.id,
          name: displayName,
          nip: userDb.nip || "-",
          tindakan: 0,
          pasien: 0,
          jam: 0,
          totalHariHadir: 0,
          validActivity: 0,
          outOfShift: 0,
          employmentType: userDb.employmentType || "-",
          profession: userDb.profession?.name || "-",
          position: userDb.position?.name || "-",
          currentShift: latestShift?.workShift?.name || "Tidak ada shift",
          shiftTime: latestShift?.workShift
            ? `${latestShift.workShift.startTime} - ${latestShift.workShift.endTime}`
            : "-",
        };
      }

      const jmlTindakan = parseInt(row.tindakan) || 0;
      const jmlPasien = parseInt(row.pasien) || 0;

      workloadGrouped[doctorKey].tindakan += jmlTindakan;
      workloadGrouped[doctorKey].pasien += jmlPasien;

      if (!processedUserIds.has(row.userId)) {
        processedUserIds.add(row.userId);
        const userAttendances = attendanceDetailMap[row.userId] || [];
        const userActions = actionMap[row.userId] || [];
        let workHours = 0;
        const hariHadirUnik = new Set();

        userAttendances.forEach((att) => {
          if (att.checkInTime && att.checkOutTime) {
            hariHadirUnik.add(att.date);

            let inTime = new Date(att.checkInTime);
            if (isNaN(inTime.getTime()))
              inTime = new Date(`${att.date}T${att.checkInTime}`);
            let outTime = new Date(att.checkOutTime);
            if (isNaN(outTime.getTime()))
              outTime = new Date(`${att.date}T${att.checkOutTime}`);

            if (!isNaN(inTime.getTime()) && !isNaN(outTime.getTime())) {
              let diff = (outTime - inTime) / (1000 * 60 * 60);
              if (diff < 0) diff += 24;
              workHours += diff;
            }
          }
        });
        const jumlahHariHadir = hariHadirUnik.size;

        workloadGrouped[doctorKey].jam += workHours;
        workloadGrouped[doctorKey].totalHariHadir += jumlahHariHadir;

        total.jam += workHours;
        total.totalHariHadir += jumlahHariHadir;

        let validActivity = 0;
        let outOfShift = 0;

        const userShifts = shiftsRaw.filter((s) => s.userId === row.userId);
        // userActions.forEach((act) => {
        //   let actionTime = new Date(act.dateOfAction);

        //   let actionDateLocal = new Date(
        //     actionTime.getTime() - actionTime.getTimezoneOffset() * 60000,
        //   )
        //     .toISOString()
        //     .split("T")[0];

        //   let isValidShift = userShifts.some((shift) => {
        //     if (shift.date !== actionDateLocal) return false;
        //     if (
        //       !shift.workShift ||
        //       !shift.workShift.startTime ||
        //       !shift.workShift.endTime
        //     )
        //       return false;

        //     let shiftStart = new Date(
        //       `${shift.date}T${shift.workShift.startTime}`,
        //     );
        //     let shiftEnd = new Date(`${shift.date}T${shift.workShift.endTime}`);

        //     if (shiftEnd < shiftStart) {
        //       shiftEnd = new Date(shiftEnd.getTime() + 24 * 60 * 60 * 1000);
        //     }

        //     return actionTime >= shiftStart && actionTime <= shiftEnd;
        //   });

        //   if (isValidShift) validActivity++;
        //   else outOfShift++;
        // });
        userActions.forEach((act) => {
          const actionTime = toWibInstant(act.dateOfAction);

          if (!actionTime.isValid()) {
            outOfShift++;
            return;
          }

          const isValidShift = userShifts.some((shift) => {
            if (!shift.workShift?.startTime || !shift.workShift?.endTime) {
              return false;
            }

            const shiftDate = moment(shift.date).format("YYYY-MM-DD");

            const shiftStart = buildWibDateTime(
              shiftDate,
              shift.workShift.startTime,
            );

            let shiftEnd = buildWibDateTime(shiftDate, shift.workShift.endTime);

            if (!shiftStart || !shiftEnd) {
              return false;
            }

            if (!shiftEnd.isAfter(shiftStart)) {
              shiftEnd = shiftEnd.add(1, "day");
            }

            return (
              actionTime.valueOf() >= shiftStart.valueOf() &&
              actionTime.valueOf() <= shiftEnd.valueOf()
            );
          });

          if (isValidShift) {
            validActivity++;
          } else {
            outOfShift++;
          }
        });
        workloadGrouped[doctorKey].validActivity += validActivity;
        workloadGrouped[doctorKey].outOfShift += outOfShift;
        total.validActivity += validActivity;
        total.outOfShift += outOfShift;
      }
    });

    // total.jam = parseFloat(total.jam.toFixed(2));
    // const byDoctor = Object.values(workloadGrouped).map((doc) => {
    //   const jamFix = isNaN(doc.jam) ? 0 : parseFloat(doc.jam.toFixed(2));
    //   const hariHadirFix = doc.totalHariHadir || 0;
    //   return {
    //     ...doc,
    //     jam: jamFix,
    //     totalHariHadir: hariHadirFix,
    //     pasienPerHari:
    //       hariHadirFix > 0
    //         ? parseFloat((doc.pasien / hariHadirFix).toFixed(2))
    //         : 0,
    //     productivityReguler:
    //       jamFix > 0 ? parseFloat((doc.validActivity / jamFix).toFixed(2)) : 0,
    //     isDokterOnCall: doc.outOfShift > 0,
    //     hadir: jamFix > 0,
    //   };
    // });

    const totalJamRaw = total.jam;
    total.jam = Math.round(totalJamRaw);

    const byDoctor = Object.values(workloadGrouped).map((doc) => {
      const jamRaw = isNaN(doc.jam) ? 0 : doc.jam;
      const jamFix = Math.round(jamRaw);
      const hariHadirFix = doc.totalHariHadir || 0;

      return {
        ...doc,
        jam: jamFix,
        totalHariHadir: hariHadirFix,
        pasienPerHari:
          hariHadirFix > 0
            ? parseFloat((doc.pasien / hariHadirFix).toFixed(2))
            : 0,

        // Produktivitas tetap dihitung dari jam asli agar hasilnya tidak bias
        productivityReguler:
          jamRaw > 0 ? parseFloat((doc.validActivity / jamRaw).toFixed(2)) : 0,

        isDokterOnCall: doc.outOfShift > 0,
        hadir: jamRaw > 0,
      };
    });

    res.json({ workload: { total, byDoctor } });
  } catch (e) {
    console.error(e);
    res.status(500).json({
      message: "Gagal mengambil workload doctors dashboard executive",
      error: e.message,
    });
  }
};

// Unit distribution - menghitung distribusi per unit layanan
export const getUnitDistribution = async (req, res) => {
  try {
    const formatIntegerID = (value) => {
      return Number(value || 0).toLocaleString("id-ID", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      });
    };

    const formatPercentID = (value) => {
      return (
        Number(value || 0).toLocaleString("id-ID", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }) + "%"
      );
    };

    const filters = buildDashboardFilters(req);
    const [allActions, attendances, shiftsRaw, allUsersData] =
      await Promise.all([
        ActionData.findAll({
          where: filters.baseWhere,
          attributes: [
            "id",
            "doctorName",
            "userId",
            "dateOfAction",
            "serviceUnit",
            "noRM",
          ],
          raw: true,
        }),
        Attendances.findAll({
          where: filters.attendanceDateFilter,
          raw: true,
          nest: true,
        }),
        ShiftAssignment.findAll({
          where: filters.shiftDateFilter,
          include: [{ model: WorkShift, as: "workShift" }],
          raw: true,
          nest: true,
        }),
        Users.findAll({ raw: true, nest: true }),
      ]);

    const userMasterMap = {};
    allUsersData.forEach((u) => {
      userMasterMap[u.id] = u;
    });

    const attendanceDetailMap = {};
    attendances.forEach((att) => {
      if (!attendanceDetailMap[att.userId])
        attendanceDetailMap[att.userId] = [];
      attendanceDetailMap[att.userId].push(att);
    });

    const shiftsByUserAndDate = {};
    shiftsRaw.forEach((shift) => {
      const shiftDateStr = moment(shift.date).format("YYYY-MM-DD");
      const key = `${shift.userId}_${shiftDateStr}`;
      if (!shiftsByUserAndDate[key]) shiftsByUserAndDate[key] = [];
      shiftsByUserAndDate[key].push(shift);
    });

    const distUnitMap = {};
    const distStaffMap = {};

    allActions.forEach((act) => {
      const unit = act.serviceUnit || "Tanpa Unit";
      const userId = act.userId;
      const actDateStr = moment(act.dateOfAction).format("YYYY-MM-DD");

      // 1. REVISI: DAFTARKAN UNIT & HITUNG SEMUA TINDAKAN TANPA SYARAT
      if (!distUnitMap[unit]) {
        distUnitMap[unit] = {
          name: unit,
          unit_name: unit,
          total_tindakan: 0,
          presentStaffIds: new Set(),
          sum_jam_hadir: 0,
        };
      }
      distUnitMap[unit].total_tindakan++; // Semua tindakan (29rb+) terhitung di sini

      // 2. LOGIKA KEHADIRAN & PEMETAAN STAF (HANYA UNTUK YANG SHIFT)
      if (userId) {
        const user = userMasterMap[userId];
        if (user && user.employmentType === "Shift") {
          let jamHadirAct = 0;
          let shiftName = "NULL";
          const userAtts = attendanceDetailMap[userId] || [];
          const att = userAtts.find((a) => a.date === actDateStr);

          if (att && ["Hadir", "Terlambat"].includes(att.attendanceStatus)) {
            distUnitMap[unit].presentStaffIds.add(userId);
            if (att.checkInTime && att.checkOutTime) {
              let inTime = new Date(att.checkInTime);
              if (isNaN(inTime.getTime()))
                inTime = new Date(`${att.date}T${att.checkInTime}`);
              let outTime = new Date(att.checkOutTime);
              if (isNaN(outTime.getTime()))
                outTime = new Date(`${att.date}T${att.checkOutTime}`);
              if (!isNaN(inTime.getTime()) && !isNaN(outTime.getTime())) {
                let diffHours = (outTime - inTime) / (1000 * 60 * 60);
                if (diffHours < 0) diffHours += 24;
                jamHadirAct = diffHours;
              }
            }
            // Catatan pembimbing: Baris ini bisa menjumlahkan jam hadir berkali-kali
            // per jumlah tindakan. Jika ini memang rumus "beban kerja" yang kamu maksud, lanjutkan.
            distUnitMap[unit].sum_jam_hadir += jamHadirAct;
          }

          const docShifts =
            shiftsByUserAndDate[`${userId}_${actDateStr}`] || [];
          if (docShifts.length > 0)
            shiftName = docShifts[0].workShift?.name || "NULL";

          if (att && ["Hadir", "Terlambat"].includes(att.attendanceStatus)) {
            const staffKey = `${unit}_${userId}_${shiftName}`;
            if (!distStaffMap[staffKey]) {
              distStaffMap[staffKey] = {
                unit_name: unit,
                user_id: userId,
                nama_staf: user.fullName || act.doctorName || "-",
                nip: user.nip || "-",
                jabatan: user.position?.name || "-",
                profesi: user.profession?.name || "-",
                shift_name: shiftName,
                total_tindakan: 0,
                pasienSet: new Set(),
                sum_jam_hadir: 0,
                attendanceDates: new Set(),
              };
            }
            distStaffMap[staffKey].total_tindakan++;
            if (act.noRM) distStaffMap[staffKey].pasienSet.add(act.noRM);
            distStaffMap[staffKey].sum_jam_hadir += jamHadirAct;
            distStaffMap[staffKey].attendanceDates.add(actDateStr);
          }
        }
      }
    });

    const totalSemuaTindakan = Object.values(distUnitMap).reduce(
      (sum, d) => sum + d.total_tindakan,
      0,
    );

    const distributionRaw = Object.values(distUnitMap)
      .map((d) => {
        const staff_present = d.presentStaffIds.size;
        // const persentase =
        //   totalSemuaTindakan > 0
        //     ? ((d.total_tindakan / totalSemuaTindakan) * 100).toFixed(2) + "%"
        //     : "0%";
        const persentase =
          totalSemuaTindakan > 0
            ? formatPercentID((d.total_tindakan / totalSemuaTindakan) * 100)
            : "0,00%";
        return {
          name: d.name,
          value: d.total_tindakan,
          unit_name: d.unit_name,
          total_tindakan: d.total_tindakan,
          persentase: persentase,
          staff_present,
          ratio:
            staff_present > 0
              ? parseFloat((d.total_tindakan / staff_present).toFixed(2))
              : null,
          workload:
            d.sum_jam_hadir > 0
              ? parseFloat((d.total_tindakan / d.sum_jam_hadir).toFixed(2))
              : null,
          sum_jam_hadir: d.sum_jam_hadir,
        };
      })
      .sort((a, b) => b.total_tindakan - a.total_tindakan);

    // 2. 🛠️ LOGIKA PENGGABUNGAN UNIT LAINNYA
    let distribution = distributionRaw;

    if (distributionRaw.length > 10) {
      const top10 = distributionRaw.slice(0, 10);
      const others = distributionRaw.slice(10);

      const totalTindakanLainnya = others.reduce(
        (sum, d) => sum + d.total_tindakan,
        0,
      );
      const totalStaffLainnya = others.reduce(
        (sum, d) => sum + d.staff_present,
        0,
      );
      const totalJamHadirLainnya = others.reduce(
        (sum, d) => sum + d.sum_jam_hadir,
        0,
      );

      //   const persentaseLainnya =
      //     totalSemuaTindakan > 0
      //       ? ((totalTindakanLainnya / totalSemuaTindakan) * 100).toFixed(2) + "%"
      //       : "0%";

      const persentaseLainnya =
        totalSemuaTindakan > 0
          ? formatPercentID((totalTindakanLainnya / totalSemuaTindakan) * 100)
          : "0,00%";

      const unitLainnya = {
        name: "UNIT LAINNYA",
        value: totalTindakanLainnya,
        unit_name: "UNIT LAINNYA",
        total_tindakan: totalTindakanLainnya,
        persentase: persentaseLainnya,
        staff_present: totalStaffLainnya,
        ratio:
          totalStaffLainnya > 0
            ? parseFloat((totalTindakanLainnya / totalStaffLainnya).toFixed(2))
            : null,
        workload:
          totalJamHadirLainnya > 0
            ? parseFloat(
                (totalTindakanLainnya / totalJamHadirLainnya).toFixed(2),
              )
            : null,
      };

      // Bersihkan property 'sum_jam_hadir' agar response API tetap bersih
      top10.forEach((d) => delete d.sum_jam_hadir);

      distribution = [...top10, unitLainnya];
    } else {
      // Jika unit kurang dari atau sama dengan 10, cukup bersihkan saja
      distribution.forEach((d) => delete d.sum_jam_hadir);
    }

    const distributionStaff = Object.values(distStaffMap)
      .map((d) => {
        const distDates = d.attendanceDates.size;
        return {
          ...d,
          total_pasien: d.pasienSet.size,
          total_jam_hadir: parseFloat(d.sum_jam_hadir.toFixed(2)),
          rasio_tindakan:
            distDates > 0
              ? parseFloat((d.total_tindakan / distDates).toFixed(2))
              : null,
          workload_per_jam:
            d.sum_jam_hadir > 0
              ? parseFloat((d.total_tindakan / d.sum_jam_hadir).toFixed(2))
              : null,
        };
      })
      .sort((a, b) => {
        if (a.unit_name < b.unit_name) return -1;
        if (a.unit_name > b.unit_name) return 1;
        return b.total_tindakan - a.total_tindakan;
      });

    const unitLainnya = distribution.find((d) => d.name === "UNIT LAINNYA") || {
      total_tindakan: 0,
      persentase: "0%",
    };

    res.json({
      total_semua_tindakan: totalSemuaTindakan,
      unit_volume_tertinggi: distribution[0]?.name || "-",
      kontribusi_tertinggi: distribution[0]?.persentase || "0%",
      //   total_tindakan_20_unitlainnya: `${unitLainnya.total_tindakan.toLocaleString()} tindakan (${unitLainnya.persentase})`,
      total_tindakan_20_unitlainnya: `${formatIntegerID(
        unitLainnya.total_tindakan,
      )} tindakan (${unitLainnya.persentase})`,
      distribution,
      distributionStaff,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({
      message: "Gagal mengambil distribusi unit dashboard executive",
      error: e.message,
    });
  }
};

// Heatmap - menghitung data kesibukan vs jadwal shift
export const getHeatmap = async (req, res) => {
  try {
    const filters = buildDashboardFilters(req);
    const { baseWhere, attendanceDateFilter, shiftDateFilter } = filters;

    const round2 = (value) => {
      return parseFloat((Number(value) || 0).toFixed(2));
    };

    const getAverageRatioPerDay = (data) => {
      const dailyMap = {};

      data.forEach((item) => {
        if (!dailyMap[item.tanggal]) {
          dailyMap[item.tanggal] = {
            totalRatio: 0,
            totalSlot: 0,
          };
        }

        dailyMap[item.tanggal].totalRatio += Number(item.ratio) || 0;
        dailyMap[item.tanggal].totalSlot += 1;
      });

      const dailyRatios = Object.values(dailyMap).map((item) => {
        return item.totalSlot > 0 ? item.totalRatio / item.totalSlot : 0;
      });

      if (dailyRatios.length === 0) return 0;

      const avg =
        dailyRatios.reduce((sum, value) => sum + value, 0) / dailyRatios.length;

      return round2(avg);
    };

    const [allActions, attendances, shiftsRaw, allUsersData] =
      await Promise.all([
        ActionData.findAll({
          where: baseWhere,
          attributes: [
            "id",
            "doctorName",
            "userId",
            "dateOfAction",
            "serviceUnit",
            "noRM",
          ],
          raw: true,
        }),
        Attendances.findAll({
          where: attendanceDateFilter,
          raw: true,
          nest: true,
        }),
        ShiftAssignment.findAll({
          where: shiftDateFilter,
          include: [
            {
              model: Users,
              as: "user",
              include: [
                {
                  model: Position,
                  as: "position",
                  include: [{ model: Division }],
                },
              ],
            },
            { model: WorkShift, as: "workShift" },
          ],
          raw: true,
          nest: true,
        }),
        Users.findAll({
          include: [{ model: Position, include: [{ model: Division }] }],
          raw: true,
          nest: true,
        }),
      ]);

    const userMasterMap = {};
    allUsersData.forEach((u) => {
      userMasterMap[u.id] = u;
    });

    const attendanceDetailMap = {};
    attendances.forEach((att) => {
      if (!attendanceDetailMap[att.userId]) {
        attendanceDetailMap[att.userId] = [];
      }
      attendanceDetailMap[att.userId].push(att);
    });

    const nonDoctorNonShifts = [];

    attendances.forEach((att) => {
      const uMaster = userMasterMap[att.userId];
      if (!uMaster) return;

      const uName = (uMaster.fullName || "").toLowerCase().trim();
      const posName = (
        uMaster.Position?.name ||
        uMaster.position?.name ||
        ""
      ).toLowerCase();

      const isDoctor = /dokter|dr\.|drg/i.test(posName);

      if (
        !isDoctor &&
        ["Hadir", "Terlambat", "Tidak Valid"].includes(att.attendanceStatus)
      ) {
        if (
          uMaster.employmentType === "Non-Shift" ||
          uName === "dwiana widiyanti" ||
          uName === "konengsih"
        ) {
          let cIn = att.checkInTime
            ? new Date(att.checkInTime)
            : new Date(`${att.date}T00:00:00`);

          let cOut = att.checkOutTime
            ? new Date(att.checkOutTime)
            : new Date(`${att.date}T23:59:59`);

          if (cOut < cIn) {
            cOut = new Date(cOut.getTime() + 24 * 60 * 60 * 1000);
          }

          nonDoctorNonShifts.push({
            userId: att.userId,
            user: uMaster,
            userName: uName,
            cIn,
            cOut,
            workShift: { name: "Non Shift" },
            isDoctor: false,
          });
        }
      }
    });

    const processedShifts = shiftsRaw.map((shift) => {
      //   let start = new Date(
      //     `${shift.date}T${shift.workShift?.startTime || "00:00:00"}`,
      //   );

      //   let end = new Date(
      //     `${shift.date}T${shift.workShift?.endTime || "00:00:00"}`,
      //   );
      const shiftDate = moment(shift.date).format("YYYY-MM-DD");
      const startMoment = buildWibDateTime(
        shiftDate,
        shift.workShift?.startTime || "00:00:00",
      );
      let endMoment = buildWibDateTime(
        shiftDate,
        shift.workShift?.endTime || "00:00:00",
      );
      if (startMoment && endMoment && !endMoment.isAfter(startMoment)) {
        endMoment = endMoment.add(1, "day");
      }
      const start = startMoment?.toDate() || null;
      const end = endMoment?.toDate() || null;

      //   if (end < start) {
      //     end = new Date(end.getTime() + 24 * 60 * 60 * 1000);
      //   }

      const posName =
        shift.user?.position?.name || shift.user?.Position?.name || "";

      const isDoctor = /dokter|dr\.|drg/i.test(posName.toLowerCase());
      const userName = (shift.user?.fullName || "").toLowerCase().trim();

      const divData =
        shift.user?.position?.Division || shift.user?.position?.division;

      const divName = (divData?.name || "").toLowerCase().trim();

      const userAtts = attendanceDetailMap[shift.userId] || [];

      const validAtt = userAtts.find(
        (a) =>
          a.date === shift.date &&
          ["Hadir", "Terlambat", "Tidak Valid"].includes(a.attendanceStatus),
      );

      let cIn = null;
      let cOut = null;

      if (validAtt) {
        cIn = validAtt.checkInTime ? new Date(validAtt.checkInTime) : start;

        cOut = validAtt.checkOutTime ? new Date(validAtt.checkOutTime) : end;

        if (cOut < cIn) {
          cOut = new Date(cOut.getTime() + 24 * 60 * 60 * 1000);
        }
      }

      return {
        ...shift,
        actual_start: start,
        actual_end: end,
        isDoctor,
        userName,
        divName,
        posName,
        validAtt,
        cIn,
        cOut,
      };
    });

    const nonDoctorShifts = processedShifts.filter(
      (s) => !s.isDoctor && s.validAtt,
    );

    const heatmapUnitsMap = {};

    allActions.forEach((act) => {
      const unit = act.serviceUnit || "Tanpa Unit";
      const u = unit.toUpperCase().trim();
      //   const actionDate = new Date(act.dateOfAction);
      //   const actionDateStr = moment(actionDate).format("YYYY-MM-DD");
      //   const hour = actionDate.getHours();
      const actionDate = toWibInstant(act.dateOfAction);
      if (!actionDate.isValid()) {
        return;
      }
      const actionDateStr = actionDate.format("YYYY-MM-DD");
      const hour = actionDate.hour();

      if (!heatmapUnitsMap[unit]) heatmapUnitsMap[unit] = {};

      if (!heatmapUnitsMap[unit][actionDateStr]) {
        heatmapUnitsMap[unit][actionDateStr] = Array.from(
          { length: 24 },
          (_, i) => ({
            hour: i,
            tanggal: actionDateStr,
            tindakanSet: new Set(),
            pasienSet: new Set(),
            terlibatSet: new Set(),
            hadirSet: new Set(),
            identitasMap: new Map(),
            shiftNames: new Set(),
          }),
        );
      }

      const hData = heatmapUnitsMap[unit][actionDateStr][hour];

      hData.tindakanSet.add(act.id);

      if (act.noRM) {
        hData.pasienSet.add(act.noRM);
      }

      if (act.userId) {
        const userMaster = userMasterMap[act.userId];

        const posName = (
          userMaster?.Position?.name ||
          userMaster?.position?.name ||
          ""
        ).toLowerCase();

        const isDoctor = /dokter|dr\.|drg/i.test(posName);

        const divData =
          userMaster?.Position?.Division || userMaster?.position?.division;

        const divName = (divData?.name || "").toLowerCase().trim();

        const validDoctorUnit =
          (u === "MCU" && ["poliklinik", "yanmed"].includes(divName)) ||
          (["IGD", "VK", "HEMODIALISA"].includes(u) &&
            ["igd", "yanmed"].includes(divName)) ||
          (u === "ICU" && ["icu", "yanmed"].includes(divName)) ||
          (u === "KAMAR OPERASI" &&
            ["kamar operasi", "yanmed"].includes(divName)) ||
          (["LABORATORIUM", "LABORATORIUM KHUSUS MCU"].includes(u) &&
            ["laboratorium", "yanmed"].includes(divName)) ||
          (u === "PATOLOGI ANATOMI" &&
            ["patologi anatomi", "yanmed"].includes(divName)) ||
          (["RADIOLOGI", "RADIOLOGI KHUSUS MCU"].includes(u) &&
            ["radiologi", "yanmed"].includes(divName)) ||
          (u.startsWith("POLIKLINIK") &&
            ["poliklinik", "yanmed"].includes(divName)) ||
          (["PURI AMARTA 1", "PURI AMARTA 2", "PURI AMARTA 3"].includes(u) &&
            ["puri amarta", "yanwat"].includes(divName)) ||
          (u === "PURI CAKRA KEMBANG" &&
            ["puri cakra kembang", "yanwat"].includes(divName)) ||
          (u === "PURI KENCANA 1" &&
            ["puri kencana 1", "yanwat"].includes(divName)) ||
          (u === "PURI KENCANA 2" &&
            ["puri kencana 2", "yanwat"].includes(divName));

        if (isDoctor && validDoctorUnit) {
          const userAtts = attendanceDetailMap[act.userId] || [];

          const validDoctorAtt = userAtts.find((a) => {
            if (!["Hadir", "Terlambat"].includes(a.attendanceStatus)) {
              return false;
            }

            let cIn = a.checkInTime
              ? new Date(a.checkInTime)
              : new Date(`${a.date}T00:00:00`);

            let cOut = a.checkOutTime
              ? new Date(a.checkOutTime)
              : new Date(`${a.date}T23:59:59`);

            if (cOut < cIn) {
              cOut = new Date(cOut.getTime() + 24 * 60 * 60 * 1000);
            }

            return actionDate >= cIn && actionDate <= cOut;
          });

          if (validDoctorAtt) {
            hData.terlibatSet.add(act.userId);
            hData.hadirSet.add(act.userId);

            const docShift = processedShifts.find(
              (s) =>
                s.userId === act.userId &&
                actionDate >= s.actual_start &&
                actionDate <= s.actual_end,
            );

            if (docShift && docShift.workShift?.name) {
              hData.shiftNames.add(docShift.workShift.name);
            }

            let formattedName = userMaster?.fullName || "Tanpa Nama";

            if (posName.includes("dokter gigi")) {
              formattedName = `drg. ${formattedName}`;
            } else if (posName.includes("dokter")) {
              formattedName = `dr. ${formattedName}`;
            }

            hData.identitasMap.set(act.userId, formattedName);
          }
        }
      }

      const matchedNonDoctors = nonDoctorShifts.filter((s) => {
        if (actionDate < s.cIn || actionDate > s.cOut) return false;

        const divName = s.divName;
        const userName = s.userName;
        const posName = s.posName.toLowerCase();

        const isPoliklinik =
          u.startsWith("POLIKLINIK") && u !== "POLIKLINIK PSIKOLOG";

        return (
          (["PURI AMARTA 1", "PURI AMARTA 2", "PURI AMARTA 3"].includes(u) &&
            divName === "puri amarta") ||
          (u === "PURI KENCANA 1" && divName === "puri kencana 1") ||
          (u === "PURI KENCANA 2" && divName === "puri kencana 2") ||
          (u === "PURI CAKRA KEMBANG" && divName === "puri cakra kembang") ||
          (["IGD", "VK"].includes(u) && divName === "igd") ||
          (u === "ICU" && divName === "icu") ||
          (u === "KAMAR OPERASI" && divName === "kamar operasi") ||
          (u === "NICU/PICU" && divName === "nicu-picu") ||
          (u === "PATOLOGI ANATOMI" && divName === "radiologi") ||
          (["RADIOLOGI", "RADIOLOGI KHUSUS MCU"].includes(u) &&
            divName === "radiologi") ||
          (["LABORATORIUM", "LABORATORIUM KHUSUS MCU"].includes(u) &&
            divName === "laboratorium") ||
          (u === "DOKPOL" && divName === "yanmed") ||
          (u === "DOTS" && ["poliklinik", "yanmed"].includes(divName)) ||
          (u === "HEMODIALISA" && divName === "yanmed") ||
          (u === "MCU" && ["poliklinik", "yanmed"].includes(divName)) ||
          (u === "BANK DARAH" &&
            (posName.includes("perawat hd") ||
              posName.includes("teknisi hd") ||
              posName.includes("perawat amarta") ||
              posName.includes("perawat icu") ||
              posName.includes("perawat nicu-picu"))) ||
          posName.includes("perawat pdp") ||
          posName.includes("perawat puri kencana 1") ||
          (posName.includes("perawat puri kencana 2") &&
            isPoliklinik &&
            ["poliklinik", "yanmed"].includes(divName)) ||
          (u === "FISIOTERAPI" &&
            (posName.includes("psikolog pdp") ||
              posName.includes("psikolog yanwat")) &&
            userName === "konengsih")
        );
      });

      const matchedNonShift = nonDoctorNonShifts.filter((s) => {
        if (actionDate < s.cIn || actionDate > s.cOut) return false;

        const posName = (
          s.user?.Position?.name ||
          s.user?.position?.name ||
          ""
        ).toLowerCase();

        const divName = (
          s.user?.Position?.Division?.name ||
          s.user?.position?.division?.name ||
          ""
        ).toLowerCase();

        if (u === "FISIOTERAPI" && s.userName === "konengsih") return true;

        if (u === "POLIKLINIK PSIKOLOG" && s.userName === "dwiana widiyanti") {
          return true;
        }

        if (
          u === "DOKPOL" &&
          (posName.includes("dokpol") || divName.includes("dokpol"))
        ) {
          return true;
        }

        return false;
      });

      const finalMatchedNonDoctors = [...matchedNonDoctors, ...matchedNonShift];

      finalMatchedNonDoctors.forEach((s) => {
        hData.terlibatSet.add(s.userId);
        hData.hadirSet.add(s.userId);

        if (s.workShift?.name) {
          hData.shiftNames.add(s.workShift.name);
        }

        hData.identitasMap.set(s.userId, `${s.user?.fullName || "Tanpa Nama"}`);
      });
    });

    const heatmap = Object.keys(heatmapUnitsMap)
      .map((unit) => {
        const data = [];

        Object.keys(heatmapUnitsMap[unit]).forEach((dateStr) => {
          heatmapUnitsMap[unit][dateStr].forEach((h) => {
            const t_tindakan = h.tindakanSet.size;
            const t_terlibat = h.terlibatSet.size;

            if (t_tindakan > 0) {
              const ratio =
                t_terlibat > 0 ? round2(t_tindakan / t_terlibat) : 0;

              data.push({
                tanggal: h.tanggal,
                hour: h.hour,
                tindakan: t_tindakan,
                total_pasien: h.pasienSet.size,
                tenaga_hadir: h.hadirSet.size,
                total_tm_terlibat: t_terlibat,
                karyawan: t_terlibat,
                identitas_tenaga_medis:
                  h.identitasMap.size > 0
                    ? Array.from(h.identitasMap.values())
                        .sort((a, b) => {
                          const nameA = a.toLowerCase();
                          const nameB = b.toLowerCase();
                          return nameA.localeCompare(nameB);
                        })
                        .join(" | ")
                    : null,
                shift_name:
                  h.shiftNames.size > 0
                    ? Array.from(h.shiftNames).join(", ")
                    : t_terlibat > 0
                      ? "Non Shift"
                      : null,
                ratio,
              });
            }
          });
        });

        data.sort(
          (a, b) => a.tanggal.localeCompare(b.tanggal) || a.hour - b.hour,
        );

        const avgRatio = getAverageRatioPerDay(data);

        return {
          unit,
          data,
          avgRatio,
        };
      })
      .filter((h) => h.data.length > 0)
      .sort((a, b) => b.avgRatio - a.avgRatio);

    // let totalGlobalTindakan = 0;
    // let totalGlobalTerlibat = 0;
    // const flatHeatmapData = [];

    // heatmap.forEach((h) => {
    //   h.data.forEach((d) => {
    //     flatHeatmapData.push({
    //       unit: h.unit,
    //       ...d,
    //     });

    //     totalGlobalTindakan += d.tindakan;
    //     totalGlobalTerlibat += d.karyawan;
    //   });
    // });

    // const rataRataRasioGlobal =
    //   totalGlobalTerlibat > 0
    //     ? round2(totalGlobalTindakan / totalGlobalTerlibat)
    //     : 0;

    // const hourMap = {};

    // flatHeatmapData.forEach((d) => {
    //   if (!hourMap[d.hour]) {
    //     hourMap[d.hour] = {
    //       tindakan: 0,
    //       terlibat: 0,
    //     };
    //   }

    //   hourMap[d.hour].tindakan += d.tindakan;
    //   hourMap[d.hour].terlibat += d.karyawan;
    // });

    // let maxHourRatio = -1;
    // let busiestHour = null;
    // let busiestHourTindakan = 0;

    // Object.keys(hourMap).forEach((hourStr) => {
    //   const hour = parseInt(hourStr, 10);
    //   const hData = hourMap[hourStr];

    //   const ratio = hData.terlibat > 0 ? hData.tindakan / hData.terlibat : 0;

    //   if (ratio > maxHourRatio) {
    //     maxHourRatio = ratio;
    //     busiestHour = hour;
    //     busiestHourTindakan = hData.tindakan;
    //   }
    // });

    // const persentaseJamTersibuk =
    //   totalGlobalTindakan > 0
    //     ? `${round2((busiestHourTindakan / totalGlobalTindakan) * 100)}%`
    //     : "0%";

    // const mostCongested = heatmap.reduce((max, item) => {
    //   if (!max || item.avgRatio > max.avgRatio) return item;
    //   return max;
    // }, null);

    // const congestedUnitTindakan = mostCongested
    //   ? mostCongested.data.reduce((sum, item) => sum + item.tindakan, 0)
    //   : 0;

    // const persentaseUnitPadat =
    //   totalGlobalTindakan > 0
    //     ? `${round2((congestedUnitTindakan / totalGlobalTindakan) * 100)}%`
    //     : "0%";

    // let highestRatioPoint = null;
    // let maxSingleRatio = -1;

    // flatHeatmapData.forEach((d) => {
    //   if (d.ratio > maxSingleRatio) {
    //     maxSingleRatio = d.ratio;
    //     highestRatioPoint = d;
    //   }
    // });

    // const getKategoriRasio = (ratio) => {
    //   if (ratio === 0) return "Tidak Ada Tindakan";
    //   if (ratio <= 1.5) return "Sepi (Rasio < 1,5)";
    //   if (ratio <= 2.5) return "Sedang (1,5-2,5)";
    //   return "Sangat Padat (Rasio > 2,5)";
    // };

    // // const sangatPadatPoints = flatHeatmapData.filter((d) => d.ratio > 2.5);
    // // let ringkasanTeks = "Data belum memadai untuk ditarik kesimpulan.";

    // // if (sangatPadatPoints.length > 0) {
    // //   const spUnitsMap = {};
    // //   const spTimeMap = {};

    // //   sangatPadatPoints.forEach((d) => {
    // //     spUnitsMap[d.unit] = (spUnitsMap[d.unit] || 0) + 1;

    // //     let timeOfDay = "malam hari";

    // //     if (d.hour >= 5 && d.hour < 12) {
    // //       timeOfDay = "pagi hari";
    // //     } else if (d.hour >= 12 && d.hour < 15) {
    // //       timeOfDay = "siang hari";
    // //     } else if (d.hour >= 15 && d.hour < 19) {
    // //       timeOfDay = "sore hari";
    // //     }

    // //     spTimeMap[timeOfDay] = (spTimeMap[timeOfDay] || 0) + 1;
    // //   });

    // //   const topSpUnits = Object.keys(spUnitsMap)
    // //     .sort((a, b) => spUnitsMap[b] - spUnitsMap[a])
    // //     .slice(0, 2);

    // //   const topSpTime = Object.keys(spTimeMap).sort(
    // //     (a, b) => spTimeMap[b] - spTimeMap[a],
    // //   )[0];

    // //   ringkasanTeks = `Terdapat ${sangatPadatPoints.length} slot waktu dengan rasio sangat padat (Rasio > 2,5) yang memerlukan perhatian manajemen, terutama di unit ${topSpUnits.join(" dan ")} pada ${topSpTime}`;
    // // } else {
    // //   ringkasanTeks =
    // //     "Distribusi beban kerja tenaga medis relatif stabil. Tidak terdapat slot waktu dengan tingkat kepadatan rasio kritis (Rasio > 2,5)";
    // // }

    // const sangatPadatPoints = flatHeatmapData.filter((d) => d.ratio > 2.5);

    // let ringkasanData = {
    //   nilai_slot: 0,
    //   top_unit_pertama: "-",
    //   top_unit_kedua: "-",
    //   waktu: "-",
    // };

    // if (sangatPadatPoints.length > 0) {
    //   const spUnitsMap = {};
    //   const spTimeMap = {};

    //   sangatPadatPoints.forEach((d) => {
    //     spUnitsMap[d.unit] = (spUnitsMap[d.unit] || 0) + 1;

    //     let timeOfDay = "malam hari";

    //     if (d.hour >= 5 && d.hour < 12) {
    //       timeOfDay = "pagi hari";
    //     } else if (d.hour >= 12 && d.hour < 15) {
    //       timeOfDay = "siang hari";
    //     } else if (d.hour >= 15 && d.hour < 19) {
    //       timeOfDay = "sore hari";
    //     }

    //     spTimeMap[timeOfDay] = (spTimeMap[timeOfDay] || 0) + 1;
    //   });

    //   const topSpUnits = Object.keys(spUnitsMap)
    //     .sort((a, b) => spUnitsMap[b] - spUnitsMap[a])
    //     .slice(0, 2);

    //   const topSpTime = Object.keys(spTimeMap).sort(
    //     (a, b) => spTimeMap[b] - spTimeMap[a],
    //   )[0];

    //   ringkasanData = {
    //     nilai_slot: sangatPadatPoints.length,
    //     top_unit_pertama: topSpUnits[0] || "-",
    //     top_unit_kedua: topSpUnits[1] || "-",
    //     waktu: topSpTime || "-",
    //   };
    // }

    // const summary = {
    //   jam_tersibuk: {
    //     rentang_jam:
    //       busiestHour !== null
    //         ? `${String(busiestHour).padStart(2, "0")}:00 - ${String(
    //             (busiestHour + 1) % 24,
    //           ).padStart(2, "0")}:00`
    //         : "-",
    //     nilai_rasio: round2(maxHourRatio),
    //     rata_rata_rasio: rataRataRasioGlobal,
    //     persentase: persentaseJamTersibuk,
    //   },

    //   unit_paling_padat: {
    //     nama_unit: mostCongested?.unit || "-",
    //     nilai_rasio: mostCongested ? round2(mostCongested.avgRatio) : 0,
    //     rata_rata_rasio: rataRataRasioGlobal,
    //     persentase: persentaseUnitPadat,
    //   },

    //   rasio_tertinggi: highestRatioPoint
    //     ? {
    //         nama_unit: highestRatioPoint.unit,
    //         jam_tindakan: `${String(highestRatioPoint.hour).padStart(
    //           2,
    //           "0",
    //         )}:00`,
    //         nilai_rasio: highestRatioPoint.ratio,
    //         rata_rata_rasio: rataRataRasioGlobal,
    //         kategori: getKategoriRasio(highestRatioPoint.ratio),
    //         status: highestRatioPoint.ratio > 2.5 ? "KRITIS" : "AMAN",
    //       }
    //     : null,

    //   //   ringkasan: ringkasanTeks,
    //   ringkasan: ringkasanData,
    // };

    // CODE PERBAIKAN
    let totalGlobalTindakan = 0;
    const flatHeatmapData = [];

    heatmap.forEach((h) => {
      h.data.forEach((d) => {
        flatHeatmapData.push({
          unit: h.unit,
          avgRatioUnit: h.avgRatio,
          ...d,
        });

        totalGlobalTindakan += d.tindakan;
      });
    });

    // Rata-rata rasio global dihitung dari rata-rata semua slot,
    // bukan total tindakan / total karyawan.
    const rataRataRasioGlobal =
      flatHeatmapData.length > 0
        ? round2(
            flatHeatmapData.reduce((sum, d) => sum + d.ratio, 0) /
              flatHeatmapData.length,
          )
        : 0;

    // ===============================
    // 1. JAM TERSIBUK
    // Definisi: jam dengan rata-rata rasio tertinggi
    // ===============================
    const hourMap = {};

    flatHeatmapData.forEach((d) => {
      if (!hourMap[d.hour]) {
        hourMap[d.hour] = {
          totalRatio: 0,
          totalSlot: 0,
          totalTindakan: 0,
        };
      }

      hourMap[d.hour].totalRatio += d.ratio;
      hourMap[d.hour].totalSlot += 1;
      hourMap[d.hour].totalTindakan += d.tindakan;
    });

    let busiestHour = null;
    let maxHourAvgRatio = -1;
    let busiestHourTindakan = 0;

    Object.keys(hourMap).forEach((hourStr) => {
      const hour = parseInt(hourStr, 10);
      const hData = hourMap[hourStr];

      const avgRatio =
        hData.totalSlot > 0 ? hData.totalRatio / hData.totalSlot : 0;

      if (
        avgRatio > maxHourAvgRatio ||
        (avgRatio === maxHourAvgRatio &&
          hData.totalTindakan > busiestHourTindakan)
      ) {
        maxHourAvgRatio = avgRatio;
        busiestHour = hour;
        busiestHourTindakan = hData.totalTindakan;
      }
    });

    const persentaseJamTersibuk =
      totalGlobalTindakan > 0
        ? `${round2((busiestHourTindakan / totalGlobalTindakan) * 100)}%`
        : "0%";

    // ===============================
    // 2. UNIT PALING PADAT
    // Definisi: unit dengan rata-rata rasio per hari tertinggi
    // ===============================
    const mostCongested = heatmap.reduce((max, item) => {
      if (!max || item.avgRatio > max.avgRatio) return item;

      if (max && item.avgRatio === max.avgRatio) {
        const itemTotalTindakan = item.data.reduce(
          (sum, d) => sum + d.tindakan,
          0,
        );

        const maxTotalTindakan = max.data.reduce(
          (sum, d) => sum + d.tindakan,
          0,
        );

        if (itemTotalTindakan > maxTotalTindakan) return item;
      }

      return max;
    }, null);

    const congestedUnitTindakan = mostCongested
      ? mostCongested.data.reduce((sum, item) => sum + item.tindakan, 0)
      : 0;

    // const persentaseUnitPadat =
    //   totalGlobalTindakan > 0
    //     ? `${round2((congestedUnitTindakan / totalGlobalTindakan) * 100)}%`
    //     : "0%";

    const persentaseUnitPadat =
      totalGlobalTindakan > 0
        ? `${round2((congestedUnitTindakan / totalGlobalTindakan) * 100)}%`
        : "0%";

    // ===============================
    // 3. RASIO TERTINGGI
    // Definisi: satu slot unit-jam-tanggal dengan rasio tertinggi
    // ===============================
    let highestRatioPoint = null;
    let maxSingleRatio = -1;

    flatHeatmapData.forEach((d) => {
      if (
        d.ratio > maxSingleRatio ||
        (d.ratio === maxSingleRatio &&
          highestRatioPoint &&
          d.tindakan > highestRatioPoint.tindakan)
      ) {
        maxSingleRatio = d.ratio;
        highestRatioPoint = d;
      }
    });

    const getKategoriRasio = (ratio) => {
      if (ratio === 0) return "Tidak Ada Tindakan";
      if (ratio < 1.5) return "Sepi (Rasio < 1,5)";
      if (ratio <= 2.5) return "Sedang (1,5-2,5)";
      return "Sangat Padat (Rasio > 2,5)";
    };

    const getTimeOfDay = (hour) => {
      if (hour >= 5 && hour < 12) return "pagi hari";
      if (hour >= 12 && hour < 15) return "siang hari";
      if (hour >= 15 && hour < 19) return "sore hari";
      return "malam hari";
    };

    // ===============================
    // 4. RINGKASAN
    // Definisi:
    // - nilai_slot = jumlah slot dengan rasio > 2,5
    // - top_unit_pertama/kedua = unit dengan jumlah slot padat terbanyak
    // - waktu = kategori waktu dengan slot padat terbanyak
    // ===============================
    const sangatPadatPoints = flatHeatmapData.filter((d) => d.ratio > 2.5);

    let ringkasanData = {
      nilai_slot: 0,
      top_unit_pertama: "-",
      top_unit_kedua: "-",
      waktu: "-",
    };

    if (sangatPadatPoints.length > 0) {
      const spUnitsMap = {};
      const spTimeMap = {};

      sangatPadatPoints.forEach((d) => {
        if (!spUnitsMap[d.unit]) {
          spUnitsMap[d.unit] = {
            jumlahSlot: 0,
            totalRatio: 0,
            totalTindakan: 0,
          };
        }

        spUnitsMap[d.unit].jumlahSlot += 1;
        spUnitsMap[d.unit].totalRatio += d.ratio;
        spUnitsMap[d.unit].totalTindakan += d.tindakan;

        const timeOfDay = getTimeOfDay(d.hour);

        if (!spTimeMap[timeOfDay]) {
          spTimeMap[timeOfDay] = {
            jumlahSlot: 0,
            totalRatio: 0,
            totalTindakan: 0,
          };
        }

        spTimeMap[timeOfDay].jumlahSlot += 1;
        spTimeMap[timeOfDay].totalRatio += d.ratio;
        spTimeMap[timeOfDay].totalTindakan += d.tindakan;
      });

      const topSpUnits = Object.keys(spUnitsMap)
        .sort((a, b) => {
          const unitA = spUnitsMap[a];
          const unitB = spUnitsMap[b];

          if (unitB.jumlahSlot !== unitA.jumlahSlot) {
            return unitB.jumlahSlot - unitA.jumlahSlot;
          }

          const avgRatioA =
            unitA.jumlahSlot > 0 ? unitA.totalRatio / unitA.jumlahSlot : 0;
          const avgRatioB =
            unitB.jumlahSlot > 0 ? unitB.totalRatio / unitB.jumlahSlot : 0;

          if (avgRatioB !== avgRatioA) {
            return avgRatioB - avgRatioA;
          }

          return unitB.totalTindakan - unitA.totalTindakan;
        })
        .slice(0, 2);

      const topSpTime = Object.keys(spTimeMap).sort((a, b) => {
        const timeA = spTimeMap[a];
        const timeB = spTimeMap[b];

        if (timeB.jumlahSlot !== timeA.jumlahSlot) {
          return timeB.jumlahSlot - timeA.jumlahSlot;
        }

        const avgRatioA =
          timeA.jumlahSlot > 0 ? timeA.totalRatio / timeA.jumlahSlot : 0;
        const avgRatioB =
          timeB.jumlahSlot > 0 ? timeB.totalRatio / timeB.jumlahSlot : 0;

        if (avgRatioB !== avgRatioA) {
          return avgRatioB - avgRatioA;
        }

        return timeB.totalTindakan - timeA.totalTindakan;
      })[0];

      ringkasanData = {
        nilai_slot: sangatPadatPoints.length,
        top_unit_pertama: topSpUnits[0] || "-",
        top_unit_kedua: topSpUnits[1] || "-",
        waktu: topSpTime || "-",
      };
    }

    const summary = {
      jam_tersibuk: {
        rentang_jam:
          busiestHour !== null
            ? `${String(busiestHour).padStart(2, "0")}:00 - ${String(
                (busiestHour + 1) % 24,
              ).padStart(2, "0")}:00`
            : "-",
        nilai_rasio: busiestHour !== null ? round2(maxHourAvgRatio) : 0,
        rata_rata_rasio: rataRataRasioGlobal,
        persentase: persentaseJamTersibuk,
      },

      unit_paling_padat: {
        nama_unit: mostCongested?.unit || "-",
        nilai_rasio: mostCongested ? round2(mostCongested.avgRatio) : 0,
        rata_rata_rasio: rataRataRasioGlobal,
        persentase: persentaseUnitPadat,
      },

      rasio_tertinggi: highestRatioPoint
        ? {
            nama_unit: highestRatioPoint.unit,
            tanggal: highestRatioPoint.tanggal,
            jam_tindakan: `${String(highestRatioPoint.hour).padStart(
              2,
              "0",
            )}:00`,
            nilai_rasio: highestRatioPoint.ratio,
            rata_rata_rasio: rataRataRasioGlobal,
            kategori: getKategoriRasio(highestRatioPoint.ratio),
            status: highestRatioPoint.ratio > 2.5 ? "KRITIS" : "AMAN",
          }
        : {
            nama_unit: "-",
            tanggal: "-",
            jam_tindakan: "-",
            nilai_rasio: 0,
            rata_rata_rasio: rataRataRasioGlobal,
            kategori: "Tidak Ada Tindakan",
            status: "AMAN",
          },

      ringkasan: ringkasanData,
    };
    res.json({
      summary,
      heatmap,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({
      message: "Gagal mengambil heatmap dashboard executive",
      error: e.message,
    });
  }
};

// Attendance timeline - menghitung timeline tenaga medis
export const getAttendanceTimeline = async (req, res) => {
  try {
    const filters = buildDashboardFilters(req);
    const {
      shiftDateFilter,
      attendanceDateFilter,
      baseWhere,
      startDate,
      endDate,
    } = filters;

    const [shiftsRaw, attendances, allActions] = await Promise.all([
      ShiftAssignment.findAll({
        where: shiftDateFilter,
        include: [
          {
            model: Users,
            as: "user",
            attributes: [
              "id",
              "titlePrefix",
              "fullName",
              "titleSuffix",
              "nip",
              "employmentType",
            ],
            include: [
              {
                model: Position,
                as: "position",
                attributes: ["name"],
                include: [
                  {
                    model: Division,
                    as: "division",
                    attributes: ["name"],
                    include: [
                      {
                        model: Department,
                        as: "department",
                        attributes: ["name"],
                      },
                    ],
                  },
                ],
              },
            ],
          },
          {
            model: WorkShift,
            as: "workShift",
            attributes: ["name", "startTime", "endTime"],
          },
        ],
        raw: true,
        nest: true,
      }),
      Attendances.findAll({
        where: {
          ...attendanceDateFilter,
          attendanceStatus: { [Op.in]: ["Hadir", "Terlambat", "Tidak Valid"] },
        },
        raw: true,
        nest: true,
      }),
      ActionData.findAll({
        where: baseWhere,
        attributes: [
          "id",
          "noRM",
          "userId",
          "dateOfAction",
          "actionName",
          "serviceUnit",
          "createdAt",
        ],
        raw: true,
      }),
    ]);

    const attendanceDetailMap = {};
    attendances.forEach((att) => {
      if (!attendanceDetailMap[att.userId])
        attendanceDetailMap[att.userId] = [];
      attendanceDetailMap[att.userId].push(att);
    });

    const actionByDateMap = {};
    allActions.forEach((act) => {
      const actDateStr = moment(act.dateOfAction || act.createdAt).format(
        "YYYY-MM-DD",
      );
      if (!actionByDateMap[actDateStr]) {
        actionByDateMap[actDateStr] = [];
      }
      actionByDateMap[actDateStr].push(act);
    });

    const targetStartStr = moment(startDate).format("YYYY-MM-DD");
    const targetEndStr = moment(endDate).format("YYYY-MM-DD");

    const rawTimeline = shiftsRaw
      .filter((shift) => {
        const shiftDate = moment(shift.date).format("YYYY-MM-DD");
        return shiftDate >= targetStartStr && shiftDate <= targetEndStr;
      })
      .map((shift) => {
        const userId = shift.userId;
        const shiftDate = moment(shift.date).format("YYYY-MM-DD");

        const u = shift.user || {};
        const positionName = (u.position?.name || "").toLowerCase();
        const divisionName = (u.position?.division?.name || "")
          .toLowerCase()
          .trim();
        const departmentName = u.position?.division?.department?.name || "-";
        const fullNameStr = (u.fullName || "").toLowerCase();

        const isDoctor =
          positionName.includes("dokter") ||
          positionName.includes("dr.") ||
          positionName.includes("drg");

        const attendanceList = attendanceDetailMap[userId] || [];
        const attendance = attendanceList.find((a) => {
          const attendanceDate = a.checkInTime
            ? moment(a.checkInTime).format("YYYY-MM-DD")
            : moment(a.date).format("YYYY-MM-DD");
          return attendanceDate === shiftDate;
        });

        const shiftStartStr = shift.workShift?.startTime || "00:00:00";
        const shiftEndStr = shift.workShift?.endTime || "23:59:59";

        let shiftStartDt = moment(
          `${shiftDate} ${shiftStartStr}`,
          "YYYY-MM-DD HH:mm:ss",
        ).toDate();
        let shiftEndDt = moment(
          `${shiftDate} ${shiftEndStr}`,
          "YYYY-MM-DD HH:mm:ss",
        ).toDate();

        if (shiftEndDt <= shiftStartDt) {
          shiftEndDt = moment(shiftEndDt).add(1, "days").toDate();
        }

        let boundStart = null;
        let boundEnd = null;

        if (attendance?.checkInTime && attendance?.checkOutTime) {
          boundStart = new Date(attendance.checkInTime);
          boundEnd = new Date(attendance.checkOutTime);
        } else if (attendance?.checkInTime && !attendance?.checkOutTime) {
          boundStart = new Date(attendance.checkInTime);
          boundEnd = shiftEndDt;
        } else if (!attendance?.checkInTime && attendance?.checkOutTime) {
          const checkOutDt = new Date(attendance.checkOutTime);
          if (checkOutDt > shiftEndDt) {
            boundStart = null;
            boundEnd = null;
          } else {
            boundStart = shiftStartDt;
            boundEnd = checkOutDt;
          }
        }

        const nextDayStr = moment(shiftDate)
          .add(1, "days")
          .format("YYYY-MM-DD");
        const potentialActions = [
          ...(actionByDateMap[shiftDate] || []),
          ...(actionByDateMap[nextDayStr] || []),
        ];

        const shiftActions = potentialActions.filter((act) => {
          if (!boundStart || !boundEnd) return false;

          const actionTime = new Date(act.dateOfAction || act.createdAt);
          const isWithinTime =
            actionTime >= boundStart && actionTime <= boundEnd;

          if (!isWithinTime) return false;

          if (isDoctor) {
            return act.userId === userId;
          } else {
            const su = act.serviceUnit;
            if (!su) return false;

            const matchAmarta =
              ["PURI AMARTA 1", "PURI AMARTA 2", "PURI AMARTA 3"].includes(
                su,
              ) && divisionName === "puri amarta";
            const matchCakra =
              su === "PURI CAKRA KEMBANG" &&
              divisionName === "puri cakra kembang";
            const matchKencana1 =
              su === "PURI KENCANA 1" && divisionName === "puri kencana 1";
            const matchKencana2 =
              su === "PURI KENCANA 2" && divisionName === "puri kencana 2";
            const matchIgdVk =
              ["IDG", "VK"].includes(su) ||
              (["IGD", "VK"].includes(su) && divisionName === "igd");
            const matchIcu = su === "ICU" && divisionName === "icu";
            const matchOk =
              su === "KAMAR OPERASI" && divisionName === "kamar operasi";
            const matchNicu =
              su === "NICU/PICU" && divisionName === "nicu-picu";
            const matchRad =
              ["RADIOLOGI", "RADIOLOGI KHUSUS MCU"].includes(su) &&
              divisionName === "radiologi";
            const matchLab =
              ["LABORATORIUM", "LABORATORIUM KHUSUS MCU"].includes(su) &&
              divisionName === "laboratorium";
            const matchDokpol = su === "DOKPOL" && divisionName === "dokpol";

            const poliList = [
              "MCU",
              "HEMODIALISA",
              "FISIOTERAPI",
              "PATOLOGI ANATOMI",
              "POLIKLINIK ANAK",
              "POLIKLINIK BEDAH",
              "POLIKLINIK BEDAH MULUT",
              "POLIKLINIK GIGI",
              "POLIKLINIK GIGI PERIODONTI",
              "POLIKLINIK JIWA",
              "POLIKLINIK KANDUNGAN",
              "POLIKLINIK PENYAKIT DALAM",
              "POLIKLINIK SARAF",
              "POLIKLINIK VCT",
            ];
            const matchPoli =
              poliList.includes(su) && divisionName === "poliklinik";
            const matchPsikolog =
              su === "POLIKLINIK PSIKOLOG" && divisionName === "pdp yanwat";

            const excDwiana =
              fullNameStr === "dwiana widiyanti" &&
              su === "POLIKLINIK PSIKOLOG";
            const excKonengsih =
              fullNameStr === "konengsih" && su === "FISIOTERAPI";

            return (
              matchAmarta ||
              matchCakra ||
              matchKencana1 ||
              matchKencana2 ||
              matchIgdVk ||
              matchIcu ||
              matchOk ||
              matchNicu ||
              matchRad ||
              matchLab ||
              matchDokpol ||
              matchPoli ||
              matchPsikolog ||
              excDwiana ||
              excKonengsih
            );
          }
        });

        let tindakanPertama = null;
        let namaTindakanPertama = null;
        let tindakanTerakhir = null;
        let namaTindakanTerakhir = null;
        let totalTindakanPerShift = shiftActions.length;

        const uniquePatients = new Set();
        const uniqueUnits = new Set();

        if (totalTindakanPerShift > 0) {
          const sortedActions = [...shiftActions].sort(
            (a, b) =>
              new Date(a.dateOfAction || a.createdAt) -
              new Date(b.dateOfAction || b.createdAt),
          );

          tindakanPertama =
            sortedActions[0].dateOfAction || sortedActions[0].createdAt;
          namaTindakanPertama = sortedActions[0].actionName || "-";

          tindakanTerakhir =
            sortedActions[sortedActions.length - 1].dateOfAction ||
            sortedActions[sortedActions.length - 1].createdAt;
          namaTindakanTerakhir =
            sortedActions[sortedActions.length - 1].actionName || "-";

          shiftActions.forEach((act) => {
            if (act.noRM) uniquePatients.add(act.noRM);
            if (act.serviceUnit) uniqueUnits.add(act.serviceUnit);
          });
        }

        let jamKehadiran = 0;
        if (attendance?.checkInTime && attendance?.checkOutTime) {
          const diffMs =
            new Date(attendance.checkOutTime) -
            new Date(attendance.checkInTime);
          jamKehadiran = parseFloat((diffMs / (1000 * 60 * 60)).toFixed(2));
        }

        let statusAudit = "Tidak Ada Aktivitas";
        if (totalTindakanPerShift > 0) {
          if (!attendance?.checkInTime) statusAudit = "Aktivitas Tanpa Checkin";
          else if (!attendance?.checkOutTime)
            statusAudit = "Aktivitas Tanpa Checkout";
          else statusAudit = "Normal";
        }

        const prefix = u.titlePrefix ? `${u.titlePrefix} ` : "";
        const suffix = u.titleSuffix ? `, ${u.titleSuffix}` : "";
        const namaTenagaMedis = u.fullName
          ? `${prefix}${u.fullName}${suffix}`
          : "-";

        return {
          id: shift.id,
          userId: userId,
          nama_tenaga_medis: namaTenagaMedis,
          nip: u.nip || "-",
          tanggal_presensi: shiftDate,
          position_name: u.position?.name || "-",
          department_name: departmentName,
          employmentType: u.employmentType || "-",
          shiftName: shift.workShift?.name || "Non Shift",
          shiftStart: shift.workShift?.startTime || "-",
          shiftEnd: shift.workShift?.endTime || "-",
          checkInTime: attendance?.checkInTime || null,
          checkOutTime: attendance?.checkOutTime || null,
          jam_masuk: attendance?.checkInTime
            ? moment(attendance.checkInTime).format("HH:mm:ss")
            : null,
          jam_pulang: attendance?.checkOutTime
            ? moment(attendance.checkOutTime).format("HH:mm:ss")
            : null,
          attendanceStatus: attendance?.attendanceStatus || "Tidak Hadir",
          tanggal_tindakan_pertama: tindakanPertama
            ? moment(tindakanPertama).format("YYYY-MM-DD HH:mm:ss")
            : null,
          nama_tindakan_pertama: namaTindakanPertama,
          tanggal_tindakan_terakhir: tindakanTerakhir
            ? moment(tindakanTerakhir).format("YYYY-MM-DD HH:mm:ss")
            : null,
          nama_tindakan_terakhir: namaTindakanTerakhir,
          total_tindakan: totalTindakanPerShift,
          total_pasien: uniquePatients.size,
          unit_pelayanan: Array.from(uniqueUnits).join(", ") || "-",
          jam_kehadiran: jamKehadiran,
          status_audit: statusAudit,
          hasAttendance: !!attendance,
          notes: attendance?.notes || "-",
        };
      })
      .filter((item) => item.total_tindakan > 0);

    const attendanceTimeline = rawTimeline.sort((a, b) => {
      const timeA = `${a.tanggal_presensi} ${a.shiftStart === "-" ? "00:00:00" : a.shiftStart}`;
      const timeB = `${b.tanggal_presensi} ${b.shiftStart === "-" ? "00:00:00" : b.shiftStart}`;
      return timeA.localeCompare(timeB); // Urutan Terlama ke Terbaru (Ascending)
    });

    // --- LOGIKA SUMMARY (BERDASARKAN TENAGA MEDIS UNIK) ---
    const userSummaryMap = {};
    // rawTimeline.forEach((item) => {
    attendanceTimeline.forEach((item) => {
      const uId = item.userId;
      if (!userSummaryMap[uId]) {
        userSummaryMap[uId] = {
          userId: uId,
          department_name: item.department_name,
          hasAnomaly: false,
        };
      }
      if (item.status_audit !== "Normal") {
        userSummaryMap[uId].hasAnomaly = true;
      }
    });

    const uniqueUsers = Object.values(userSummaryMap);
    const totalNormalData = uniqueUsers.filter((u) => !u.hasAnomaly);
    const totalAnomaliData = uniqueUsers.filter((u) => u.hasAnomaly);
    const totalUniqueUsers = uniqueUsers.length;

    const sumTindakan = allActions.length;

    const persentaseAnomali =
      totalUniqueUsers > 0
        ? ((totalAnomaliData.length / totalUniqueUsers) * 100).toFixed(2) + "%"
        : "0%";

    // --- LOGIKA STATISTIK UNIT ---
    const unitStats = {};
    uniqueUsers.forEach((user) => {
      const unit = user.department_name;
      if (!unitStats[unit]) {
        unitStats[unit] = { total: 0, normal: 0, anomali: 0 };
      }
      unitStats[unit].total++;
      if (user.hasAnomaly) {
        unitStats[unit].anomali++;
      } else {
        unitStats[unit].normal++;
      }
    });

    let unitAnomaliTerbanyak = { nama: "-", total_kasus: 0, persentase: "0%" };
    for (const [nama, stats] of Object.entries(unitStats)) {
      if (stats.anomali > unitAnomaliTerbanyak.total_kasus) {
        unitAnomaliTerbanyak = {
          nama,
          total_kasus: stats.anomali,
          persentase:
            totalAnomaliData.length > 0
              ? ((stats.anomali / totalAnomaliData.length) * 100).toFixed(2) +
                "%"
              : "0%",
        };
      }
    }

    const summary = {
      total_tindakan_medis: sumTindakan,
      total_tenaga_medis: totalUniqueUsers,
      tenaga_medis_normal: totalNormalData.length,
      tenaga_medis_anomali_terdeteksi: totalAnomaliData.length,
      persentase_anomali: persentaseAnomali,
      unit_anomali_terbanyak: unitAnomaliTerbanyak,
    };

    // const attendanceTimeline = rawTimeline;
    res.json({ summary, attendanceTimeline });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getMedicalActions = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const search = req.query.search_query || "";
    const sortKey = req.query.sort_key || "dateOfAction";
    const sortDirection = req.query.sort_direction || "DESC";
    const selectedUnit = req.query.unit || "Semua Divisi";

    const selectedMonth = req.query.month || "";

    let whereCondition = {};
    if (search) {
      whereCondition[Op.or] = [
        { doctorName: { [Op.like]: `%${search}%` } },
        { serviceUnit: { [Op.like]: `%${search}%` } },
      ];
    }

    if (selectedUnit !== "Semua Divisi" && selectedUnit !== "") {
      whereCondition.serviceUnit = selectedUnit;
    }

    if (selectedMonth) {
      const [year, month] = selectedMonth.split("-");
      const startDate = new Date(year, parseInt(month) - 1, 1);
      const endDate = new Date(year, parseInt(month), 0, 23, 59, 59, 999);
      whereCondition.dateOfAction = {
        [Op.between]: [startDate, endDate],
      };
    }

    const { count: totalRows, rows: medicalActionRows } =
      await ActionData.findAndCountAll({
        where: whereCondition,
        offset,
        limit,
        order: [[sortKey, sortDirection.toUpperCase()]],
      });

    res.json({
      medicalActionTimeline: medicalActionRows,
      totalRows,
      totalPages: Math.ceil(totalRows / limit),
      currentPage: page,
      limit,
    });
  } catch (error) {
    console.error("Gagal menampilkan data tindakan medis:", error);
    res.status(500).json({ message: error.message });
  }
};

// Mengambil jumlah data tindakan berdasarkan bulan
export const getMedicalActionsMonthCount = async (req, res) => {
  try {
    const { month } = req.query;

    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
      return res.status(400).json({
        message: "Format bulan harus YYYY-MM",
      });
    }

    const startDate = moment
      .tz(`${month}-01`, "YYYY-MM-DD", "Asia/Jakarta")
      .startOf("month");

    const endDate = startDate.clone().add(1, "month");

    const totalRows = await ActionData.count({
      where: {
        dateOfAction: {
          [Op.gte]: startDate.format("YYYY-MM-DD HH:mm:ss"),
          [Op.lt]: endDate.format("YYYY-MM-DD HH:mm:ss"),
        },
      },
    });

    return res.status(200).json({
      month,
      totalRows,
    });
  } catch (error) {
    console.error("Gagal menghitung data tindakan berdasarkan bulan:", error);

    return res.status(500).json({
      message: "Gagal menghitung data tindakan",
      error: error.message,
    });
  }
};

// Menghapus data tindakan berdasarkan bulan
export const deleteMedicalActionsByMonth = async (req, res) => {
  try {
    const { month } = req.query;

    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
      return res.status(400).json({
        message: "Format bulan harus YYYY-MM",
      });
    }

    const startDate = moment
      .tz(`${month}-01`, "YYYY-MM-DD", "Asia/Jakarta")
      .startOf("month");

    const endDate = startDate.clone().add(1, "month");

    const deletedCount = await ActionData.destroy({
      where: {
        dateOfAction: {
          [Op.gte]: startDate.format("YYYY-MM-DD HH:mm:ss"),
          [Op.lt]: endDate.format("YYYY-MM-DD HH:mm:ss"),
        },
      },
    });

    return res.status(200).json({
      message: `Berhasil menghapus data tindakan bulan ${month}`,
      deletedCount,
    });
  } catch (error) {
    console.error("Gagal menghapus data tindakan per bulan:", error);

    return res.status(500).json({
      message: "Gagal menghapus data tindakan",
      error: error.message,
    });
  }
};
