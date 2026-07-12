// // utils/shiftUtils.js atau di dalam controller

// const dayjs = require("dayjs");
// const isBetween = require("dayjs/plugin/isBetween");
// const utc = require("dayjs/plugin/utc");
// const timezone = require("dayjs/plugin/timezone");

// dayjs.extend(isBetween);
// dayjs.extend(utc);
// dayjs.extend(timezone);

// /**
//  * Logika "Dosen Pembimbing":
//  * Cari shift yang paling RELEVAN untuk Check-In.
//  * Prioritaskan shift yang "Start Time"-nya dekat dengan "Now".
//  */
// const findRelevantShiftForCheckIn = (shiftAssignments, currentTime) => {
//   const now = dayjs(currentTime);

//   // Filter 1: Cari shift yang "Check-In Window"-nya masuk
//   // Asumsi: Boleh absen 1 jam sebelum mulai s/d 4 jam setelah mulai (untuk telat)
//   const validCheckInShifts = shiftAssignments.filter((assignment) => {
//     const shiftDate = assignment.date; // "2026-02-11"
//     const startTimeStr = assignment.workShift.startTime; // "07:00:00"

//     // Gabungkan tanggal assignment dengan jam shift
//     let shiftStart = dayjs.tz(`${shiftDate} ${startTimeStr}`, "Asia/Jakarta");

//     // Handle lintas hari jika perlu (tapi biasanya start time sesuai tanggal assignment)

//     const earlyBound = shiftStart.subtract(1, "hour"); // Boleh absen 06:00
//     const lateBound = shiftStart.add(4, "hour"); // Batas telat (misal sampai 11:00)

//     return now.isBetween(earlyBound, lateBound, null, "[]");
//   });

//   // Jika ada shift yang cocok untuk check-in, ambil yang paling dekat start-nya dengan now
//   if (validCheckInShifts.length > 0) {
//     return validCheckInShifts.sort((a, b) => {
//       // Sorting logic bisa ditambahkan jika perlu
//       return a.id - b.id;
//     })[0];
//   }

//   return null;
// };
