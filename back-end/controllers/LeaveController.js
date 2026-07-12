// import LeaveRequest from "../models/LeaveRequestModel.js";
// import UserLeaveQuota from "../models/UserLeaveQuotaModel.js";
// import LeaveType from "../models/LeaveTypeModel.js";
// import db from "../config/Database.js";

// // 1. GET: Mengambil Sisa Kuota Karyawan (Untuk ditampilkan di Front-End Flutter)
// export const getLeaveQuota = async (req, res) => {
//   try {
//     const userId = req.user.id; // middleware autentikasi JWT
//     const currentYear = new Date().getFullYear();

//     const quotas = await UserLeaveQuota.findAll({
//       where: { userId, year: currentYear },
//       include: [{ model: LeaveType, attributes: ["name"] }],
//     });

//     // Format data agar mudah dikonsumsi Flutter
//     const quotaData = quotas.map((q) => ({
//       leaveTypeId: q.leaveTypeId,
//       leaveTypeName: q.leavetype.name,
//       total: q.totalQuota,
//       used: q.usedQuota,
//       remaining: q.totalQuota - q.usedQuota,
//     }));

//     res.status(200).json(quotaData);
//   } catch (error) {
//     res.status(500).json({ msg: error.message });
//   }
// };

// 2. POST: Membuat Pengajuan Cuti (Dengan validasi & pemotongan kuota)
// export const createLeaveRequest = async (req, res) => {
//   // Gunakan Transaction agar jika proses insert gagal, pemotongan kuota dibatalkan
//   const transaction = await db.transaction();

//   try {
//     const userId = req.user.id;
//     const { leaveTypeId, leaveSubTypeId, startDate, endDate, note } = req.body;
//     const evidenceFile = req.file ? req.file.filename : null;

//     // A. Validasi Durasi di Backend (Jangan hanya percaya Front-End)
//     const start = new Date(startDate);
//     const end = new Date(endDate);
//     // Asumsi perhitungan durasi kalender biasa. Jika RS butuh hitungan hari kerja,
//     // perlu ditambah fungsi untuk skip hari Sabtu/Minggu.
//     const durasi = Math.floor((end - start) / (1000 * 60 * 60 * 24)) + 1;

//     if (durasi <= 0) {
//       await transaction.rollback();
//       return res.status(400).json({ msg: "Tanggal pengajuan tidak valid." });
//     }

//     // B. Pengecekan Sisa Kuota
//     const currentYear = start.getFullYear();
//     const userQuota = await UserLeaveQuota.findOne({
//       where: { userId, leaveTypeId, year: currentYear },
//       transaction, // Kunci row ini selama transaksi berlangsung
//     });

//     if (!userQuota) {
//       await transaction.rollback();
//       return res
//         .status(404)
//         .json({ msg: "Data kuota cuti belum diatur untuk tahun ini." });
//     }

//     const sisaKuota = userQuota.totalQuota - userQuota.usedQuota;

//     if (sisaKuota < durasi) {
//       await transaction.rollback();
//       return res
//         .status(400)
//         .json({ msg: `Gagal. Sisa kuota Anda hanya ${sisaKuota} hari.` });
//     }

//     // C. Buat Record Pengajuan (Soft Deduction)
//     const newRequest = await LeaveRequest.create(
//       {
//         userId,
//         leaveTypeId,
//         leaveSubTypeId,
//         startDate,
//         endDate,
//         note,
//         evidenceFile,
//         status: "pending_manager",
//       },
//       { transaction },
//     );

//     // D. Potong Kuota Sementara (Tambahkan usedQuota)
//     await userQuota.update(
//       {
//         usedQuota: userQuota.usedQuota + durasi,
//       },
//       { transaction },
//     );

//     // Selesaikan transaksi HTTP
//     await transaction.commit();
//     res
//       .status(201)
//       .json({
//         msg: "Pengajuan berhasil dikirim dan kuota telah disesuaikan.",
//         data: newRequest,
//       });
//   } catch (error) {
//     await transaction.rollback();
//     res
//       .status(500)
//       .json({ msg: "Terjadi kesalahan pada server", error: error.message });
//   }
// };

// // 3. PATCH/PUT: Verifikasi Manajer/SDM (Rollback Kuota Jika Ditolak)
// export const verifyLeaveRequest = async (req, res) => {
//   const transaction = await db.transaction();

//   try {
//     const { id } = req.params; // ID dari LeaveRequest
//     const { status } = req.body; // e.g., 'rejected_manager', 'approved_sdm'
//     const verifierId = req.user.id;

//     const leaveReq = await LeaveRequest.findByPk(id, { transaction });

//     if (!leaveReq) {
//       await transaction.rollback();
//       return res.status(404).json({ msg: "Data pengajuan tidak ditemukan." });
//     }

//     // Update status di tabel LeaveRequest
//     leaveReq.status = status;
//     if (status.includes("manager")) {
//       leaveReq.approvedByManagerId = verifierId;
//       leaveReq.approvedManagerAt = new Date();
//     } else if (status.includes("sdm")) {
//       leaveReq.approvedBySdmId = verifierId;
//       leaveReq.approvedSdmAt = new Date();
//       leaveReq.finalStatus =
//         status === "approved_sdm" ? "approved" : "rejected";
//     }

//     await leaveReq.save({ transaction });

//     // ROLLBACK LOGIC: Jika ditolak, kembalikan kuota yang tadi sempat dipotong
//     if (status === "rejected_manager" || status === "rejected_sdm") {
//       const start = new Date(leaveReq.startDate);
//       const end = new Date(leaveReq.endDate);
//       const durasi = Math.floor((end - start) / (1000 * 60 * 60 * 24)) + 1;

//       const userQuota = await UserLeaveQuota.findOne({
//         where: {
//           userId: leaveReq.userId,
//           leaveTypeId: leaveReq.leaveTypeId,
//           year: start.getFullYear(),
//         },
//         transaction,
//       });

//       if (userQuota) {
//         // Kurangi usedQuota agar kuota sisa kembali bertambah
//         await userQuota.update(
//           {
//             usedQuota: Math.max(0, userQuota.usedQuota - durasi),
//           },
//           { transaction },
//         );
//       }
//     }

//     await transaction.commit();
//     res.status(200).json({ msg: "Status pengajuan berhasil diperbarui." });
//   } catch (error) {
//     await transaction.rollback();
//     res.status(500).json({ msg: error.message });
//   }
// };
