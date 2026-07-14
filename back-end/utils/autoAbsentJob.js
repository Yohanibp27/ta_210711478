// Setiap 10 menit, sistem otomatis memeriksa semua user yang belum melakukan presensi menandainya sebagai “Tidak Hadir” dan tidak melakukan presensi pulang setelah 14 jam berakhirnya jam kerja menandainya sebagai "Tidak Valid" presesinya
import cron from "node-cron";
import Attendances from "../models/AttendanceModel.js";
import Users from "../models/UserModel.js";
import WorkShift from "../models/WorkShiftModel.js";
import ShiftAssignment from "../models/ShiftAssignmentModel.js";
import UserActivity from "../models/UserActivityModel.js";
// import LeaveRequest from "../models/LeaveRequestModel.js";
import { isUserOnLeave } from "../helpers/isUserOnLeave.js";
import CalendarDay from "../models/CalendarModel.js";
import { Op } from "sequelize";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc.js";
import timezone from "dayjs/plugin/timezone.js";
import customParseFormat from "dayjs/plugin/customParseFormat.js";

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(customParseFormat);

// 14 juli 2026
const TIMEZONE = "Asia/Jakarta";
let isAutoAbsentRunning = false;

/**
 * MySQL TIME biasanya menghasilkan:
 * 07:00:00
 *
 * Namun data lama mungkin hanya:
 * 07:00
 */
const normalizeTime = (value) => {
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

/**
 * Membentuk jadwal shift langsung dalam zona waktu WIB.
 * Jangan membuat waktu dahulu lalu menjalankan .tz(),
 * karena pada server UTC waktunya dapat bergeser tujuh jam.
 */
const buildShiftWindow = (checkDate, workShift) => {
  const startTime = normalizeTime(workShift?.startTime);
  const endTime = normalizeTime(workShift?.endTime);

  if (!startTime || !endTime) {
    return null;
  }

  const shiftStart = dayjs.tz(
    `${checkDate} ${startTime}`,
    "YYYY-MM-DD HH:mm:ss",
    TIMEZONE,
  );

  let shiftEnd = dayjs.tz(
    `${checkDate} ${endTime}`,
    "YYYY-MM-DD HH:mm:ss",
    TIMEZONE,
  );

  if (!shiftStart.isValid() || !shiftEnd.isValid()) {
    return null;
  }

  // Shift malam, misalnya 23:00 sampai 07:00.
  if (!shiftEnd.isAfter(shiftStart)) {
    shiftEnd = shiftEnd.add(1, "day");
  }

  return {
    shiftStart,
    shiftEnd,
    checkoutDeadline: shiftEnd.add(14, "hour"),
  };
};

/**
 * Mengambil jadwal kerja karyawan.
 *
 * Prioritas karyawan shift:
 * 1. shiftAssignmentId yang tersimpan pada presensi
 * 2. ShiftAssignment berdasarkan pengguna dan tanggal
 * 3. workShiftId yang tersimpan pada presensi
 */
const resolveWorkShift = async (user, checkDate, attendanceRecord) => {
  let workShift = null;
  let shiftAssignmentId = attendanceRecord?.shiftAssignmentId || null;
  let hasShiftAssignment = false;

  if (user.employmentType === "Shift") {
    let shiftAssignment = null;

    if (attendanceRecord?.shiftAssignmentId) {
      shiftAssignment = await ShiftAssignment.findByPk(
        attendanceRecord.shiftAssignmentId,
        {
          include: [
            {
              model: WorkShift,
              as: "workShift",
            },
          ],
        },
      );
    }

    if (!shiftAssignment) {
      shiftAssignment = await ShiftAssignment.findOne({
        where: {
          userId: user.id,
          date: checkDate,
        },
        include: [
          {
            model: WorkShift,
            as: "workShift",
          },
        ],
      });
    }

    if (shiftAssignment) {
      hasShiftAssignment = true;
      shiftAssignmentId = shiftAssignment.id;
      workShift = shiftAssignment.workShift;
    }

    /*
     * Jangan langsung continue ketika ShiftAssignment tidak ditemukan.
     * Presensi mungkin sudah menyimpan workShiftId.
     */
    if (!workShift && attendanceRecord?.workShiftId) {
      workShift = await WorkShift.findByPk(attendanceRecord.workShiftId);
    }

    /*
     * Jangan fallback ke user.workShift untuk pegawai Shift.
     * Tanpa ShiftAssignment pada tanggal tersebut, pegawai dianggap
     * tidak memiliki jadwal kerja pada hari itu.
     */
    // if (!workShift && user.workShift) {
    //   workShift = user.workShift;
    // }
  } else {
    workShift = user.workShift;

    if (!workShift && attendanceRecord?.workShiftId) {
      workShift = await WorkShift.findByPk(attendanceRecord.workShiftId);
    }
  }

  return {
    workShift,
    shiftAssignmentId,
    hasShiftAssignment,
  };
};

const createActivityIfMissing = async ({
  userId,
  referenceId,
  action,
  title,
  description,
}) => {
  const existingActivity = await UserActivity.findOne({
    where: {
      userId,
      referenceId,
      category: "attendance",
      action,
    },
  });

  if (existingActivity) return;

  await UserActivity.create({
    userId,
    category: "attendance",
    action,
    referenceId,
    title,
    description,
    isRead: false,
  });
};

const processUserAttendance = async (user, checkDate, now) => {
  let isDinasLuar = false;

  const onLeave = await isUserOnLeave(user.id, checkDate);
  const leaveTypeName = onLeave?.leavetype?.name?.toUpperCase() || null;

  if (leaveTypeName === "DINAS LUAR") {
    isDinasLuar = true;

    console.log(
      `📍 User ${user.id} sedang DINAS LUAR pada ${checkDate}, menunggu presensi melalui mobile.`,
    );
  }

  /*
   * Pemeriksaan hari libur dilakukan setelah mengetahui apakah pengguna
   * sedang dinas luar. Dinas luar tetap dapat diproses jika memiliki jadwal.
   */
  if (user.employmentType !== "Shift" && !isDinasLuar) {
    const dayOfWeek = dayjs(checkDate).day();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    const holiday = await CalendarDay.findOne({
      where: {
        date: checkDate,
        isHoliday: true,
      },
    });

    const isNationalHoliday =
      Boolean(holiday?.isHoliday) &&
      ["Semua", "Non-Medis"].includes(holiday?.appliesTo);

    if (isWeekend || isNationalHoliday) {
      console.log(
        `📅 User ${user.id} non-shift libur pada ${checkDate}, pemeriksaan dilewati.`,
      );

      return;
    }
  }

  /*
   * Cuti dan izin tidak memerlukan presensi masuk maupun pulang.
   * Dinas luar tetap dilanjutkan karena wajib presensi mobile.
   */
  if (onLeave && !isDinasLuar) {
    const existingAttendance = await Attendances.findOne({
      where: {
        userId: user.id,
        date: checkDate,
      },
    });

    if (!existingAttendance) {
      let attendanceStatus = "Hadir";

      if (leaveTypeName === "CUTI") {
        attendanceStatus = "Cuti";
      } else if (leaveTypeName === "IZIN") {
        attendanceStatus = "Izin";
      }

      const newAttendance = await Attendances.create({
        userId: user.id,
        date: checkDate,
        attendanceStatus,
        attendanceType: "OUTSIDE",
        notes: `Otomatis: ${leaveTypeName}`,
        source: "System",
        leaveRequestId: onLeave.id,
      });

      await createActivityIfMissing({
        userId: user.id,
        referenceId: newAttendance.id,
        action: "submitted",
        title: `Presensi ${attendanceStatus}`,
        description: `Presensi ${attendanceStatus} otomatis dibuat berdasarkan pengajuan yang telah disetujui`,
      });

      console.log(
        `✅ Presensi ${attendanceStatus} dibuat otomatis untuk user ${user.id}.`,
      );
    }

    return;
  }

  /*
   * Ambil presensi terlebih dahulu.
   * Hal ini penting agar workShiftId yang tersimpan di presensi
   * masih dapat dipakai ketika ShiftAssignment tidak ditemukan.
   */
  const attendanceRecord = await Attendances.findOne({
    where: {
      userId: user.id,
      date: checkDate,
    },
  });

  const { workShift, shiftAssignmentId, hasShiftAssignment } =
    await resolveWorkShift(user, checkDate, attendanceRecord);

  if (
    user.employmentType === "Shift" &&
    !attendanceRecord &&
    !hasShiftAssignment
  ) {
    console.log(
      `📅 User ${user.id} tidak memiliki jadwal shift pada ${checkDate}, skip auto absent.`,
    );

    return;
  }

  if (!workShift) {
    console.warn(
      `⚠️ Jadwal kerja user ${user.id} pada ${checkDate} tidak ditemukan.`,
    );

    return;
  }

  const shiftWindow = buildShiftWindow(checkDate, workShift);

  if (!shiftWindow) {
    console.warn(
      `⚠️ Format jam shift user ${user.id} tidak valid. ` +
        `startTime=${workShift.startTime}, endTime=${workShift.endTime}`,
    );

    return;
  }

  const { shiftEnd, checkoutDeadline } = shiftWindow;

  const shiftHasEnded = now.isAfter(shiftEnd) || now.isSame(shiftEnd);

  const checkoutDeadlinePassed =
    now.isAfter(checkoutDeadline) || now.isSame(checkoutDeadline);

  /*
   * Tidak melakukan presensi masuk sampai shift berakhir.
   */
  if (!attendanceRecord && shiftHasEnded) {
    const systemNote = isDinasLuar
      ? "Sistem: Memiliki jadwal Dinas Luar tetapi tidak melakukan presensi masuk hingga jam kerja berakhir"
      : "Sistem: Tidak melakukan presensi masuk hingga jam kerja berakhir";

    const [newAttendance, created] = await Attendances.findOrCreate({
      where: {
        userId: user.id,
        date: checkDate,
      },
      defaults: {
        userId: user.id,
        date: checkDate,
        attendanceType: isDinasLuar ? "OUTSIDE" : "INSIDE",
        attendanceStatus: "Tidak Hadir",
        notes: systemNote,
        source: "System",
        shiftAssignmentId,
        workShiftId: workShift.id,
        leaveRequestId: onLeave?.id || null,
      },
    });

    if (created) {
      await createActivityIfMissing({
        userId: user.id,
        referenceId: newAttendance.id,
        action: "missed",
        title: "Presensi Tidak Hadir",
        description: `Anda tidak melakukan presensi masuk dan pulang pada tanggal ${checkDate}`,
      });

      console.log(
        `🚫 User ${user.id} tanggal ${checkDate} ditandai Tidak Hadir.`,
      );
    }

    return;
  }

  /*
   * Memiliki presensi masuk, tetapi tidak memiliki presensi pulang.
   *
   * Berlaku untuk:
   * - INSIDE
   * - OUTSIDE / Dinas Luar
   * - karyawan biasa
   * - tenaga medis
   * - shift
   * - non-shift
   */
  if (
    attendanceRecord &&
    attendanceRecord.checkInTime &&
    !attendanceRecord.checkOutTime &&
    attendanceRecord.attendanceStatus !== "Tidak Valid"
  ) {
    console.log(
      `🔍 Pemeriksaan checkout user ${user.id}: ` +
        `tanggal=${checkDate}, ` +
        `deadline=${checkoutDeadline.format("YYYY-MM-DD HH:mm:ss")}, ` +
        `sekarang=${now.format("YYYY-MM-DD HH:mm:ss")}`,
    );

    if (checkoutDeadlinePassed) {
      const systemNote =
        "Sistem: Tidak melakukan presensi pulang hingga 14 jam setelah jam kerja berakhir";

      const currentNotes = attendanceRecord.notes?.trim() || "";

      const updatedNotes = currentNotes.includes(systemNote)
        ? currentNotes
        : currentNotes
          ? `${currentNotes}\n${systemNote}`
          : systemNote;

      /*
       * Update dibuat atomik agar cron berikutnya tidak membuat aktivitas
       * Tidak Valid berulang kali.
       */
      const [updatedCount] = await Attendances.update(
        {
          attendanceStatus: "Tidak Valid",
          notes: updatedNotes,
          updatedAt: new Date(),
        },
        {
          where: {
            id: attendanceRecord.id,
            checkInTime: {
              [Op.not]: null,
            },
            checkOutTime: null,
            attendanceStatus: {
              [Op.ne]: "Tidak Valid",
            },
          },
        },
      );

      if (updatedCount > 0) {
        await createActivityIfMissing({
          userId: user.id,
          referenceId: attendanceRecord.id,
          action: "invalid",
          title: "Presensi Tidak Valid",
          description: `Presensi Anda pada tanggal ${checkDate} dianggap tidak valid karena tidak melakukan presensi pulang`,
        });

        console.log(
          `⚠️ User ${user.id} tanggal ${checkDate} otomatis ditandai Tidak Valid karena tidak melakukan check-out.`,
        );
      }
    }
  }
};

export const autoAbsentJob = () => {
  cron.schedule(
    "*/10 * * * *",
    async () => {
      /*
       * Mencegah cron baru berjalan jika proses sebelumnya belum selesai.
       */
      if (isAutoAbsentRunning) {
        console.log(
          "⏳ Auto-check presensi sebelumnya masih berjalan, eksekusi baru dilewati.",
        );

        return;
      }

      isAutoAbsentRunning = true;

      const now = dayjs().tz(TIMEZONE);
      const today = now.format("YYYY-MM-DD");
      const yesterday = now.subtract(1, "day").format("YYYY-MM-DD");

      console.log(
        `⏰ Menjalankan auto-check presensi pada ${now.format(
          "YYYY-MM-DD HH:mm:ss",
        )} WIB...`,
      );

      try {
        const users = await Users.findAll({
          where: {
            status: "Aktif",
          },
          include: [
            {
              model: WorkShift,
              as: "workShift",
            },
          ],
        });

        const datesToCheck = [yesterday, today];

        /*
         * Batasi proses paralel per 20 pengguna agar tidak membebani
         * memori dan koneksi database Railway.
         */
        const batchSize = 20;

        for (let index = 0; index < users.length; index += batchSize) {
          const userBatch = users.slice(index, index + batchSize);

          await Promise.all(
            userBatch.map(async (user) => {
              try {
                for (const checkDate of datesToCheck) {
                  await processUserAttendance(user, checkDate, now);
                }
              } catch (error) {
                console.error(
                  `❌ Gagal memproses user ${user.id}: ${error.message}`,
                );
              }
            }),
          );
        }

        console.log("✅ Auto-check presensi selesai.");
      } catch (error) {
        console.error(
          "❌ Gagal menjalankan auto-check presensi:",
          error.message,
        );
      } finally {
        isAutoAbsentRunning = false;
      }
    },
    {
      timezone: TIMEZONE,
    },
  );
};

// 19 januari 2026 => 17 feb 2026
// export const autoAbsentJob = () => {
//   cron.schedule("*/10 * * * *", async () => {
//     console.log("⏰ Menjalankan auto-check presensi...");
//     const now = dayjs().tz("Asia/Jakarta");
//     const today = now.format("YYYY-MM-DD");
//     const yesterday = now.subtract(1, "day").format("YYYY-MM-DD");

//     try {
//       const users = await Users.findAll({
//         where: { status: "Aktif" },
//         include: [{ model: WorkShift, as: "workShift" }],
//       });

//       await Promise.all(
//         users.map(async (user) => {
//           try {
//             const datesToCheck = [yesterday, today];

//             // for (const checkDate of datesToCheck) {
//             //   let isDinasLuar = false;
//             //   // let leaveRequestId = null;

//             //   // 1. CEK LIBUR NASIONAL/RS
//             //   const holiday = await CalendarDay.findOne({
//             //     where: { date: checkDate, isHoliday: true },
//             //   });

//             //   // cek apakah hari ini valid libur untuk user non-shift
//             //   const isValidHoliday =
//             //     holiday && (holiday.isHoliday === true || !holiday.holidayType);

//             //   // Jika user NON-SHIFT dan hari ini libur untuk mereka -> SKIP
//             //   if (
//             //     user.employmentType !== "Shift" &&
//             //     isValidHoliday &&
//             //     ["Semua", "Non-Medis"].includes(holiday.appliesTo)
//             //   ) {
//             //     console.log(
//             //       `User ${user.id} libur (${holiday.description}), skip auto absent`,
//             //     );
//             //     continue;
//             //   }

//             //   // 2. CEK STATUS LEAVE
//             //   const onLeave = await isUserOnLeave(user.id, checkDate);
//             //   if (onLeave) {
//             //     const leaveTypeName = onLeave.leavetype?.name?.toUpperCase();
//             //     // if (leaveTypeName === "DINAS LUAR") continue;
//             //     // console.log(
//             //     //   `User ${user.id} sedang DINAS LUAR, menunggu presensi manual via Mobile`,
//             //     // );

//             //     // const existingAttendance = await Attendances.findOne({
//             //     //   where: { userId: user.id, date: checkDate }, // userId: user.id, date: today
//             //     // });

//             //     // if (!existingAttendance) {
//             //     //   let statusPresensi = "Hadir";
//             //     //   if (leaveTypeName === "CUTI") statusPresensi = "Cuti";
//             //     //   else if (leaveTypeName === "IZIN") statusPresensi = "Izin";

//             //     //   const newAtt = await Attendances.create({
//             //     //     userId: user.id,
//             //     //     date: checkDate,
//             //     //     attendanceStatus: statusPresensi,
//             //     //     attendanceType: "OUTSIDE",
//             //     //     notes: `Otomatis: ${leaveTypeName}`,
//             //     //     source: "System",
//             //     //     leaveRequestId: onLeave.id,
//             //     //   });

//             //     //   await UserActivity.create({
//             //     //     userId: user.id,
//             //     //     category: "attendance",
//             //     //     action: "submitted",
//             //     //     referenceId: newAtt.id,
//             //     //     title: `Presensi ${statusPresensi}`,
//             //     //     description: `Presensi ${statusPresensi} otomatis dibuat berdasarkan pengajuan yang telah disetujui`,
//             //     //     isRead: false,
//             //     //   });

//             //     //   console.log(
//             //     //     `✅ Presensi ${statusPresensi} dibuat otomatis untuk user ${user.id}`,
//             //     //   );
//             //     // }
//             //     // continue;

//             //     // jangan di countinue agar log berjalan dan biarkan kode lolos ke bawah untuk pengecekan apakah jam kerja sudah berakhir atau belum
//             //     if (leaveTypeName === "DINAS LUAR") {
//             //       isDinasLuar = true;
//             //       console.log(
//             //         `User ${user.id} sedang DINAS LUAR pada ${checkDate}, menunggu presensi manual via Mobile`,
//             //       );
//             //     } else {
//             //       const existingAttendance = await Attendances.findOne({
//             //         where: { userId: user.id, date: checkDate }, // userId: user.id, date: today
//             //       });

//             //       if (!existingAttendance) {
//             //         let statusPresensi = "Hadir";
//             //         if (leaveTypeName === "CUTI") statusPresensi = "Cuti";
//             //         else if (leaveTypeName === "IZIN") statusPresensi = "Izin";

//             //         const newAtt = await Attendances.create({
//             //           userId: user.id,
//             //           date: checkDate,
//             //           attendanceStatus: statusPresensi,
//             //           attendanceType: "OUTSIDE",
//             //           notes: `Otomatis: ${leaveTypeName}`,
//             //           source: "System",
//             //           leaveRequestId: onLeave.id,
//             //         });

//             //         await UserActivity.create({
//             //           userId: user.id,
//             //           category: "attendance",
//             //           action: "submitted",
//             //           referenceId: newAtt.id,
//             //           title: `Presensi ${statusPresensi}`,
//             //           description: `Presensi ${statusPresensi} otomatis dibuat berdasarkan pengajuan yang telah disetujui`,
//             //           isRead: false,
//             //         });

//             //         console.log(
//             //           `✅ Presensi ${statusPresensi} dibuat otomatis untuk user ${user.id}`,
//             //         );
//             //       }

//             //       // Setelah memproses Cuti/Izin selesai, baru kita skip ke tanggal berikutnya
//             //       continue;
//             //     }
//             //   }

//             //   // 2. VALIDASI HARI LIBUR & SHIFT
//             //   const dayOfWeek = dayjs(checkDate).day();
//             //   if (
//             //     user.employmentType !== "Shift" &&
//             //     (dayOfWeek === 0 || dayOfWeek === 6)
//             //   ) {
//             //     console.log(
//             //       `📅 User ${user.id} non-shift libur, presensi dilewati`,
//             //     );
//             //     continue;
//             //   }

//             //   // 3. AMBIL SHIFT
//             //   let workShift = user.workShift;
//             //   let shiftAssignmentId = null;

//             //   if (user.employmentType === "Shift") {
//             //     const shiftAssignment = await ShiftAssignment.findOne({
//             //       where: { userId: user.id, date: checkDate },
//             //       include: [{ model: WorkShift, as: "workShift" }],
//             //     });

//             //     if (!shiftAssignment) continue;
//             //     workShift = shiftAssignment.workShift;
//             //     shiftAssignmentId = shiftAssignment.id;
//             //   }

//             //   if (!workShift) continue;

//             //   // 4. LOGIKA BOUNDRIES LINTAS HARI
//             //   let shiftStart = dayjs(
//             //     `${checkDate}T${workShift.startTime}:00`,
//             //   ).tz("Asia/Jakarta");
//             //   let shiftEnd = dayjs(`${checkDate}T${workShift.endTime}:00`).tz(
//             //     "Asia/Jakarta",
//             //   );

//             //   // Jika shift malam, end adalah besoknya dari checkDate
//             //   if (shiftEnd.isBefore(shiftStart)) {
//             //     shiftEnd = shiftEnd.add(1, "day");
//             //   }
//             //   // toleransi pulang maksimal 14 jam
//             //   const checkoutDeadline = shiftEnd.add(14, "hour");

//             //   const attendanceRecord = await Attendances.findOne({
//             //     where: { userId: user.id, date: checkDate },
//             //   });

//             //   // 5. EKSEKUSI TIDAK HADIR
//             //   // CASE A: Tidak Check-in sama sekali hingga jam kerja berakhir
//             //   if (!attendanceRecord && now.isAfter(shiftEnd)) {
//             //     const systemNoteMsg = isDinasLuar
//             //       ? "Sistem: Memiliki jadwal Dinas Luar tetapi tidak melakukan presensi masuk (lupa swafoto pertama) hingga jam kerja berakhir"
//             //       : "Sistem: Tidak melakukan presensi masuk (scan QR) hingga jam kerja berakhir";

//             //     const newAttNone = await Attendances.create({
//             //       userId: user.id,
//             //       date: checkDate,
//             //       //   attendanceType: "INSIDE",
//             //       //   attendanceType: onLeave ? "OUTSIDE" : "INSIDE", // Fleksibel jika dia Dinas Luar
//             //       attendanceType: isDinasLuar ? "OUTSIDE" : "INSIDE",
//             //       attendanceStatus: "Tidak Hadir",
//             //       //   notes:
//             //       //     "Sistem: Tidak melakukan presensi masuk hingga jam kerja berakhir",
//             //       //   notes: onLeave
//             //       //     ? "Sistem: Memiliki pengajuan Dinas Luar tetapi tidak melakukan presensi hingga jam kerja berakhir"
//             //       //     : "Sistem: Tidak melakukan presensi masuk hingga jam kerja berakhir",
//             //       notes: systemNoteMsg,
//             //       source: "System",
//             //       shiftAssignmentId: shiftAssignmentId,
//             //       workShiftId: workShift.id,
//             //       leaveRequestId: onLeave ? onLeave.id : null, // Simpan reference id jika ada
//             //     });

//             //     console.log(
//             //       `[DEBUG] Attendance created for User ${user.id}: ID ${newAttNone.id}`,
//             //     );

//             //     await UserActivity.create({
//             //       userId: user.id,
//             //       category: "attendance",
//             //       action: "missed",
//             //       referenceId: newAttNone.id,
//             //       title: "Presensi Tidak Hadir",
//             //       description: `Anda tidak melakukan presensi masuk dan pulang pada tanggal ${checkDate}`,
//             //       isRead: false,
//             //     });

//             //     console.log(
//             //       `🚫 User ${user.id} absen tanggal ${checkDate} dibuat (Tidak Hadir).`,
//             //     );
//             //   }
//             //   // CASE B: Lupa Check-out (Melewati batas 14 jam)
//             //   else if (
//             //     attendanceRecord &&
//             //     attendanceRecord.checkInTime &&
//             //     !attendanceRecord.checkOutTime &&
//             //     attendanceRecord.attendanceStatus !== "Tidak Valid"
//             //   ) {
//             //     // Logika update status jadi 'Tidak Valid' ketika jam kerja berakhir + toleransi
//             //     if (now.isAfter(checkoutDeadline)) {
//             //       await Attendances.update(
//             //         {
//             //           attendanceStatus: "Tidak Valid",
//             //           notes: "Sistem: Tidak melakukan presensi pulang",
//             //         },
//             //         { where: { id: attendanceRecord.id } }, // tadinya userId: user.id, date: checkDate
//             //       );

//             //       await UserActivity.create({
//             //         userId: user.id,
//             //         // type: "checkout_missed",
//             //         // description: `Anda tidak melakukan presensi pulang pada tanggal ${checkDate}`, // tadinya {today}
//             //         category: "attendance",
//             //         action: "invalid",
//             //         referenceId: attendanceRecord.id,
//             //         title: "Presensi Tidak Valid",
//             //         description: `Presensi Anda pada tanggal ${checkDate} dianggap tidak valid karena tidak melakukan check-out`,
//             //         isRead: false,
//             //       });
//             //       console.log(
//             //         `⚠️ User ${user.id} otomatis ditandai Tidak Hadir (check-out).`,
//             //       );
//             //     }
//             //   }
//             // }

//             // 14 jun 26
//             for (const checkDate of datesToCheck) {
//               let isDinasLuar = false;

//               // =========================================================================
//               // 1. VALIDASI HARI LIBUR & WEEKEND (KHUSUS NON-SHIFT)
//               // Blok ini diletakkan paling atas agar user non-shift tidak dibuatkan
//               // presensi cuti/izin pada hari Sabtu, Minggu, atau Tanggal Merah.
//               // =========================================================================
//               if (user.employmentType !== "Shift") {
//                 const dayOfWeek = dayjs(checkDate).day();
//                 const isWeekend = dayOfWeek === 0 || dayOfWeek === 6; // 0 = Minggu, 6 = Sabtu

//                 // Cek Libur Nasional/RS
//                 const holiday = await CalendarDay.findOne({
//                   where: { date: checkDate, isHoliday: true },
//                 });

//                 const isValidHoliday =
//                   holiday &&
//                   (holiday.isHoliday === true || !holiday.holidayType);
//                 const isNationalHoliday =
//                   isValidHoliday &&
//                   ["Semua", "Non-Medis"].includes(holiday.appliesTo);

//                 // Jika hari ini weekend ATAU libur nasional, langsung SKIP proses
//                 if (isWeekend || isNationalHoliday) {
//                   console.log(
//                     `📅 User ${user.id} non-shift libur (Weekend/Tanggal Merah), skip auto absent`,
//                   );
//                   continue;
//                 }
//               }

//               // =========================================================================
//               // 2. CEK STATUS LEAVE (CUTI / IZIN / DINAS LUAR)
//               // =========================================================================
//               const onLeave = await isUserOnLeave(user.id, checkDate);
//               if (onLeave) {
//                 const leaveTypeName = onLeave.leavetype?.name?.toUpperCase();

//                 if (leaveTypeName === "DINAS LUAR") {
//                   isDinasLuar = true;
//                   console.log(
//                     `User ${user.id} sedang DINAS LUAR pada ${checkDate}, menunggu presensi manual via Mobile`,
//                   );
//                 } else {
//                   // Eksekusi otomatis presensi untuk Cuti dan Izin
//                   const existingAttendance = await Attendances.findOne({
//                     where: { userId: user.id, date: checkDate },
//                   });

//                   if (!existingAttendance) {
//                     let statusPresensi = "Hadir";
//                     if (leaveTypeName === "CUTI") statusPresensi = "Cuti";
//                     else if (leaveTypeName === "IZIN") statusPresensi = "Izin";

//                     const newAtt = await Attendances.create({
//                       userId: user.id,
//                       date: checkDate,
//                       attendanceStatus: statusPresensi,
//                       attendanceType: "OUTSIDE",
//                       notes: `Otomatis: ${leaveTypeName}`,
//                       source: "System",
//                       leaveRequestId: onLeave.id,
//                     });

//                     await UserActivity.create({
//                       userId: user.id,
//                       category: "attendance",
//                       action: "submitted",
//                       referenceId: newAtt.id,
//                       title: `Presensi ${statusPresensi}`,
//                       description: `Presensi ${statusPresensi} otomatis dibuat berdasarkan pengajuan yang telah disetujui`,
//                       isRead: false,
//                     });

//                     console.log(
//                       `✅ Presensi ${statusPresensi} dibuat otomatis untuk user ${user.id}`,
//                     );
//                   }

//                   // Skip ke tanggal berikutnya karena Cuti/Izin tidak butuh check jam kerja berakhir
//                   continue;
//                 }
//               }

//               // =========================================================================
//               // 3. AMBIL SHIFT JADWAL (Untuk Hadir Normal / Dinas Luar)
//               // =========================================================================
//               let workShift = user.workShift;
//               let shiftAssignmentId = null;

//               if (user.employmentType === "Shift") {
//                 const shiftAssignment = await ShiftAssignment.findOne({
//                   where: { userId: user.id, date: checkDate },
//                   include: [{ model: WorkShift, as: "workShift" }],
//                 });

//                 if (!shiftAssignment) continue;
//                 workShift = shiftAssignment.workShift;
//                 shiftAssignmentId = shiftAssignment.id;
//               }

//               if (!workShift) continue;

//               // =========================================================================
//               // 4. LOGIKA BOUNDARIES LINTAS HARI & AUTO ABSENT
//               // =========================================================================
//               let shiftStart = dayjs(
//                 `${checkDate}T${workShift.startTime}:00`,
//               ).tz("Asia/Jakarta");
//               let shiftEnd = dayjs(`${checkDate}T${workShift.endTime}:00`).tz(
//                 "Asia/Jakarta",
//               );

//               // Jika shift malam, end adalah besoknya dari checkDate
//               if (shiftEnd.isBefore(shiftStart)) {
//                 shiftEnd = shiftEnd.add(1, "day");
//               }
//               // Toleransi pulang maksimal 14 jam
//               const checkoutDeadline = shiftEnd.add(14, "hour");

//               const attendanceRecord = await Attendances.findOne({
//                 where: { userId: user.id, date: checkDate },
//               });

//               // =========================================================================
//               // 5. EKSEKUSI TIDAK HADIR / TIDAK VALID
//               // =========================================================================
//               // CASE A: Tidak Check-in sama sekali hingga jam kerja berakhir
//               if (!attendanceRecord && now.isAfter(shiftEnd)) {
//                 const systemNoteMsg = isDinasLuar
//                   ? "Sistem: Memiliki jadwal Dinas Luar tetapi tidak melakukan presensi masuk (lupa swafoto pertama) hingga jam kerja berakhir"
//                   : "Sistem: Tidak melakukan presensi masuk (scan QR) hingga jam kerja berakhir";

//                 const newAttNone = await Attendances.create({
//                   userId: user.id,
//                   date: checkDate,
//                   attendanceType: isDinasLuar ? "OUTSIDE" : "INSIDE",
//                   attendanceStatus: "Tidak Hadir",
//                   notes: systemNoteMsg,
//                   source: "System",
//                   shiftAssignmentId: shiftAssignmentId,
//                   workShiftId: workShift.id,
//                   leaveRequestId: onLeave ? onLeave.id : null,
//                 });

//                 await UserActivity.create({
//                   userId: user.id,
//                   category: "attendance",
//                   action: "missed",
//                   referenceId: newAttNone.id,
//                   title: "Presensi Tidak Hadir",
//                   description: `Anda tidak melakukan presensi masuk dan pulang pada tanggal ${checkDate}`,
//                   isRead: false,
//                 });

//                 console.log(
//                   `🚫 User ${user.id} absen tanggal ${checkDate} dibuat (Tidak Hadir).`,
//                 );
//               }
//               // CASE B: Lupa Check-out (Melewati batas 14 jam)
//               else if (
//                 attendanceRecord &&
//                 attendanceRecord.checkInTime &&
//                 !attendanceRecord.checkOutTime &&
//                 attendanceRecord.attendanceStatus !== "Tidak Valid"
//               ) {
//                 if (now.isAfter(checkoutDeadline)) {
//                   await Attendances.update(
//                     {
//                       attendanceStatus: "Tidak Valid",
//                       notes: "Sistem: Tidak melakukan presensi pulang",
//                     },
//                     { where: { id: attendanceRecord.id } },
//                   );

//                   await UserActivity.create({
//                     userId: user.id,
//                     category: "attendance",
//                     action: "invalid",
//                     referenceId: attendanceRecord.id,
//                     title: "Presensi Tidak Valid",
//                     description: `Presensi Anda pada tanggal ${checkDate} dianggap tidak valid karena tidak melakukan check-out`,
//                     isRead: false,
//                   });
//                   console.log(
//                     `⚠️ User ${user.id} otomatis ditandai Tidak Valid (lupa check-out).`,
//                   );
//                 }
//               }
//             }
//           } catch (e) {
//             console.error(`❌ Gagal memproses user ${user.id}: ${e.message}`);
//           }
//         }),
//       );
//       console.log("✅ Auto-check presensi selesai.");
//     } catch (error) {
//       console.error("❌ Gagal menjalankan auto-check presensi:", error.message);
//     }
//   });
// };
