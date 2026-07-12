// Setiap 10 menit, sistem otomatis memeriksa semua user yang belum melakukan presensi menandainya sebagai “Tidak Hadir” dan tidak melakukan presensi pulang setelah 14 jam berakhirnya jam kerja menandainya sebagai "Tidak Valid" presesinya
import cron from "node-cron";
import Attendances from "../models/AttendanceModel.js";
import Users from "../models/UserModel.js";
import WorkShift from "../models/WorkShiftModel.js";
import ShiftAssignment from "../models/ShiftAssignmentModel.js";
import UserActivity from "../models/UserActivityModel.js";
import LeaveRequest from "../models/LeaveRequestModel.js";
import { isUserOnLeave } from "../helpers/isUserOnLeave.js";
import CalendarDay from "../models/CalendarModel.js";
import { Op } from "sequelize";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc.js";
import timezone from "dayjs/plugin/timezone.js";

dayjs.extend(utc);
dayjs.extend(timezone);

// 19 januari 2026 => 17 feb 2026
export const autoAbsentJob = () => {
  cron.schedule("*/10 * * * *", async () => {
    console.log("⏰ Menjalankan auto-check presensi...");
    const now = dayjs().tz("Asia/Jakarta");
    const today = now.format("YYYY-MM-DD");
    const yesterday = now.subtract(1, "day").format("YYYY-MM-DD");

    try {
      const users = await Users.findAll({
        where: { status: "Aktif" },
        include: [{ model: WorkShift, as: "workShift" }],
      });

      await Promise.all(
        users.map(async (user) => {
          try {
            const datesToCheck = [yesterday, today];

            // for (const checkDate of datesToCheck) {
            //   let isDinasLuar = false;
            //   // let leaveRequestId = null;

            //   // 1. CEK LIBUR NASIONAL/RS
            //   const holiday = await CalendarDay.findOne({
            //     where: { date: checkDate, isHoliday: true },
            //   });

            //   // cek apakah hari ini valid libur untuk user non-shift
            //   const isValidHoliday =
            //     holiday && (holiday.isHoliday === true || !holiday.holidayType);

            //   // Jika user NON-SHIFT dan hari ini libur untuk mereka -> SKIP
            //   if (
            //     user.employmentType !== "Shift" &&
            //     isValidHoliday &&
            //     ["Semua", "Non-Medis"].includes(holiday.appliesTo)
            //   ) {
            //     console.log(
            //       `User ${user.id} libur (${holiday.description}), skip auto absent`,
            //     );
            //     continue;
            //   }

            //   // 2. CEK STATUS LEAVE
            //   const onLeave = await isUserOnLeave(user.id, checkDate);
            //   if (onLeave) {
            //     const leaveTypeName = onLeave.leavetype?.name?.toUpperCase();
            //     // if (leaveTypeName === "DINAS LUAR") continue;
            //     // console.log(
            //     //   `User ${user.id} sedang DINAS LUAR, menunggu presensi manual via Mobile`,
            //     // );

            //     // const existingAttendance = await Attendances.findOne({
            //     //   where: { userId: user.id, date: checkDate }, // userId: user.id, date: today
            //     // });

            //     // if (!existingAttendance) {
            //     //   let statusPresensi = "Hadir";
            //     //   if (leaveTypeName === "CUTI") statusPresensi = "Cuti";
            //     //   else if (leaveTypeName === "IZIN") statusPresensi = "Izin";

            //     //   const newAtt = await Attendances.create({
            //     //     userId: user.id,
            //     //     date: checkDate,
            //     //     attendanceStatus: statusPresensi,
            //     //     attendanceType: "OUTSIDE",
            //     //     notes: `Otomatis: ${leaveTypeName}`,
            //     //     source: "System",
            //     //     leaveRequestId: onLeave.id,
            //     //   });

            //     //   await UserActivity.create({
            //     //     userId: user.id,
            //     //     category: "attendance",
            //     //     action: "submitted",
            //     //     referenceId: newAtt.id,
            //     //     title: `Presensi ${statusPresensi}`,
            //     //     description: `Presensi ${statusPresensi} otomatis dibuat berdasarkan pengajuan yang telah disetujui`,
            //     //     isRead: false,
            //     //   });

            //     //   console.log(
            //     //     `✅ Presensi ${statusPresensi} dibuat otomatis untuk user ${user.id}`,
            //     //   );
            //     // }
            //     // continue;

            //     // jangan di countinue agar log berjalan dan biarkan kode lolos ke bawah untuk pengecekan apakah jam kerja sudah berakhir atau belum
            //     if (leaveTypeName === "DINAS LUAR") {
            //       isDinasLuar = true;
            //       console.log(
            //         `User ${user.id} sedang DINAS LUAR pada ${checkDate}, menunggu presensi manual via Mobile`,
            //       );
            //     } else {
            //       const existingAttendance = await Attendances.findOne({
            //         where: { userId: user.id, date: checkDate }, // userId: user.id, date: today
            //       });

            //       if (!existingAttendance) {
            //         let statusPresensi = "Hadir";
            //         if (leaveTypeName === "CUTI") statusPresensi = "Cuti";
            //         else if (leaveTypeName === "IZIN") statusPresensi = "Izin";

            //         const newAtt = await Attendances.create({
            //           userId: user.id,
            //           date: checkDate,
            //           attendanceStatus: statusPresensi,
            //           attendanceType: "OUTSIDE",
            //           notes: `Otomatis: ${leaveTypeName}`,
            //           source: "System",
            //           leaveRequestId: onLeave.id,
            //         });

            //         await UserActivity.create({
            //           userId: user.id,
            //           category: "attendance",
            //           action: "submitted",
            //           referenceId: newAtt.id,
            //           title: `Presensi ${statusPresensi}`,
            //           description: `Presensi ${statusPresensi} otomatis dibuat berdasarkan pengajuan yang telah disetujui`,
            //           isRead: false,
            //         });

            //         console.log(
            //           `✅ Presensi ${statusPresensi} dibuat otomatis untuk user ${user.id}`,
            //         );
            //       }

            //       // Setelah memproses Cuti/Izin selesai, baru kita skip ke tanggal berikutnya
            //       continue;
            //     }
            //   }

            //   // 2. VALIDASI HARI LIBUR & SHIFT
            //   const dayOfWeek = dayjs(checkDate).day();
            //   if (
            //     user.employmentType !== "Shift" &&
            //     (dayOfWeek === 0 || dayOfWeek === 6)
            //   ) {
            //     console.log(
            //       `📅 User ${user.id} non-shift libur, presensi dilewati`,
            //     );
            //     continue;
            //   }

            //   // 3. AMBIL SHIFT
            //   let workShift = user.workShift;
            //   let shiftAssignmentId = null;

            //   if (user.employmentType === "Shift") {
            //     const shiftAssignment = await ShiftAssignment.findOne({
            //       where: { userId: user.id, date: checkDate },
            //       include: [{ model: WorkShift, as: "workShift" }],
            //     });

            //     if (!shiftAssignment) continue;
            //     workShift = shiftAssignment.workShift;
            //     shiftAssignmentId = shiftAssignment.id;
            //   }

            //   if (!workShift) continue;

            //   // 4. LOGIKA BOUNDRIES LINTAS HARI
            //   let shiftStart = dayjs(
            //     `${checkDate}T${workShift.startTime}:00`,
            //   ).tz("Asia/Jakarta");
            //   let shiftEnd = dayjs(`${checkDate}T${workShift.endTime}:00`).tz(
            //     "Asia/Jakarta",
            //   );

            //   // Jika shift malam, end adalah besoknya dari checkDate
            //   if (shiftEnd.isBefore(shiftStart)) {
            //     shiftEnd = shiftEnd.add(1, "day");
            //   }
            //   // toleransi pulang maksimal 14 jam
            //   const checkoutDeadline = shiftEnd.add(14, "hour");

            //   const attendanceRecord = await Attendances.findOne({
            //     where: { userId: user.id, date: checkDate },
            //   });

            //   // 5. EKSEKUSI TIDAK HADIR
            //   // CASE A: Tidak Check-in sama sekali hingga jam kerja berakhir
            //   if (!attendanceRecord && now.isAfter(shiftEnd)) {
            //     const systemNoteMsg = isDinasLuar
            //       ? "Sistem: Memiliki jadwal Dinas Luar tetapi tidak melakukan presensi masuk (lupa swafoto pertama) hingga jam kerja berakhir"
            //       : "Sistem: Tidak melakukan presensi masuk (scan QR) hingga jam kerja berakhir";

            //     const newAttNone = await Attendances.create({
            //       userId: user.id,
            //       date: checkDate,
            //       //   attendanceType: "INSIDE",
            //       //   attendanceType: onLeave ? "OUTSIDE" : "INSIDE", // Fleksibel jika dia Dinas Luar
            //       attendanceType: isDinasLuar ? "OUTSIDE" : "INSIDE",
            //       attendanceStatus: "Tidak Hadir",
            //       //   notes:
            //       //     "Sistem: Tidak melakukan presensi masuk hingga jam kerja berakhir",
            //       //   notes: onLeave
            //       //     ? "Sistem: Memiliki pengajuan Dinas Luar tetapi tidak melakukan presensi hingga jam kerja berakhir"
            //       //     : "Sistem: Tidak melakukan presensi masuk hingga jam kerja berakhir",
            //       notes: systemNoteMsg,
            //       source: "System",
            //       shiftAssignmentId: shiftAssignmentId,
            //       workShiftId: workShift.id,
            //       leaveRequestId: onLeave ? onLeave.id : null, // Simpan reference id jika ada
            //     });

            //     console.log(
            //       `[DEBUG] Attendance created for User ${user.id}: ID ${newAttNone.id}`,
            //     );

            //     await UserActivity.create({
            //       userId: user.id,
            //       category: "attendance",
            //       action: "missed",
            //       referenceId: newAttNone.id,
            //       title: "Presensi Tidak Hadir",
            //       description: `Anda tidak melakukan presensi masuk dan pulang pada tanggal ${checkDate}`,
            //       isRead: false,
            //     });

            //     console.log(
            //       `🚫 User ${user.id} absen tanggal ${checkDate} dibuat (Tidak Hadir).`,
            //     );
            //   }
            //   // CASE B: Lupa Check-out (Melewati batas 14 jam)
            //   else if (
            //     attendanceRecord &&
            //     attendanceRecord.checkInTime &&
            //     !attendanceRecord.checkOutTime &&
            //     attendanceRecord.attendanceStatus !== "Tidak Valid"
            //   ) {
            //     // Logika update status jadi 'Tidak Valid' ketika jam kerja berakhir + toleransi
            //     if (now.isAfter(checkoutDeadline)) {
            //       await Attendances.update(
            //         {
            //           attendanceStatus: "Tidak Valid",
            //           notes: "Sistem: Tidak melakukan presensi pulang",
            //         },
            //         { where: { id: attendanceRecord.id } }, // tadinya userId: user.id, date: checkDate
            //       );

            //       await UserActivity.create({
            //         userId: user.id,
            //         // type: "checkout_missed",
            //         // description: `Anda tidak melakukan presensi pulang pada tanggal ${checkDate}`, // tadinya {today}
            //         category: "attendance",
            //         action: "invalid",
            //         referenceId: attendanceRecord.id,
            //         title: "Presensi Tidak Valid",
            //         description: `Presensi Anda pada tanggal ${checkDate} dianggap tidak valid karena tidak melakukan check-out`,
            //         isRead: false,
            //       });
            //       console.log(
            //         `⚠️ User ${user.id} otomatis ditandai Tidak Hadir (check-out).`,
            //       );
            //     }
            //   }
            // }

            // 14 jun 26
            for (const checkDate of datesToCheck) {
              let isDinasLuar = false;

              // =========================================================================
              // 1. VALIDASI HARI LIBUR & WEEKEND (KHUSUS NON-SHIFT)
              // Blok ini diletakkan paling atas agar user non-shift tidak dibuatkan
              // presensi cuti/izin pada hari Sabtu, Minggu, atau Tanggal Merah.
              // =========================================================================
              if (user.employmentType !== "Shift") {
                const dayOfWeek = dayjs(checkDate).day();
                const isWeekend = dayOfWeek === 0 || dayOfWeek === 6; // 0 = Minggu, 6 = Sabtu

                // Cek Libur Nasional/RS
                const holiday = await CalendarDay.findOne({
                  where: { date: checkDate, isHoliday: true },
                });

                const isValidHoliday =
                  holiday &&
                  (holiday.isHoliday === true || !holiday.holidayType);
                const isNationalHoliday =
                  isValidHoliday &&
                  ["Semua", "Non-Medis"].includes(holiday.appliesTo);

                // Jika hari ini weekend ATAU libur nasional, langsung SKIP proses
                if (isWeekend || isNationalHoliday) {
                  console.log(
                    `📅 User ${user.id} non-shift libur (Weekend/Tanggal Merah), skip auto absent`,
                  );
                  continue;
                }
              }

              // =========================================================================
              // 2. CEK STATUS LEAVE (CUTI / IZIN / DINAS LUAR)
              // =========================================================================
              const onLeave = await isUserOnLeave(user.id, checkDate);
              if (onLeave) {
                const leaveTypeName = onLeave.leavetype?.name?.toUpperCase();

                if (leaveTypeName === "DINAS LUAR") {
                  isDinasLuar = true;
                  console.log(
                    `User ${user.id} sedang DINAS LUAR pada ${checkDate}, menunggu presensi manual via Mobile`,
                  );
                } else {
                  // Eksekusi otomatis presensi untuk Cuti dan Izin
                  const existingAttendance = await Attendances.findOne({
                    where: { userId: user.id, date: checkDate },
                  });

                  if (!existingAttendance) {
                    let statusPresensi = "Hadir";
                    if (leaveTypeName === "CUTI") statusPresensi = "Cuti";
                    else if (leaveTypeName === "IZIN") statusPresensi = "Izin";

                    const newAtt = await Attendances.create({
                      userId: user.id,
                      date: checkDate,
                      attendanceStatus: statusPresensi,
                      attendanceType: "OUTSIDE",
                      notes: `Otomatis: ${leaveTypeName}`,
                      source: "System",
                      leaveRequestId: onLeave.id,
                    });

                    await UserActivity.create({
                      userId: user.id,
                      category: "attendance",
                      action: "submitted",
                      referenceId: newAtt.id,
                      title: `Presensi ${statusPresensi}`,
                      description: `Presensi ${statusPresensi} otomatis dibuat berdasarkan pengajuan yang telah disetujui`,
                      isRead: false,
                    });

                    console.log(
                      `✅ Presensi ${statusPresensi} dibuat otomatis untuk user ${user.id}`,
                    );
                  }

                  // Skip ke tanggal berikutnya karena Cuti/Izin tidak butuh check jam kerja berakhir
                  continue;
                }
              }

              // =========================================================================
              // 3. AMBIL SHIFT JADWAL (Untuk Hadir Normal / Dinas Luar)
              // =========================================================================
              let workShift = user.workShift;
              let shiftAssignmentId = null;

              if (user.employmentType === "Shift") {
                const shiftAssignment = await ShiftAssignment.findOne({
                  where: { userId: user.id, date: checkDate },
                  include: [{ model: WorkShift, as: "workShift" }],
                });

                if (!shiftAssignment) continue;
                workShift = shiftAssignment.workShift;
                shiftAssignmentId = shiftAssignment.id;
              }

              if (!workShift) continue;

              // =========================================================================
              // 4. LOGIKA BOUNDARIES LINTAS HARI & AUTO ABSENT
              // =========================================================================
              let shiftStart = dayjs(
                `${checkDate}T${workShift.startTime}:00`,
              ).tz("Asia/Jakarta");
              let shiftEnd = dayjs(`${checkDate}T${workShift.endTime}:00`).tz(
                "Asia/Jakarta",
              );

              // Jika shift malam, end adalah besoknya dari checkDate
              if (shiftEnd.isBefore(shiftStart)) {
                shiftEnd = shiftEnd.add(1, "day");
              }
              // Toleransi pulang maksimal 14 jam
              const checkoutDeadline = shiftEnd.add(14, "hour");

              const attendanceRecord = await Attendances.findOne({
                where: { userId: user.id, date: checkDate },
              });

              // =========================================================================
              // 5. EKSEKUSI TIDAK HADIR / TIDAK VALID
              // =========================================================================
              // CASE A: Tidak Check-in sama sekali hingga jam kerja berakhir
              if (!attendanceRecord && now.isAfter(shiftEnd)) {
                const systemNoteMsg = isDinasLuar
                  ? "Sistem: Memiliki jadwal Dinas Luar tetapi tidak melakukan presensi masuk (lupa swafoto pertama) hingga jam kerja berakhir"
                  : "Sistem: Tidak melakukan presensi masuk (scan QR) hingga jam kerja berakhir";

                const newAttNone = await Attendances.create({
                  userId: user.id,
                  date: checkDate,
                  attendanceType: isDinasLuar ? "OUTSIDE" : "INSIDE",
                  attendanceStatus: "Tidak Hadir",
                  notes: systemNoteMsg,
                  source: "System",
                  shiftAssignmentId: shiftAssignmentId,
                  workShiftId: workShift.id,
                  leaveRequestId: onLeave ? onLeave.id : null,
                });

                await UserActivity.create({
                  userId: user.id,
                  category: "attendance",
                  action: "missed",
                  referenceId: newAttNone.id,
                  title: "Presensi Tidak Hadir",
                  description: `Anda tidak melakukan presensi masuk dan pulang pada tanggal ${checkDate}`,
                  isRead: false,
                });

                console.log(
                  `🚫 User ${user.id} absen tanggal ${checkDate} dibuat (Tidak Hadir).`,
                );
              }
              // CASE B: Lupa Check-out (Melewati batas 14 jam)
              else if (
                attendanceRecord &&
                attendanceRecord.checkInTime &&
                !attendanceRecord.checkOutTime &&
                attendanceRecord.attendanceStatus !== "Tidak Valid"
              ) {
                if (now.isAfter(checkoutDeadline)) {
                  await Attendances.update(
                    {
                      attendanceStatus: "Tidak Valid",
                      notes: "Sistem: Tidak melakukan presensi pulang",
                    },
                    { where: { id: attendanceRecord.id } },
                  );

                  await UserActivity.create({
                    userId: user.id,
                    category: "attendance",
                    action: "invalid",
                    referenceId: attendanceRecord.id,
                    title: "Presensi Tidak Valid",
                    description: `Presensi Anda pada tanggal ${checkDate} dianggap tidak valid karena tidak melakukan check-out`,
                    isRead: false,
                  });
                  console.log(
                    `⚠️ User ${user.id} otomatis ditandai Tidak Valid (lupa check-out).`,
                  );
                }
              }
            }
          } catch (e) {
            console.error(`❌ Gagal memproses user ${user.id}: ${e.message}`);
          }
        }),
      );
      console.log("✅ Auto-check presensi selesai.");
    } catch (error) {
      console.error("❌ Gagal menjalankan auto-check presensi:", error.message);
    }
  });
};
