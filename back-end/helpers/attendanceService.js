// // BELUM DIPAKE
// import dayjs from "dayjs";
// import timezone from "dayjs/plugin/timezone.js";
// import utc from "dayjs/plugin/utc.js";

// dayjs.extend(utc);
// dayjs.extend(timezone);

// export const AttendanceService = {
//   // Menentukan tanggal kerja (menangani shift malam)
//   calculateWorkingDate: (
//     now,
//     userShiftYesterday,
//     existingPendingAttendance
//   ) => {
//     // 1. Jika ada presensi yang belum checkout dari kemarin, itu prioritas utama
//     if (existingPendingAttendance) {
//       return {
//         workingDate: existingPendingAttendance.date,
//         isYesterdayShift: true,
//       };
//     }

//     // 2. Jika tidak ada presensi gantung, cek apakah sekarang masuk jendela waktu shift malam
//     if (userShiftYesterday) {
//       const [sh] = userShiftYesterday.startTime.split(":").map(Number);
//       const [eh] = userShiftYesterday.endTime.split(":").map(Number);

//       // Logika: Jika shift mulai sore/malam (>=15) atau lintas hari (eh < sh)
//       // dan sekarang masih di bawah jam 9 pagi (batas toleransi transisi hari)
//       if ((eh < sh || sh >= 15) && now.hour() < 9) {
//         return {
//           workingDate: dayjs(now).subtract(1, "day").format("YYYY-MM-DD"),
//           isYesterdayShift: true,
//         };
//       }
//     }

//     return {
//       workingDate: now.format("YYYY-MM-DD"),
//       isYesterdayShift: false,
//     };
//   },

//   // Menentukan status kehadiran
//   determineStatus: (now, shiftStart) => {
//     const toleranceBound = shiftStart.add(15, "minute");
//     return now.isAfter(toleranceBound) ? "Terlambat" : "Hadir";
//   },
// };

// // DI CONTROLLER
// import { AttendanceService } from "../helpers/attendanceService.js";
// import db from "../config/Database.js";

// export const createAttendance2 = async (req, res) => {
//   const transaction = await db.transaction();

//   try {
//     const userId = req.user?.id || req.body.userId;
//     if (!userId) return res.status(401).json({ message: "Unauthorized" });

//     const { qrToken, checkInLocation, checkOutLocation, evidencePhoto } =
//       req.body;
//     const now = dayjs().tz("Asia/Jakarta");

//     // --- 1. VALIDASI QR & USER ---
//     const qr = await QrCodeToken.findOne({
//       where: { token: qrToken, isUsed: false },
//     });
//     if (!qr || dayjs().isAfter(dayjs(qr.expiresAt))) {
//       return res
//         .status(400)
//         .json({ message: "QR Code tidak valid atau kadaluarsa!" });
//     }

//     const user = await Users.findByPk(userId, {
//       include: [{ model: WorkShift, as: "workShift" }],
//     });

//     // --- 2. PENENTUAN WORKING DATE (LOGIKA INTI) ---
//     const yesterdayDate = now.subtract(1, "day").format("YYYY-MM-DD");
//     const [pendingAttendance, shiftYesterday] = await Promise.all([
//       Attendances.findOne({
//         where: { userId, date: yesterdayDate, checkOut: null },
//       }),
//       ShiftAssignment.findOne({
//         where: { userId, date: yesterdayDate },
//         include: [{ model: WorkShift, as: "workShift" }],
//       }),
//     ]);

//     const { workingDate } = AttendanceService.calculateWorkingDate(
//       now,
//       shiftYesterday?.workShift,
//       pendingAttendance
//     );

//     // --- 3. AMBIL JADWAL SHIFT BERDASARKAN WORKING DATE ---
//     const currentShiftAssignment = await ShiftAssignment.findOne({
//       where: { userId, date: workingDate },
//       include: [{ model: WorkShift, as: "workShift" }],
//     });

//     if (!currentShiftAssignment) {
//       return res.status(404).json({
//         message: `Jadwal tidak ditemukan untuk tanggal ${workingDate}`,
//       });
//     }

//     const shift = currentShiftAssignment.workShift;
//     let shiftStart = dayjs.tz(
//       `${workingDate} ${shift.startTime}`,
//       "Asia/Jakarta"
//     );
//     let shiftEnd = dayjs.tz(`${workingDate} ${shift.endTime}`, "Asia/Jakarta");
//     if (shiftEnd.isBefore(shiftStart)) shiftEnd = shiftEnd.add(1, "day");

//     // --- 4. LOGIKA CHECK-IN / CHECK-OUT ---
//     let attend = await Attendances.findOne({
//       where: { userId, date: workingDate },
//     });

//     // CASE: CHECK-OUT
//     if (attend && !attend.checkOut) {
//       if (now.isBefore(shiftEnd)) {
//         return res
//           .status(400)
//           .json({ message: "Belum waktunya presensi pulang!" });
//       }

//       await attend.update(
//         {
//           checkOut: now.format("HH:mm:ss"),
//           checkOutLocation: checkOutLocation || checkInLocation,
//         },
//         { transaction }
//       );
//     }
//     // CASE: CHECK-IN
//     else if (!attend) {
//       if (now.isAfter(shiftEnd)) {
//         return res.status(400).json({
//           message: "Sesi kerja sudah berakhir. Anda dianggap Tidak Hadir.",
//         });
//       }

//       const status = AttendanceService.determineStatus(now, shiftStart);
//       attend = await Attendances.create(
//         {
//           userId,
//           date: workingDate,
//           checkInTime: now.format("HH:mm:ss"),
//           checkInLocation,
//           attendanceStatus: status,
//           evidencePhoto,
//         },
//         { transaction }
//       );
//     } else {
//       return res
//         .status(400)
//         .json({ message: "Anda sudah menyelesaikan presensi hari ini." });
//     }

//     // --- 5. FINALISASI ---
//     qr.isUsed = true;
//     await qr.save({ transaction });
//     await transaction.commit();

//     return res
//       .status(200)
//       .json({ message: "Presensi berhasil diproses", data: attend });
//   } catch (error) {
//     await transaction.rollback();
//     console.error("ERR_ATTENDANCE:", error);
//     return res
//       .status(500)
//       .json({ message: "Server Error", error: error.message });
//   }
// };
