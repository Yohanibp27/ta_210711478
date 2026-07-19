import LeaveRequest from "../models/LeaveRequestModel.js";
import User from "../models/UserModel.js";
import Position from "../models/PositionModel.js";
import Division from "../models/DivisionModel.js";
import Department from "../models/DepartmentModel.js";
import Profession from "../models/ProfessionModel.js";
import LeaveType from "../models/LeaveTypeModel.js";
import LeaveSubType from "../models/LeaveSubTypeModel.js";
import { Op } from "sequelize";
import UserActivity from "../models/UserActivityModel.js";
import db from "../config/Database.js";
import UserLeaveQuota from "../models/UserLeaveQuotaModel.js";

import dayjs from "dayjs";
import utc from "dayjs/plugin/utc.js";
import timezone from "dayjs/plugin/timezone.js";
dayjs.extend(utc);
dayjs.extend(timezone);

// USER SUBMIT
//    ↓
// status = pending
//    ↓
//    ├── di approve → approved
//    ├── di reject → rejected
//    ├── di cancel → cancelled
//    └── tidak diproses
//          ↓
//      lewat expiryDate
//          ↓
//      expired

/**
 * =========================
 * SEMUA ROLE - LIHAT SISA KUOTA CUTI
 * =========================
 */
export const getAllLeaveQuota = async (req, res) => {
  try {
    const currentYear = new Date().getFullYear();
    const quotas = await UserLeaveQuota.findAll({
      where: { year: currentYear },
      include: [
        {
          model: User,
          as: "user",
          attributes: [
            "id",
            "titlePrefix",
            "fullName",
            "titleSuffix",
            "nip",
            "profilePhoto",
          ],
          include: [
            { model: Profession, attributes: ["id", "name"] },
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
          ],
        },
        {
          model: LeaveSubType,
          as: "leavesubtype",
          attributes: [
            "id",
            "name",
            "leaveTypeId",
            "requireEvidence",
            "maxDays",
            "allowSameDay",
            "cutoffHour",
            "isAffectAttendance",
          ],
          include: [
            {
              model: LeaveType,
              attributes: ["id", "name"],
            },
          ],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    const data = quotas.map((q) => ({
      id: q.id,
      leaveSubTypeId: q.leaveSubTypeId,
      leaveSubTypeName: q.leavesubtype.name,
      leaveTypeId: q.leavesubtype.leaveTypeId,
      leaveTypeName: q.leavesubtype.leavetype.name,
      // total: q.totalQuota,
      // used: q.usedQuota,
      // remaining: q.totalQuota - q.usedQuota,
      quota: {
        total: q.totalQuota,
        used: q.usedQuota,
        remaining: q.totalQuota - q.usedQuota,
      },
      createdAt: q.createdAt,
      user: {
        id: q.user?.id,
        titlePrefix: q.user?.titlePrefix,
        fullName: q.user?.fullName,
        titleSuffix: q.user?.titleSuffix,
        nip: q.user?.nip,
        profilePhoto: q.user?.profilePhoto,
        profession: q.user?.profession?.name,
        position: q.user?.position?.name,
        division: q.user?.position?.division?.name,
        department: q.user?.position?.division?.department?.name,
      },
    }));

    res.status(200).json({
      message: "Berhasil menampilkan semua kuota karyawan",
      totalData: data.length,
      data,
    });
  } catch (error) {
    res.status(500).json({
      message: "Gagal mengambil data kuota",
      error: error.message,
    });
  }
};

export const getMyLeaveQuota = async (req, res) => {
  try {
    const userId = req.user.id;
    const currentYear = new Date().getFullYear();

    const quotas = await UserLeaveQuota.findAll({
      where: { userId, year: currentYear },
      include: [
        {
          model: User,
          as: "user",
          attributes: [
            "id",
            "titlePrefix",
            "fullName",
            "titleSuffix",
            "nip",
            "profilePhoto",
          ],
          include: [
            { model: Profession, attributes: ["id", "name"] },
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
          ],
        },
        {
          model: LeaveSubType,
          as: "leavesubtype",
          attributes: [
            "id",
            "name",
            "leaveTypeId",
            "requireEvidence",
            "maxDays",
            "allowSameDay",
            "cutoffHour",
            "isAffectAttendance",
          ],
          include: [{ model: LeaveType, attributes: ["id", "name"] }],
        },
      ],
    });

    const quotaData = quotas.map((q) => ({
      id: q.id,
      leaveSubTypeId: q.leaveSubTypeId,
      leaveSubTypeName: q.leavesubtype.name,
      leaveTypeId: q.leavesubtype.leaveTypeId,
      leaveTypeName: q.leavesubtype.leavetype.name,
      total: q.totalQuota,
      used: q.usedQuota,
      remaining: q.totalQuota - q.usedQuota,
      createdAt: q.createdAt,
      user: {
        id: q.user?.id,
        titlePrefix: q.user?.titlePrefix,
        fullName: q.user?.fullName,
        titleSuffix: q.user?.titleSuffix,
        nip: q.user?.nip,
        profilePhoto: q.user?.profilePhoto,
        profession: {
          id: q.user?.profession?.id,
          name: q.user?.profession?.name,
        },
        position: {
          id: q.user?.position?.id,
          name: q.user?.position?.name,
          division: {
            id: q.user?.position?.division?.id,
            name: q.user?.position?.division?.name,
            department: {
              id: q.user?.position?.division?.department?.id,
              name: q.user?.position?.division?.department?.name,
            },
          },
        },
      },
    }));

    res.status(200).json({
      message: "Berhasil menampilkan kuota pengajuan diri sendiri",
      data: quotaData,
    });
  } catch (e) {
    res
      .status(500)
      .json({ message: "Gagal mengambil kuota pengajuan", error: e.message });
  }
};

/**
 * =========================
 * USER - AJUKAN PENGAJUAN
 * =========================
 */
// TANPA KUOTA CUTI
// export const createLeaveRequest = async (req, res) => {
//   try {
//     const { startDate, endDate, note } = req.body;
//     const leaveTypeId = parseInt(req.body.leaveTypeId);
//     const leaveSubtypeIdFromReq = parseInt(req.body.leaveSubTypeId);
//     const evidenceFile = req.file ? req.file.filename : null;
//     const user = await User.findByPk(req.user.id);

//     if (!user) {
//       return res.status(404).json({ message: "User tidak ditemukan!" });
//     }

//     // VALIDASI TYPE & SUBTYPE
//     const leaveType = await LeaveType.findByPk(leaveTypeId);
//     const leaveSubtype = await LeaveSubType.findByPk(leaveSubtypeIdFromReq);
//     if (!leaveType) {
//       return res.status(400).json({
//         message: "Jenis pengajuan tidak valid!",
//       });
//     } else if (!leaveSubtype) {
//       return res.status(400).json({
//         message: "Sub jenis pengajuan tidak valid!",
//       });
//     }

//     if (isNaN(leaveTypeId)) {
//       return res.status(400).json({
//         message: "ID jenis pengajuan harus berupa angka!",
//       });
//     } else if (isNaN(leaveSubtypeIdFromReq)) {
//       return res.status(400).json({
//         message: "ID sub jenis pengajuan harus berupa angka!",
//       });
//     }

//     // VALIDASI TANGGAL
//     const today = dayjs().format("YYYY-MM-DD");
//     // cek apakah tanggal mulai < tanggal sekarang (BACKDATE)
//     if (dayjs(startDate).isBefore(today)) {
//       return res.status(400).json({
//         message: "Tidak boleh mengajukan untuk tanggal yang sudah lewat!",
//       });
//     }
//     // Cek apakah tanggal mulai > tanggal selesai
//     if (new Date(startDate) > new Date(endDate)) {
//       return res.status(400).json({
//         message: "Tanggal tidak valid!",
//       });
//     }

//     // allowSameDay + cutoff
//     if (startDate === today) {
//       if (!leaveSubtype.allowSameDay) {
//         return res.status(400).json({
//           message: "Tidak boleh pengajuan di hari yang sama!",
//         });
//       }
//       const nowHour = dayjs().hour();
//       if (leaveSubtype.cutoffHour && nowHour > leaveSubtype.cutoffHour) {
//         return res.status(400).json({
//           message: `Pengajuan maksimal jam ${leaveSubtype.cutoffHour}:00`,
//         });
//       }
//     }

//     // maxDays
//     const diffDays = dayjs(endDate).diff(dayjs(startDate), "day") + 1;
//     if (leaveSubtype.maxDays && diffDays > leaveSubtype.maxDays) {
//       return res.status(400).json({
//         message: `Pengajuan maksimal ${leaveSubtype.maxDays} hari`,
//       });
//     }

//     // evidence wajib
//     if (leaveSubtype.requireEvidence && !evidenceFile) {
//       return res.status(400).json({
//         message: `Pengajuan ${leaveSubtype.name} wajib melampirkan bukti!`,
//       });
//     }

//     // // tidak boleh double leave aktif
//     // const activeLeave = await LeaveRequest.findOne({
//     //   where: {
//     //     userId: user.id,
//     //     status: "approved",
//     //     endDate: { [Op.gte]: today },
//     //   },
//     // });
//     // if (activeLeave) {
//     //   return res.status(400).json({
//     //     message: "Anda masih memiliki pengajuan yang aktif!",
//     //   });
//     // }

//     let expiryDate;
//     if (startDate === today) {
//       // maksimal 2 jam setelah pengajuan terkirim batas konfirmasi oleh manager dan sdm
//       expiryDate = dayjs().add(2, "hour").toDate();

//       //   // Jika pengajuan di hari-H (Mendadak), batas expired manajer bertindak mutlak jam 12:00 siang hari ini.
//       //   // Format 24 jam: hour(12), minute(0), second(0)
//       //   expiryDate = dayjs(startDate).hour(12).minute(0).second(0).toDate();
//     } else {
//       //   expiryDate = dayjs(startDate).subtract(1, "day").toDate();
//       // Jika pengajuan H-X (Direncanakan), batas expired adalah H-1 jam 23:59:59 malam
//       expiryDate = dayjs(startDate)
//         .subtract(1, "day")
//         .hour(23)
//         .minute(59)
//         .second(59)
//         .toDate();
//     }

//     const leave = await LeaveRequest.create({
//       userId: user.id,
//       leaveTypeId,
//       leaveSubTypeId: leaveSubtypeIdFromReq,
//       startDate,
//       endDate,
//       note,
//       evidenceFile,
//       status: "pending",
//       managerStatus: "pending",
//       sdmStatus: "pending",
//       expiryDate,
//     });

//     await UserActivity.create({
//       userId: user.id,
//       category: "leave",
//       action: "submitted",
//       referenceId: leave.id,
//       title: `Pengajuan ${leaveType.name}`,
//       description: `Pengajuan ${leaveSubtype.name} telah dikirim`,
//     });

//     res.status(201).json({
//       message: "Pengajuan berhasil dibuat",
//       data: leave,
//     });
//   } catch (error) {
//     res.status(500).json({
//       message: "Gagal membuat pengajuan",
//       error: error.message,
//     });
//   }
// };

// DENGAN KUOTA CUTI

export const createLeaveRequest = async (req, res) => {
  const transaction = await db.transaction();
  try {
    const { startDate, endDate, note } = req.body;
    const leaveTypeId = parseInt(req.body.leaveTypeId);
    const leaveSubtypeIdFromReq = parseInt(req.body.leaveSubTypeId);
    const evidenceFile = req.file ? req.file.filename : null;
    const user = await User.findByPk(req.user.id);

    if (!user) {
      await transaction.rollback();
      return res.status(404).json({ message: "User tidak ditemukan!" });
    }

    // VALIDASI TYPE & SUBTYPE
    const leaveType = await LeaveType.findByPk(leaveTypeId);
    const leaveSubtype = await LeaveSubType.findByPk(leaveSubtypeIdFromReq);
    if (!leaveType) {
      await transaction.rollback();
      return res.status(400).json({ message: "Jenis pengajuan tidak valid!" });
    }
    if (!leaveSubtype) {
      await transaction.rollback();
      return res
        .status(400)
        .json({ message: "Sub jenis pengajuan tidak valid!" });
    }

    if (isNaN(leaveTypeId)) {
      return res.status(400).json({
        message: "ID jenis pengajuan harus berupa angka!",
      });
    } else if (isNaN(leaveSubtypeIdFromReq)) {
      return res.status(400).json({
        message: "ID sub jenis pengajuan harus berupa angka!",
      });
    }

    // VALIDASI TANGGAL
    const today = dayjs().format("YYYY-MM-DD");
    // Tidak boleh backdate (tanggal mundur)
    if (dayjs(startDate).isBefore(today)) {
      await transaction.rollback();
      return res.status(400).json({
        message: "Tidak boleh mengajukan untuk tanggal yang sudah lewat!",
      });
    }
    // Tanggal mulai tidak boleh melebihi tanggal selesai
    if (dayjs(startDate).isAfter(dayjs(endDate))) {
      await transaction.rollback();
      return res.status(400).json({ message: "Rentang tanggal tidak valid!" });
    }

    // VALIDASI DUPLIKASI / OVERLAPPING TANGGAL
    const overlappingLeave = await LeaveRequest.findOne({
      where: {
        userId: user.id,
        // Kita hanya peduli pada status pending atau approved.
        // Jika statusnya rejected/canceled, user boleh mengajukan ulang.
        status: { [Op.in]: ["pending", "approved"] },
        // Logika Overlap: startDate_lama <= endDate_baru && endDate_lama >= startDate_baru
        startDate: {
          [Op.lte]: endDate,
        },
        endDate: {
          [Op.gte]: startDate,
        },
      },
      transaction,
    });
    if (overlappingLeave) {
      await transaction.rollback();
      return res.status(400).json({
        message: "Anda sudah memiliki pengajuan pada tanggal yang sama!",
      });
    }

    // 4. VALIDASI ATURAN SUBTYPE (Same Day, Cutoff, Evidence)
    if (startDate === today) {
      if (!leaveSubtype.allowSameDay) {
        await transaction.rollback();
        return res
          .status(400)
          .json({ message: "Pengajuan tidak boleh di hari yang sama!" });
      }
      const nowHour = dayjs().hour();
      if (leaveSubtype.cutoffHour && nowHour > leaveSubtype.cutoffHour) {
        await transaction.rollback();
        return res.status(400).json({
          message: `Pengajuan ${leaveSubtype.name} maksimal pada jam ${leaveSubtype.cutoffHour}:00`,
        });
      }
    }

    // 5. HITUNG DURASI & VALIDASI MAKSIMAL HARI
    // Menghitung selisih hari (termasuk hari H).
    // Catatan: Jika RS punya aturan tidak menghitung hari Minggu, logikanya perlu diubah di sini nanti.
    const diffDays = dayjs(endDate).diff(dayjs(startDate), "day") + 1;
    if (leaveSubtype.maxDays && diffDays > leaveSubtype.maxDays) {
      await transaction.rollback();
      return res.status(400).json({
        message: `Pengajuan ${leaveSubtype.name} maksimal ${leaveSubtype.maxDays} hari`,
      });
    }

    // Evidence (Bukti) wajib untuk cuti/izin tertentu (misal: Sakit)
    if (leaveSubtype.requireEvidence && !evidenceFile) {
      await transaction.rollback();
      return res.status(400).json({
        message: `Pengajuan ${leaveSubtype.name} wajib melampirkan bukti!`,
      });
    }

    // 6. PENGECEKAN DAN PEMOTONGAN KUOTA (Hanya jika tipe cuti ini memotong kehadiran)
    // Asumsi: Semua pengajuan akan mengecek kuota tahunan.
    // Jika tipe izin (seperti sakit) tidak punya kuota, kamu bisa menambahkan kondisi if() di sini.
    const currentYear = dayjs(startDate).year();
    let userQuota = await UserLeaveQuota.findOne({
      // Ubah 'const' jadi 'let' agar bisa di-reassign
      where: {
        userId: user.id,
        leaveSubTypeId: leaveSubtypeIdFromReq,
        year: currentYear,
      },
      transaction, // Lock baris ini selama transaksi
    });

    // if (!userQuota) {
    //   await transaction.rollback();
    //   return res.status(404).json({
    //     message: "Data kuota cuti belum diatur oleh SDM untuk tahun ini",
    //   });
    // }

    // JIKA KUOTA BELUM ADA, BUATKAN OTOMATIS (KHUSUS PENGUJIAN / SISTEM BARU)
    if (!userQuota) {
      userQuota = await UserLeaveQuota.create(
        {
          userId: user.id,
          leaveSubTypeId: leaveSubtypeIdFromReq,
          year: currentYear,
          totalQuota: leaveSubtype.maxDays || 12, // Ambil batas maksimal dari subtype, atau default 12
          usedQuota: 0,
        },
        { transaction },
      );
    }
    const sisaKuota = userQuota.totalQuota - userQuota.usedQuota;
    if (sisaKuota < diffDays) {
      await transaction.rollback();
      return res.status(400).json({
        message: `Pengajuan gagal. Sisa kuota Anda hanya ${sisaKuota} hari, sedangkan pengajuan ${diffDays} hari`,
      });
    }

    // 7. PENENTUAN EXPIRY DATE (Batas waktu Manajer/SDM melakukan approval)
    let expiryDate;
    if (startDate === today) {
      // Expired dalam 2 jam jika mendadak
      expiryDate = dayjs().add(2, "hour").toDate();

      //   // Jika pengajuan di hari-H (dinas mendadak), batas expired manajer bertindak mutlak jam 12:00 siang hari ini.
      //   // Format 24 jam: hour(12), minute(0), second(0)
      //   expiryDate = dayjs(startDate).hour(12).minute(0).second(0).toDate();
    } else {
      expiryDate = dayjs(startDate)
        .subtract(1, "day")
        .hour(23)
        .minute(59)
        .second(59)
        .toDate(); // Expired H-1 jam 23:59
    }

    // 8. INSERT KE TABEL LEAVE REQUEST
    const leave = await LeaveRequest.create(
      {
        userId: user.id,
        leaveTypeId,
        leaveSubTypeId: leaveSubtypeIdFromReq,
        startDate,
        endDate,
        note,
        evidenceFile,
        status: "pending",
        managerStatus: "pending",
        sdmStatus: "pending",
        expiryDate,
      },
      { transaction },
    );

    // 9. UPDATE TABEL QUOTA (SOFT DEDUCTION)
    await userQuota.update(
      {
        usedQuota: userQuota.usedQuota + diffDays,
      },
      { transaction },
    );

    await UserActivity.create(
      {
        userId: user.id,
        category: "leave",
        action: "submitted",
        referenceId: leave.id,
        title: `Pengajuan ${leaveType.name}`,
        description: `Pengajuan ${leaveSubtype.name} untuk ${diffDays} hari telah dikirim`,
      },
      { transaction },
    );

    await transaction.commit();
    res.status(201).json({
      message: "Pengajuan berhasil dibuat dan kuota telah disesuaikan",
      data: leave,
    });
  } catch (error) {
    await transaction.rollback();
    res.status(500).json({
      message: "Gagal membuat pengajuan",
      error: error.message,
    });
  }
};

/**
 * =========================
 * USER - BATALKAN PENGAJUAN
 * =========================
 */
export const cancelLeaveRequest = async (req, res) => {
  const t = await db.transaction();
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const leave = await LeaveRequest.findByPk(id);

    if (!leave) {
      return res.status(404).json({
        success: false,
        message: "Data pengajuan tidak ditemukan!",
      });
    }

    // hanya pengaju yang boleh cancel
    if (leave.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: "Anda tidak memiliki akses untuk membatalkan pengajuan ini!",
      });
    }

    if (leave.status === "cancelled") {
      return res.status(400).json({
        success: false,
        message: "Pengajuan sudah dibatalkan!",
      });
    }

    // hanya bisa cancel kalau masih pending (belum diproses manager/SDM)
    if (leave.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: "Pengajuan tidak dapat dibatalkan karena dalam proses!",
      });
    }
    leave.status = "cancelled";
    await leave.save({ transaction: t });
    // const user = await User.findByPk(userId);
    // const userName = user
    //   ? `${user.titlePrefix ? user.titlePrefix + ". " : ""}${user.fullName}`
    //   : "User";
    const leaveType = await LeaveType.findByPk(leave.leaveTypeId);
    const leaveSubtype = await LeaveSubType.findByPk(leave.leaveSubTypeId);

    await UserActivity.create(
      {
        userId, // pengaju
        category: "leave",
        action: "cancelled",
        referenceId: leave.id,
        title: `Pengajuan ${leaveType?.name} Dibatalkan`,
        description: `Anda membatalkan pengajuan ${leaveType?.name}`,
      },
      { transaction: t },
    );
    await t.commit();

    return res.status(200).json({
      success: true,
      message: "Pengajuan berhasil dibatalkan",
      data: leave,
    });
  } catch (e) {
    await t.rollback();
    console.error("CANCEL LEAVE ERROR:", e);
    return res.status(500).json({
      success: false,
      message: "Gagal membatalkan pengajuan",
      error: e.message,
    });
  }
};

/**
 * =========================
 * LIST PENGAJUAN DIRI SENDIRI
 * =========================
 */
export const getMyLeaveRequests = async (req, res) => {
  try {
    const requests = await LeaveRequest.findAll({
      where: { userId: req.user.id },
      order: [["createdAt", "DESC"]],
      attributes: [
        "id",
        "userId",
        "leaveTypeId",
        "leaveSubTypeId",
        "startDate",
        "endDate",
        "note",
        "evidenceFile",
        "status",
        "managerId",
        "managerStatus",
        "managerDecisionNote",
        "managerDecisionAt",
        "sdmId",
        "sdmStatus",
        "sdmDecisionNote",
        "sdmDecisionAt",
        "createdAt",
      ],
      include: [
        {
          model: User,
          as: "user",
          attributes: [
            "id",
            "titlePrefix",
            "fullName",
            "titleSuffix",
            "nip",
            "profilePhoto",
          ],
          include: [
            { model: Profession, attributes: ["id", "name"] },
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
          ],
        },
        {
          model: LeaveType,
          as: "leavetype",
          attributes: ["id", "name"],
        },
        {
          model: LeaveSubType,
          as: "leavesubtype",
          attributes: [
            "id",
            "name",
            "requireEvidence",
            "allowSameDay",
            "cutoffHour",
          ],
        },
        {
          model: User,
          as: "manager",
          attributes: [
            "id",
            "titlePrefix",
            "fullName",
            "titleSuffix",
            "nip",
            "profilePhoto",
          ],
          include: [
            { model: Profession, attributes: ["id", "name"] },
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
          ],
        },
        {
          model: User,
          as: "sdm",
          attributes: [
            "id",
            "titlePrefix",
            "fullName",
            "titleSuffix",
            "nip",
            "profilePhoto",
          ],
          include: [
            { model: Profession, attributes: ["id", "name"] },
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
          ],
        },
      ],
    });

    if (requests.length === 0) {
      return res.status(200).json({
        message: "Belum ada data pengajuan",
        data: [],
      });
    }

    const formattedData = requests.map((item) => {
      const requestJson = item.toJSON();

      const setAvatarUrl = (photoFilename) =>
        photoFilename
          ? `${req.protocol}://${req.get("host")}/uploads/profilePhotos/${photoFilename}`
          : null;

      if (requestJson.user) {
        requestJson.user.avatarUrl = setAvatarUrl(
          requestJson.user.profilePhoto,
        );
      }

      if (requestJson.manager) {
        requestJson.manager.avatarUrl = setAvatarUrl(
          requestJson.manager.profilePhoto,
        );
      }

      if (requestJson.approvedBySdm) {
        requestJson.approvedBySdm.avatarUrl = setAvatarUrl(
          requestJson.approvedBySdm.profilePhoto,
        );
      }

      if (requestJson.evidenceFile) {
        requestJson.evidenceFileUrl = `${req.protocol}://${req.get("host")}/uploads/evidence/${requestJson.evidenceFile}`;
      }

      return requestJson;
    });

    res.status(200).json({
      message: "Berhasil menampilkan daftar pengajuan diri sendiri",
      data: formattedData,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Gagal mengambil daftar pengajuan diri sendiri",
      error: error.message,
    });
  }
};

/**
 * =========================
 * LIST PENGAJUAN
 * =========================
 * user     -> lihat pengajuan sendiri
 * manager  -> lihat pengajuan unit
 * sdm      -> lihat semua
 */
// export const getLeaveRequests = async (req, res) => {
//   try {
//     let whereClause = {};

//     if (req.user.role === "user") {
//       whereClause.userId = req.user.id;
//     }

//     // if (req.user.role === "manager") {
//     //   whereClause.positionId = req.user.positionId;
//     // }

//     const data = await LeaveRequest.findAll({
//       where: whereClause,
//       include: [
//         {
//           model: User,
//           as: "user",
//           attributes: [
//             "id",
//             "titlePrefix",
//             "fullName",
//             "titleSuffix",
//             "nip",
//             "profilePhoto",
//           ],
//           include: [
//             {
//               model: Position,
//               attributes: ["id", "name"],
//               include: [
//                 {
//                   model: Division,
//                   attributes: ["id", "name"],
//                   include: [
//                     {
//                       model: Department,
//                       attributes: ["id", "name"],
//                     },
//                   ],
//                 },
//               ],
//             },
//           ],
//         },
//         { model: LeaveType, attributes: ["id", "name"] },
//         { model: LeaveSubType, attributes: ["id", "name"] },
//         {
//           model: User,
//           as: "manager",
//           attributes: ["id", "titlePrefix", "fullName", "titleSuffix", "nip"],
//           include: [
//             {
//               model: Position,
//               attributes: ["id", "name"],
//               include: [
//                 {
//                   model: Division,
//                   attributes: ["id", "name"],
//                   include: [
//                     {
//                       model: Department,
//                       attributes: ["id", "name"],
//                     },
//                   ],
//                 },
//               ],
//             },
//           ],
//         },
//         {
//           model: User,
//           as: "sdm",
//           attributes: ["id", "titlePrefix", "fullName", "titleSuffix", "nip"],
//           include: [
//             {
//               model: Position,
//               attributes: ["id", "name"],
//               include: [
//                 {
//                   model: Division,
//                   attributes: ["id", "name"],
//                   include: [
//                     {
//                       model: Department,
//                       attributes: ["id", "name"],
//                     },
//                   ],
//                 },
//               ],
//             },
//           ],
//         },
//       ],
//       order: [["createdAt", "ASC"]],
//     });
//     const avatarUser = data.map((leave) => {
//       const user = leave.toJSON();
//       if (user.user?.profilePhoto) {
//         user.user.avatarUrl = `http://localhost:3000/uploads/profilePhotos/${user.user.profilePhoto}`;
//       } else {
//         user.user.avatarUrl = null;
//       }

//       if (user.manager?.profilePhoto) {
//         user.manager.avatarUrl = `http://localhost:3000/uploads/profilePhotos/${user.manager.profilePhoto}`;
//       }

//       if (user.sdm?.profilePhoto) {
//         user.sdm.avatarUrl = `http://localhost:3000/uploads/profilePhotos/${user.sdm.profilePhoto}`;
//       }
//       return user;
//     });

//     res.status(200).json({
//       message: "Berhasil menampilkan semua data pengajuan",
//       data: avatarUser,
//     });
//   } catch (error) {
//     res.status(500).json({
//       message: "Gagal mengambil data pengajuan",
//       error: error.message,
//     });
//   }
// };

export const getLeaveRequests = async (req, res) => {
  try {
    // 🔥 ambil user login + struktur organisasi
    const currentUser = await User.findByPk(req.user.id, {
      include: [
        {
          model: Position,
          include: [
            {
              model: Division,
              include: [Department],
            },
          ],
        },
      ],
    });

    if (!currentUser) {
      return res.status(404).json({ message: "User tidak ditemukan" });
    }

    const role = req.user.role;
    const userDivisionId = currentUser?.position?.division?.id;
    const userDepartmentId = currentUser?.position?.division?.department?.id;
    const departmentName = currentUser?.position?.division?.department?.name;
    let whereClause = {};

    // FILTER BERDASARKAN ROLE
    // 🔹 USER (karyawan biasa)
    if (role === "User") {
      whereClause.userId = req.user.id;
    }
    // 🔹 MANAGER (kepala unit → division)
    else if (role === "Manager") {
      // 🔥 kalau WASINTERN → lihat semua
      if (departmentName?.toLowerCase().includes("wasintern")) {
        console.log("DIVISION WASINTERN ID:", userDepartmentId);
      } else {
        // 🔥 selain WASINTERN → filter berdasarkan DIVISI/DEPARTEMEN
        //   whereClause["$user.position.division.id$"] = userDivisionId; // berdasarkan unit
        whereClause["$user.position.division.department.id$"] =
          userDepartmentId; // berdasarkan departemen
        console.log("DIVISION ID:", userDepartmentId);
      }
    }
    // 🔹 SUPERVISOR (subbag/subbid → department)
    else if (role === "Supervisor") {
      // 🔥 kalau BUKAN WASINTERN → filter department
      if (!departmentName?.toLowerCase().includes("wasintern")) {
        whereClause["$user.position.division.department.id$"] =
          userDepartmentId;
      }
      // 🔥 kalau WASINTERN → NO FILTER (lihat semua)
    }
    // 🔹 ADMIN (IT) → lihat semua
    else if (role === "Admin") {
      // tidak perlu filter
    }
    // 🔹 SUPER ADMIN (Direktur / Wakil) → lihat semua
    else if (role === "Super Admin") {
      // tidak perlu filter
    }

    const data = await LeaveRequest.findAll({
      where: whereClause,
      subQuery: false, // 🔥 WAJIB
      include: [
        {
          model: User,
          as: "user",
          required: true,
          attributes: [
            "id",
            "titlePrefix",
            "fullName",
            "titleSuffix",
            "nip",
            "profilePhoto",
          ],
          include: [
            {
              model: Position,
              required: true,
              attributes: ["id", "name"],
              include: [
                {
                  model: Division,
                  required: true,
                  attributes: ["id", "name"],
                  include: [
                    {
                      model: Department,
                      required: true,
                      attributes: ["id", "name"],
                    },
                  ],
                },
              ],
            },
            {
              model: UserLeaveQuota,
              required: false,
              where: {
                year: new Date().getFullYear(),
              },
              attributes: ["id", "leaveSubTypeId", "totalQuota", "usedQuota"],
            },
          ],
        },
        {
          model: LeaveType,
          attributes: ["id", "name"],
        },
        {
          model: LeaveSubType,
          attributes: ["id", "name"],
          include: [
            {
              model: LeaveType,
              attributes: ["id", "name"],
            },
          ],
        },
        {
          model: User,
          as: "manager",
          attributes: [
            "id",
            "titlePrefix",
            "fullName",
            "titleSuffix",
            "nip",
            "profilePhoto",
          ],
        },
        {
          model: User,
          as: "sdm",
          attributes: [
            "id",
            "titlePrefix",
            "fullName",
            "titleSuffix",
            "nip",
            "profilePhoto",
          ],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    /**
     * =========================
     * FORMAT AVATAR
     * =========================
     */
    const formatted = data.map((leave) => {
      const item = leave.toJSON();

      const setAvatar = (user) => {
        if (!user) return null;
        user.avatarUrl = user.profilePhoto
          ? `${req.protocol}://${req.get("host")}/uploads/profilePhotos/${user.profilePhoto}`
          : null;
        return user;
      };

      item.user = setAvatar(item.user);
      item.manager = setAvatar(item.manager);
      item.sdm = setAvatar(item.sdm);

      // AMBIL QUOTA SESUAI SUBTYPE CUTI
      const quota = item.user?.userLeaveQuotas?.find(
        (q) => q.leaveSubTypeId === item.leaveSubTypeId,
      );
      item.quota = quota
        ? {
            total: quota.totalQuota,
            used: quota.usedQuota,
            remaining: quota.totalQuota - quota.usedQuota,
          }
        : null;

      return item;
    });

    return res.status(200).json({
      message: "Berhasil menampilkan data pengajuan",
      data: formatted,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Gagal mengambil data pengajuan",
      error: error.message,
    });
  }
};

/**
 * =========================
 * DETAIL PENGAJUAN
 * =========================
 */
export const getLeaveRequestById = async (req, res) => {
  try {
    const data = await LeaveRequest.findByPk(req.params.id, {
      include: [
        {
          model: User,
          as: "user",
          attributes: [
            "id",
            "titlePrefix",
            "fullName",
            "titleSuffix",
            "nip",
            "profilePhoto",
          ],
          include: [
            { model: Profession, attributes: ["id", "name"] },
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
              model: UserLeaveQuota,
              attributes: ["id", "leaveSubTypeId", "totalQuota", "usedQuota"],
              where: {
                year: new Date().getFullYear(),
              },
              required: false,
            },
          ],
        },
        { model: LeaveType, attributes: ["id", "name"] },
        { model: LeaveSubType, attributes: ["id", "name"] },
        {
          model: User,
          as: "manager",
          attributes: [
            "id",
            "titlePrefix",
            "fullName",
            "titleSuffix",
            "nip",
            "profilePhoto",
          ],
          include: [
            { model: Profession, attributes: ["id", "name"] },
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
          ],
        },
        {
          model: User,
          as: "sdm",
          attributes: [
            "id",
            "titlePrefix",
            "fullName",
            "titleSuffix",
            "nip",
            "profilePhoto",
          ],
          include: [
            { model: Profession, attributes: ["id", "name"] },
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
          ],
        },
      ],
    });

    if (!data) {
      return res.status(404).json({ message: "Pengajuan tidak ditemukan" });
    }
    const avatarUser = data.toJSON();
    // if (avatarUser.user?.profilePhoto) {
    //   avatarUser.user.avatarUrl = `http://localhost:3000/uploads/profilePhotos/${avatarUser.user.profilePhoto}`;
    // } else {
    //   avatarUser.user.avatarUrl = null;
    // }

    // if (avatarUser.manager?.profilePhoto) {
    //   avatarUser.manager.avatarUrl = `http://localhost:3000/uploads/profilePhotos/${avatarUser.manager.profilePhoto}`;
    // }
    // if (avatarUser.sdm?.profilePhoto) {
    //   avatarUser.sdm.avatarUrl = `http://localhost:3000/uploads/profilePhotos/${avatarUser.sdm.profilePhoto}`;
    // }

    const backendUrl = (
      process.env.BACKEND_URL || `${req.protocol}://${req.get("host")}`
    ).replace(/\/$/, "");
    const buildAvatarUrl = (profilePhoto) => {
      if (!profilePhoto) return null;

      const photoValue = String(profilePhoto).trim();

      // Gunakan langsung jika sudah berupa URL produksi
      if (
        /^https?:\/\//i.test(photoValue) &&
        !photoValue.includes("localhost") &&
        !photoValue.includes("127.0.0.1")
      ) {
        return photoValue;
      }

      // Ambil nama file jika data lama masih menyimpan URL localhost/path
      const fileName = photoValue.split("/").pop();

      return `${backendUrl}/uploads/profilePhotos/${encodeURIComponent(fileName)}`;
    };

    if (avatarUser.user) {
      avatarUser.user.avatarUrl = buildAvatarUrl(avatarUser.user.profilePhoto);
    }

    if (avatarUser.manager) {
      avatarUser.manager.avatarUrl = buildAvatarUrl(
        avatarUser.manager.profilePhoto,
      );
    }

    if (avatarUser.sdm) {
      avatarUser.sdm.avatarUrl = buildAvatarUrl(avatarUser.sdm.profilePhoto);
    }

    res.status(200).json({
      message: "Berhasil menampilkan data pengajuan berdasarkan id",
      data: avatarUser,
    });
  } catch (error) {
    res.status(500).json({
      message: "Gagal mengambil detail pengajuan",
      error: error.message,
    });
  }
};

/**
 * =========================
 * MANAGER APPROVAL
 * =========================
 */
export const getLeaveByManager = async (req, res) => {
  try {
    const userId = req.user.id;
    const manager = await User.findByPk(userId, {
      include: {
        model: Position,
        include: {
          model: Division,
          include: Department,
        },
      },
    });

    if (!manager) {
      return res.status(404).json({
        message: "Manager tidak ditemukan!",
      });
    }

    // if (req.user.role !== "Manager") {
    //   return res.status(403).json({
    //     message: "Akses hanya untuk manager!",
    //   });
    // }
    const role = req.user.role?.toLowerCase();
    if (!["manager", "supervisor"].includes(role)) {
      return res.status(403).json({
        message: "Akses hanya untuk manager/supervisor non-wasintern!",
      });
    }

    const managerDept = manager.position?.division?.department?.id;
    const deptName =
      manager.position?.division?.department?.name?.toLowerCase() || "";
    // DETEKSI WASINTERN (SDM RS)
    const isWasintern = deptName.includes("subbag wasintern");

    // --- PERBAIKAN: Konfigurasi Filter Level Database ---
    const departmentIncludeConfig = {
      model: Department,
      attributes: ["id", "name"],
    };

    // Jika BUKAN wasintern, tambahkan klausa WHERE untuk menyaring departemen
    if (!isWasintern) {
      departmentIncludeConfig.where = { id: managerDept };
    }

    const leaves = await LeaveRequest.findAll({
      include: [
        {
          model: User,
          as: "user",
          attributes: [
            "id",
            "titlePrefix",
            "fullName",
            "titleSuffix",
            "nip",
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
            { model: Profession, attributes: ["id", "name"] },
            {
              model: UserLeaveQuota,
              required: false,
              where: {
                year: new Date().getFullYear(),
              },
              attributes: ["id", "leaveSubTypeId", "totalQuota", "usedQuota"],
            },
          ],
        },
        {
          model: LeaveType,
          attributes: ["id", "name"],
        },
        {
          model: LeaveSubType,
          attributes: ["id", "name"],
          include: [
            {
              model: LeaveType,
              attributes: ["id", "name"],
            },
          ],
        },
        {
          model: User,
          as: "manager",
          attributes: ["id", "titlePrefix", "fullName", "titleSuffix", "nip"],
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
            { model: Profession, attributes: ["id", "name"] },
          ],
        },
        {
          model: User,
          as: "sdm",
          attributes: ["id", "titlePrefix", "fullName", "titleSuffix", "nip"],
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
            { model: Profession, attributes: ["id", "name"] },
          ],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    // let filtered = leaves;
    // // kalo manager bukan dari WASINTERN -> filter berdasarkan departement
    // if (!isWasintern) {
    //   filtered = leaves.filter((ex) => {
    //     const deptId = ex.user?.position?.division?.department?.id;
    //     return deptId === managerDept;
    //   });
    // }

    return res.status(200).json({
      message: "Berhasil menampilkan data pengajuan berdasarkan manager",
      isWasintern,
      //   total: filtered.length,
      //   data: filtered,
      total: leaves.length,
      data: leaves,
    });
  } catch (e) {
    console.error("GET LEAVE REQUEST BY MANAGER ERROR:", e);
    res.status(500).json({
      message: "Gagal menampilkan data pengajuan berdasarkan manager",
      error: e.message,
    });
  }
};

// SEMUA MANAGER BISA APPROVE
// export const approveByManager = async (req, res) => {
//   try {
//     const leave = await LeaveRequest.findByPk(req.params.id);
//     // const now = dayjs().tz("Asia/Jakarta");

//     if (!leave) {
//       return res.status(404).json({ message: "Pengajuan tidak ditemukan!" });
//     }

//     const userId = req.user.id;
//     console.log("USER LOGIN:", userId);
//     console.log("MANAGER ID:", leave.managerId);
//     console.log("STATUS:", leave.status);

//     // validasi hanya role manager yang bisa setujui
//     if (req.user.role !== "Manager") {
//       return res.status(403).json({
//         message:
//           "Anda tidak memiliki akses sebagai manager untuk pengajuan ini!",
//       });
//     }

//     const leaveType = await LeaveType.findByPk(leave.leaveTypeId);
//     const leaveSubtype = await LeaveSubType.findByPk(leave.leaveSubTypeId);
//     if (!leaveType) {
//       return res.status(400).json({
//         message: "Jenis pengajuan tidak valid!",
//       });
//     } else if (!leaveSubtype) {
//       return res.status(400).json({
//         message: "Sub jenis pengajuan tidak valid!",
//       });
//     }

//     if (leave.status === "cancelled") {
//       return res.status(400).json({
//         message: "Pengajuan sudah dibatalkan oleh pengaju!",
//       });
//     }
//     if (leave.status !== "pending") {
//       return res.status(400).json({
//         message: "Pengajuan sudah diproses sebelumnya!",
//       });
//     }

//     if (dayjs().isAfter(dayjs(leave.expiryDate))) {
//       return res
//         .status(400)
//         .json({ message: "Konfirmasi pengajuan sudah kedaluwarsa!" });
//     }

//     if (leave.status === "expired") {
//       return res.status(400).json({
//         message: "Pengajuan sudah kedaluwarsa!",
//       });
//     }

//     await leave.update({
//       managerStatus: "approved",
//       managerId: req.user.id,
//       //   managerDecisionAt: now.toDate(),
//       managerDecisionAt: new Date(),
//     });

//     await UserActivity.create({
//       userId: leave.userId, // pengaju
//       category: "leave",
//       action: "approved",
//       referenceId: leave.id,
//       title: `Pengajuan ${leaveType.name}`,
//       description: `Pengajuan ${leaveType.name} Anda disetujui oleh Manager`,
//     });

//     res
//       .status(200)
//       .json({ message: "Pengajuan berhasil disetujui oleh manager" });
//   } catch (e) {
//     res.status(500).json({
//       message: "Gagal menyetujui pengajuan",
//       error: e.message,
//     });
//     await t.rollback();
//     return res.status(500).json({ message: e.message });
//   }
// };

// export const approveByManager = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { decisionNote } = req.body || {};
//     const userId = req.user.id;
//     // const leave = await LeaveRequest.findByPk(req.params.id);
//     const leave = await LeaveRequest.findByPk(id);

//     console.log("USER LOGIN (LEAVE REQUEST):", userId);
//     console.log("MANAGER ID:", leave.managerId);
//     console.log("STATUS:", leave.status);

//     if (!leave) {
//       return res.status(404).json({ message: "Pengajuan tidak ditemukan!" });
//     }

//     if (req.user.role !== "Manager" && req.user.role !== "Admin") {
//       return res.status(403).json({
//         message:
//           "Akses ditolak! Anda tidak memiliki akses sebagai manager untuk pengajuan ini!",
//       });
//     }

//     const leaveType = await LeaveType.findByPk(leave.leaveTypeId);
//     const leaveSubtype = await LeaveSubType.findByPk(leave.leaveSubTypeId);
//     if (!leaveType) {
//       return res.status(400).json({
//         message: "Jenis pengajuan tidak valid!",
//       });
//     } else if (!leaveSubtype) {
//       return res.status(400).json({
//         message: "Sub jenis pengajuan tidak valid!",
//       });
//     }

//     if (leave.status === "cancelled") {
//       return res.status(400).json({
//         message: "Pengajuan sudah dibatalkan oleh pengaju!",
//       });
//     }
//     if (leave.status !== "pending") {
//       return res.status(400).json({
//         message: "Pengajuan sudah diproses sebelumnya!",
//       });
//     }

//     if (dayjs().isAfter(dayjs(leave.expiryDate))) {
//       return res
//         .status(400)
//         .json({ message: "Konfirmasi pengajuan sudah kedaluwarsa!" });
//     }

//     if (leave.status === "expired") {
//       return res.status(400).json({
//         message: "Pengajuan sudah kedaluwarsa!",
//       });
//     }

//     await db.transaction(async (t) => {
//       await leave.update(
//         {
//           managerStatus: "approved",
//           managerId: userId,
//           managerDecisionNote: decisionNote || null,
//           managerDecisionAt: new Date(),
//         },
//         { transaction: t },
//       );
//     });

//     await UserActivity.create(
//       {
//         userId: leave.userId, // pengaju
//         category: "leave",
//         action: "approved",
//         referenceId: leave.id,
//         title: `Pengajuan ${leaveType.name}`,
//         description: `Pengajuan ${leaveType.name} Anda disetujui oleh Manager`,
//       },
//       { transaction: t },
//     );

//     await t.commit();
//     res
//       .status(200)
//       .json({ message: "Pengajuan berhasil disetujui oleh manager" });
//   } catch (e) {
//     res.status(500).json({
//       message: "Gagal menyetujui pengajuan",
//       error: e.message,
//     });
//     await t.rollback();
//     return res.status(500).json({ message: e.message });
//   }
// };

export const approveByManager = async (req, res) => {
  try {
    const { id } = req.params;
    const { decisionNote } = req.body || {};
    const userId = req.user.id;
    const userRole = req.user.role;
    const role = userRole?.toLowerCase();
    const leave = await LeaveRequest.findByPk(id);

    if (!leave) {
      return res.status(404).json({ message: "Pengajuan tidak ditemukan!" });
    }

    console.log("USER LOGIN (LEAVE REQUEST):", userId);
    console.log("MANAGER ID:", leave.managerId);
    console.log("STATUS:", leave.status);

    if (leave.status === "cancelled") {
      return res
        .status(400)
        .json({ message: "Pengajuan sudah dibatalkan oleh pengaju!" });
    }
    if (leave.status !== "pending") {
      return res
        .status(400)
        .json({ message: "Pengajuan sudah diproses sebelumnya!" });
    }
    if (dayjs().isAfter(dayjs(leave.expiryDate))) {
      return res
        .status(400)
        .json({ message: "Konfirmasi pengajuan sudah kedaluwarsa!" });
    }

    // if (userRole !== "Manager" && userRole !== "Admin") {
    //   return res.status(403).json({
    //     message:
    //       "Akses ditolak! Anda tidak memiliki akses sebagai manager untuk pengajuan ini!",
    //   });
    // }

    // OTORISASI (Ditambahkan agar sama dengan Shift Exchange)
    let isAuthorized = false;
    // if (["admin", "admin super"].includes(role)) {
    // role Admin adalah karyawan IT, role Admin Super adalah untuk kepala rumah sakit
    if (role === "admin") {
      isAuthorized = true;
    } else if (["manager", "supervisor"].includes(role)) {
      // MANAGER DARI WASINTERN BISA NGUBAH POSISI MANAGER NON-WASINTERN
      //   const currentUser = await User.findByPk(userId, {
      //     include: {
      //       model: Position,
      //       include: { model: Division, include: Department },
      //     },
      //   });
      //   const deptName =
      //     currentUser?.position?.division?.department?.name?.toLowerCase() || "";
      //   if (deptName.includes("subbag wasintern")) {
      //     isAuthorized = true;
      //   } else {
      //     const requester = await User.findByPk(leave.userId, {
      //       include: {
      //         model: Position,
      //         include: { model: Division, include: Department },
      //       },
      //     });
      //     // if (
      //     //   currentUser?.position?.division?.department?.id ===
      //     //     requester?.position?.division?.department?.id &&
      //     //   role === "manager"
      //     // )
      //     //   isAuthorized = true;

      //     const managerDept = currentUser?.position?.division?.department?.id;
      //     const requesterDept = requester?.position?.division?.department?.id;
      //     if (
      //       managerDept === requesterDept &&
      //       ["manager", "supervisor"].includes(role)
      //     )
      //       isAuthorized = true;
      //   }

      // HANYA MANAGER / SUPERVISOR NON-WASINTERN YANG BISA APPROVE SESUAI FUNGSI PENGAJU
      const currentUser = await User.findByPk(userId, {
        include: {
          model: Position,
          include: { model: Division, include: Department },
        },
      });
      const requester = await User.findByPk(leave.userId, {
        include: {
          model: Position,
          include: { model: Division, include: Department },
        },
      });

      const managerDept = currentUser?.position?.division?.department?.id;
      const requesterDept = requester?.position?.division?.department?.id;

      // PERBAIKAN: Manager/SPV hanya berhak jika departemennya SAMA dengan pengaju
      if (managerDept && requesterDept && managerDept === requesterDept) {
        isAuthorized = true;
      }
    }

    if (!isAuthorized)
      return res
        .status(403)
        .json({ message: "Akses ditolak! Bukan otoritas departemen Anda" });

    const leaveType = await LeaveType.findByPk(leave.leaveTypeId);
    const leaveSubtype = await LeaveSubType.findByPk(leave.leaveSubTypeId);
    if (!leaveType) {
      return res.status(400).json({ message: "Jenis pengajuan tidak valid!" });
    } else if (!leaveSubtype) {
      return res
        .status(400)
        .json({ message: "Sub jenis pengajuan tidak valid!" });
    }

    // if (leave.status === "expired") {
    //   return res.status(400).json({ message: "Pengajuan sudah kedaluwarsa!" });
    // }

    const t = await db.transaction();
    try {
      await leave.update(
        {
          managerStatus: "approved",
          managerId: userId,
          managerDecisionNote: decisionNote || null,
          managerDecisionAt: new Date(),
        },
        { transaction: t },
      );

      await UserActivity.create(
        {
          userId: leave.userId, // pengaju
          category: "leave",
          action: "approved",
          referenceId: leave.id,
          title: `Pengajuan ${leaveType.name}`,
          description: `Pengajuan ${leaveType.name} Anda disetujui oleh Manager`,
        },
        { transaction: t },
      );

      await t.commit();
      res
        .status(200)
        .json({ message: "Pengajuan berhasil disetujui oleh manager" });
    } catch (dbError) {
      await t.rollback();
      throw dbError;
    }
  } catch (e) {
    console.error("LEAVE APPROVE ERROR:", e);
    res
      .status(500)
      .json({ message: "Gagal menyetujui pengajuan", error: e.message });
  }
};

// export const rejectByManager = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const decisionNote = req.body || {};
//     const userId = req.user.id;
//     const leave = await LeaveRequest.findByPk(id);
//     // const decisionNote = req.body?.decisionNote;
//     // const leave = await LeaveRequest.findByPk(req.params.id);

//     console.log("USER LOGIN (LEAVE REQUEST):", userId);
//     console.log("MANAGER ID:", leave.managerId);
//     console.log("STATUS:", leave.status);

//     if (!leave) {
//       return res.status(404).json({ message: "Pengajuan tidak ditemukan!" });
//     }

//     if (req.user.role !== "Manager" && req.user.role !== "Admin") {
//       return res.status(403).json({
//         message:
//           "Akses ditolak! Anda tidak memiliki akses sebagai manager untuk pengajuan ini!",
//       });
//     }

//     if (!decisionNote || decisionNote.trim() === "") {
//       return res.status(400).json({
//         message: "Alasan penolakan pengajuan wajib diisi!",
//       });
//     }

//     const leaveType = await LeaveType.findByPk(leave.leaveTypeId);
//     const leaveSubtype = await LeaveSubType.findByPk(leave.leaveSubTypeId);
//     if (!leaveType) {
//       return res.status(400).json({
//         message: "Jenis pengajuan tidak valid!",
//       });
//     } else if (!leaveSubtype) {
//       return res.status(400).json({
//         message: "Sub jenis pengajuan tidak valid!",
//       });
//     }

//     if (leave.status === "cancelled") {
//       return res.status(400).json({
//         message: "Pengajuan sudah dibatalkan oleh pengaju!",
//       });
//     }
//     if (leave.status !== "pending") {
//       return res.status(400).json({
//         message: "Pengajuan sudah diproses sebelumnya",
//       });
//     }

//     if (dayjs().isAfter(dayjs(leave.expiryDate))) {
//       return res
//         .status(400)
//         .json({ message: "Konfirmasi pengajuan sudah kedaluwarsa!" });
//     }

//     if (leave.status === "expired") {
//       return res.status(400).json({
//         message: "Pengajuan sudah kedaluwarsa!",
//       });
//     }

//     await db.transaction(async (t) => {
//       await leave.update(
//         {
//           managerStatus: "rejected",
//           managerId: userId,
//           managerDecisionNote: decisionNote,
//           managerDecisionAt: new Date(),
//           status: "rejected",
//         },
//         { transaction: t },
//       );
//     });

//     await UserActivity.create({
//       userId: leave.userId, // pengaju
//       category: "leave",
//       action: "rejected",
//       referenceId: leave.id,
//       title: `Pengajuan ${leaveType.name}`,
//       description: `Pengajuan ${leaveType.name} Anda ditolak oleh Manager`,
//     });

//     await t.commit();
//     res
//       .status(200)
//       .json({ message: "Pengajuan berhasil ditolak oleh manager" });
//   } catch (error) {
//     res.status(500).json({
//       message: "Gagal menolak pengajuan",
//       error: error.message,
//     });
//     await t.rollback();
//     return res.status(500).json({ message: e.message });
//   }
// };

export const rejectByManager = async (req, res) => {
  try {
    const { id } = req.params;
    const { decisionNote } = req.body;
    const userId = req.user.id;
    const userRole = req.user.role;
    const role = userRole?.toLowerCase();
    const leave = await LeaveRequest.findByPk(id);

    if (!leave) {
      return res.status(404).json({ message: "Pengajuan tidak ditemukan!" });
    }

    console.log("USER LOGIN (LEAVE REQUEST):", userId);
    console.log("MANAGER ID:", leave.managerId);
    console.log("STATUS:", leave.status);

    // if (userRole !== "Manager" && userRole !== "Admin") {
    //   return res.status(403).json({
    //     message:
    //       "Akses ditolak! Anda tidak memiliki akses sebagai manager untuk pengajuan ini!",
    //   });
    // }

    if (!decisionNote || decisionNote.trim() === "") {
      return res
        .status(400)
        .json({ message: "Alasan penolakan pengajuan wajib diisi!" });
    }

    if (leave.status === "cancelled") {
      return res
        .status(400)
        .json({ message: "Pengajuan sudah dibatalkan oleh pengaju!" });
    }
    if (leave.status !== "pending") {
      return res
        .status(400)
        .json({ message: "Pengajuan sudah diproses sebelumnya" });
    }
    if (dayjs().isAfter(dayjs(leave.expiryDate))) {
      return res
        .status(400)
        .json({ message: "Konfirmasi pengajuan sudah kedaluwarsa!" });
    }

    // OTORISASI (Ditambahkan agar sama dengan Shift Exchange)
    let isAuthorized = false;
    // if (["admin", "admin super"].includes(role)) {
    if (role === "admin") {
      isAuthorized = true;
    } else if (["manager", "supervisor"].includes(role)) {
      // MANAGER DARI WASINTERN BISA NGUBAH POSISI MANAGER NON-WASINTERN
      //   const currentUser = await User.findByPk(userId, {
      //     include: {
      //       model: Position,
      //       include: { model: Division, include: Department },
      //     },
      //   });
      //   const deptName =
      //     currentUser?.position?.division?.department?.name?.toLowerCase() || "";
      //   if (deptName.includes("subbag wasintern")) {
      //     isAuthorized = true;
      //   } else {
      //     const requester = await User.findByPk(leave.userId, {
      //       include: {
      //         model: Position,
      //         include: { model: Division, include: Department },
      //       },
      //     });
      //     // if (
      //     //   currentUser?.position?.division?.department?.id ===
      //     //     requester?.position?.division?.department?.id &&
      //     //   role === "manager"
      //     // )
      //     //   isAuthorized = true;
      //     const managerDept = currentUser?.position?.division?.department?.id;
      //     const requesterDept = requester?.position?.division?.department?.id;
      //     if (
      //       managerDept === requesterDept &&
      //       ["manager", "supervisor"].includes(role)
      //     )
      //       isAuthorized = true;
      //   }

      // HANYA MANAGER / SUPERVISOR NON-WASINTERN YANG BISA REJECT SESUAI FUNGSI PENGAJU
      const currentUser = await User.findByPk(userId, {
        include: {
          model: Position,
          include: { model: Division, include: Department },
        },
      });
      const requester = await User.findByPk(leave.userId, {
        include: {
          model: Position,
          include: { model: Division, include: Department },
        },
      });

      const managerDept = currentUser?.position?.division?.department?.id;
      const requesterDept = requester?.position?.division?.department?.id;

      // PERBAIKAN: Manager/SPV hanya berhak jika departemennya SAMA dengan pengaju
      if (managerDept && requesterDept && managerDept === requesterDept) {
        isAuthorized = true;
      }
    }

    if (!isAuthorized)
      return res
        .status(403)
        .json({ message: "Akses ditolak! Bukan otoritas departemen Anda." });

    const leaveType = await LeaveType.findByPk(leave.leaveTypeId);
    const leaveSubtype = await LeaveSubType.findByPk(leave.leaveSubTypeId);
    if (!leaveType) {
      return res.status(400).json({ message: "Jenis pengajuan tidak valid!" });
    } else if (!leaveSubtype) {
      return res
        .status(400)
        .json({ message: "Sub jenis pengajuan tidak valid!" });
    }

    // if (leave.status === "expired") {
    //   return res.status(400).json({message: "Pengajuan sudah kedaluwarsa!"});
    // }

    const t = await db.transaction();
    try {
      await leave.update(
        {
          managerStatus: "rejected",
          managerId: userId,
          managerDecisionNote: decisionNote,
          managerDecisionAt: new Date(),
          status: "rejected",
        },
        { transaction: t },
      );

      await UserActivity.create({
        userId: leave.userId, // pengaju
        category: "leave",
        action: "rejected",
        referenceId: leave.id,
        title: `Pengajuan ${leaveType.name}`,
        description: `Pengajuan ${leaveType.name} Anda ditolak oleh Manager`,
      });

      await t.commit();
      res
        .status(200)
        .json({ message: "Pengajuan berhasil ditolak oleh manager" });
    } catch (dbError) {
      await t.rollback();
      throw dbError;
    }
  } catch (e) {
    console.error("LEAVE REJECT ERROR:", e);
    res
      .status(500)
      .json({ message: "Gagal menolak pengajuan", error: e.message });
  }
};

/**
 * =========================
 * SDM APPROVAL (FINAL)
 * =========================
 * - Jika manager reject → SDM auto reject
 * - Jika manager tidak respon → SDM bisa approve langsung
 */
// export const approveBySDM = async (req, res) => {
//   try {
//     const leave = await LeaveRequest.findByPk(req.params.id);
//     // const now = dayjs().tz("Asia/Jakarta");

//     if (!leave) {
//       return res.status(404).json({ message: "Pengajuan tidak ditemukan!" });
//     }

//     const userId = req.user.id;
//     console.log("USER LOGIN:", userId);
//     console.log("SDM ID:", leave.sdmId);
//     console.log("STATUS:", leave.status);
//     console.log("Status Pengajuan Saat Ini:", leave?.status);

//     // validasi hanya role sdm yang bisa setujui
//     if (req.user.role !== "Supervisor") {
//       return res.status(403).json({
//         message:
//           "Anda tidak memiliki akses sebagai supervisor untuk pengajuan ini!",
//       });
//     }

//     const leaveType = await LeaveType.findByPk(leave.leaveTypeId);
//     const leaveSubtype = await LeaveSubType.findByPk(leave.leaveSubTypeId);
//     if (!leaveType) {
//       return res.status(400).json({
//         message: "Jenis pengajuan tidak valid!",
//       });
//     } else if (!leaveSubtype) {
//       return res.status(400).json({
//         message: "Sub jenis pengajuan tidak valid!",
//       });
//     }

//     if (leave.status === "cancelled") {
//       return res.status(400).json({
//         message: "Pengajuan dibatalkan oleh pengaju",
//       });
//     }
//     if (leave.sdmStatus !== "pending") {
//       return res.status(400).json({
//         message: "Pengajuan sudah diproses sebelumnya",
//       });
//     }

//     if (dayjs().isAfter(dayjs(leave.expiryDate))) {
//       return res
//         .status(400)
//         .json({ message: "Konfirmasi pengajuan sudah kedaluwarsa!" });
//     }

//     if (leave.status === "expired") {
//       return res.status(400).json({
//         message: "Pengajuan sudah kedaluwarsa!",
//       });
//     }

//     await leave.update({
//       sdmStatus: "approved",
//       sdmId: req.user.id,
//       //   sdmDecisionAt: now.toDate(),
//       sdmDecisionAt: new Date(),
//       status: "approved",
//     });

//     await UserActivity.create({
//       userId: leave.userId, // pengaju
//       category: "leave",
//       action: "approved",
//       referenceId: leave.id,
//       title: `Pengajuan ${leaveType.name}`,
//       description: `Pengajuan ${leaveType.name} Anda disetujui oleh SDM`,
//     });

//     // jika pengajuan disetujui, update status cuti user menjadi "on_leave"
//     await User.update(
//       { leaveStatus: "on_leave" },
//       { where: { id: leave.userId } },
//     );

//     const updatedLeave = await LeaveRequest.findByPk(req.params.id, {
//       include: [
//         {
//           model: User,
//           as: "user",
//           attributes: [
//             "id",
//             "titlePrefix",
//             "fullName",
//             "titleSuffix",
//             "nip",
//             "profilePhoto",
//           ],
//           include: [
//             {
//               model: Position,
//               attributes: ["id", "name"],
//               include: [
//                 {
//                   model: Division,
//                   attributes: ["id", "name"],
//                   include: [
//                     {
//                       model: Department,
//                       attributes: ["id", "name"],
//                     },
//                   ],
//                 },
//               ],
//             },
//           ],
//         },
//         { model: LeaveType, attributes: ["id", "name"] },
//         { model: LeaveSubType, attributes: ["id", "name"] },
//       ],
//     });

//     res.status(200).json({
//       message: "Pengajuan berhasil disetujui oleh SDM",
//       data: updatedLeave,
//     });
//   } catch (error) {
//     res.status(500).json({
//       message: "Gagal menyetujui pengajuan SDM",
//       error: error.message,
//     });
//     await t.rollback();
//     return res.status(500).json({ message: e.message });
//   }
// };

export const approveBySDM = async (req, res) => {
  try {
    const { id } = req.params;
    const { decisionNote } = req.body || {};
    const userId = req.user.id;
    const userRole = req.user.role;
    const role = userRole?.toLowerCase();
    const leave = await LeaveRequest.findByPk(id);

    if (!leave) {
      return res.status(404).json({ message: "Pengajuan tidak ditemukan!" });
    }

    console.log("USER LOGIN (LEAVE REQUEST):", userId);
    console.log("SDM ID:", leave.sdmId);
    console.log("STATUS:", leave.status);
    console.log("Status Pengajuan Saat Ini:", leave?.status);

    if (role === "admin" && (!decisionNote || decisionNote.trim() === "")) {
      return res.status(400).json({
        message:
          "Gagal memproses. Admin IT wajib menyertakan catatan alasan melakukan bypass sistem!",
      });
    }

    if (leave.status === "cancelled") {
      return res
        .status(400)
        .json({ message: "Pengajuan dibatalkan oleh pengaju" });
    }
    // ✅ REVISI LOGIKA BYPASS
    // Jika BUKAN admin dan manager belum approve, tolak!
    // Jika ADMIN yang eksekusi, biarkan lolos.
    if (role !== "admin" && leave.managerStatus !== "approved") {
      return res
        .status(400)
        .json({ message: "Manager belum menyetujui pengajuan ini!" });
    }
    if (leave.sdmStatus !== "pending") {
      return res
        .status(400)
        .json({ message: "Pengajuan sudah diproses sebelumnya" });
    }
    if (dayjs().isAfter(dayjs(leave.expiryDate))) {
      return res
        .status(400)
        .json({ message: "Konfirmasi pengajuan sudah kedaluwarsa!" });
    }

    // if (userRole !== "Supervisor" && userRole !== "Admin") {
    //   return res.status(403).json({
    //     message:
    //       "Anda tidak memiliki akses sebagai supervisor untuk pengajuan ini!",
    //   });
    // }

    // OTORISASI SDM KHUSUS WASINTERN / ADMIN
    let isAuthorized = false;
    // if (["admin", "admin super"].includes(role)) {
    if (role === "admin") {
      isAuthorized = true;
    } else if (["manager", "supervisor"].includes(role)) {
      const currentUser = await User.findByPk(userId, {
        include: {
          model: Position,
          include: { model: Division, include: Department },
        },
      });
      const dept =
        currentUser?.position?.division?.department?.name?.toLowerCase() || "";
      if (dept.includes("subbag wasintern")) isAuthorized = true;
    }

    if (!isAuthorized)
      return res
        .status(403)
        .json({ message: "Hanya SDM/Wasintern yang bisa menyetujui ini!" });

    const leaveType = await LeaveType.findByPk(leave.leaveTypeId);
    const leaveSubtype = await LeaveSubType.findByPk(leave.leaveSubTypeId);
    if (!leaveType) {
      return res.status(400).json({ message: "Jenis pengajuan tidak valid!" });
    } else if (!leaveSubtype) {
      return res
        .status(400)
        .json({ message: "Sub jenis pengajuan tidak valid!" });
    }

    // if (leave.status === "expired") {
    //   return res.status(400).json({ message: "Pengajuan sudah kedaluwarsa!" });
    // }

    const t = await db.transaction();
    try {
      //   await leave.update(
      //     {
      //       sdmStatus: "approved",
      //       sdmId: userId,
      //       sdmDecisionAt: new Date(),
      //       status: "approved",
      //     },
      //     { transaction: t },
      //   );

      // ✅ REVISI PEMBARUAN DATA (MASS UPDATE UNTUK BYPASS)
      // Siapkan prefix teks khusus jika ini adalah bypass
      //   const finalNote =
      //     role === "admin"
      //       ? `[BYPASS SYSTEM] ${decisionNote || "Disetujui oleh Admin IT"}`
      //       : decisionNote;

      // PERBAIKAN Backend 2: Gabungkan teks bypass dengan input asli admin (tidak ditimpa)
      const finalNote =
        role === "admin"
          ? `[BYPASS SYSTEM] ${decisionNote.trim()}`
          : decisionNote;

      let updatePayload = {
        sdmStatus: "approved",
        sdmId: userId,
        sdmDecisionNote: finalNote,
        sdmDecisionAt: new Date(),
        status: "approved", // Menyelesaikan alur pengajuan secara keseluruhan
      };
      // Jika Admin melakukan bypass saat status manager masih menggantung (pending)
      // Perbarui juga data manager agar tidak ada status logika yang bolong
      if (role === "admin" && leave.managerStatus === "pending") {
        updatePayload.managerStatus = "approved";
        updatePayload.managerId = userId; // Eksekutor tercatat sebagai admin IT
        updatePayload.managerDecisionNote = finalNote;
        updatePayload.managerDecisionAt = new Date();
      }
      await leave.update(updatePayload, { transaction: t });

      await UserActivity.create(
        {
          userId: leave.userId, // pengaju
          category: "leave",
          action: "approved",
          referenceId: leave.id,
          title: `Pengajuan ${leaveType.name}`,
          description:
            role === "admin"
              ? `Pengajuan Anda disetujui melalui Bypass sistem oleh Admin IT`
              : `Pengajuan ${leaveType.name} Anda disetujui oleh SDM`,
        },
        { transaction: t },
      );

      await User.update(
        { leaveStatus: "on_leave" },
        { where: { id: leave.userId }, transaction: t },
      );

      // jika pengajuan disetujui, update status cuti user menjadi "on_leave"
      const updatedLeave = await LeaveRequest.findByPk(req.params.id, {
        include: [
          {
            model: User,
            as: "user",
            attributes: [
              "id",
              "titlePrefix",
              "fullName",
              "titleSuffix",
              "nip",
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
                      { model: Department, attributes: ["id", "name"] },
                    ],
                  },
                ],
              },
            ],
          },
          { model: LeaveType, attributes: ["id", "name"] },
          { model: LeaveSubType, attributes: ["id", "name"] },
        ],
      });

      await t.commit();
      res.status(200).json({
        // message: "Pengajuan berhasil disetujui oleh SDM",
        message:
          role === "admin"
            ? "Pengajuan berhasil disetujui Bypass oleh Admin IT"
            : "Pengajuan berhasil disetujui oleh SDM",
        data: updatedLeave,
      });
    } catch (dbError) {
      await t.rollback();
      throw dbError;
    }
  } catch (e) {
    console.error("LEAVE SDM APPROVE ERROR:", e);
    res
      .status(500)
      .json({ message: "Gagal menyetujui pengajuan SDM", error: e.message });
  }
};

// export const rejectBySDM = async (req, res) => {
//   try {
//     const leave = await LeaveRequest.findByPk(req.params.id);
//     const now = dayjs().tz("Asia/Jakarta");

//     if (!leave) {
//       return res.status(404).json({ message: "Pengajuan tidak ditemukan!" });
//     }

//     const userId = req.user.id;
//     console.log("USER LOGIN:", userId);
//     console.log("SDM ID:", leave.sdmId);
//     console.log("STATUS:", leave.status);
//     console.log("Status Pengajuan Saat Ini:", leave?.status);

//     // validasi hanya role sdm yang bisa setujui
//     if (req.user.role !== "Supervisor") {
//       return res.status(403).json({
//         message:
//           "Anda tidak memiliki akses sebagai supervisor untuk pengajuan ini!",
//       });
//     }

//     const leaveType = await LeaveType.findByPk(leave.leaveTypeId);
//     const leaveSubtype = await LeaveSubType.findByPk(leave.leaveSubTypeId);
//     if (!leaveType) {
//       return res.status(400).json({
//         message: "Jenis pengajuan tidak valid!",
//       });
//     } else if (!leaveSubtype) {
//       return res.status(400).json({
//         message: "Sub jenis pengajuan tidak valid!",
//       });
//     }

//     if (leave.status === "cancelled") {
//       return res.status(400).json({
//         message: "Pengajuan sudah dibatalkan oleh pengaju!",
//       });
//     }
//     if (leave.sdmStatus !== "pending") {
//       return res.status(400).json({
//         message: "Pengajuan sudah diproses sebelumnya",
//       });
//     }

//     if (dayjs().isAfter(dayjs(leave.expiryDate))) {
//       return res
//         .status(400)
//         .json({ message: "Konfirmasi pengajuan sudah kedaluwarsa!" });
//     }
//     if (leave.status === "expired") {
//       return res.status(400).json({
//         message: "Pengajuan sudah kedaluwarsa!",
//       });
//     }

//     await leave.update({
//       sdmStatus: "rejected",
//       sdmId: req.user.id,
//       sdmDecisionAt: now.toDate(),
//       sdmDecisionNote: "...", // wajib alasan penolakan
//       status: "rejected",
//     });

//     await UserActivity.create({
//       userId: leave.userId, // pengaju
//       category: "leave",
//       action: "rejected",
//       referenceId: leave.id,
//       title: `Pengajuan ${leaveType.name}`,
//       description: `Pengajuan ${leaveType.name} Anda ditolak oleh Manager`,
//     });

//     res.status(200).json({ message: "Pengajuan berhasil ditolak oleh SDM" });
//   } catch (error) {
//     res.status(500).json({
//       message: "Gagal menolak pengajuan SDM",
//       error: error.message,
//     });
//     await t.rollback();
//     return res.status(500).json({ message: e.message });
//   }
// };

export const rejectBySDM = async (req, res) => {
  try {
    const { id } = req.params;
    const { decisionNote } = req.body;
    const userId = req.user.id;
    const userRole = req.user.role;
    const role = userRole?.toLowerCase();
    const leave = await LeaveRequest.findByPk(id);

    if (!leave) {
      return res.status(404).json({ message: "Pengajuan tidak ditemukan!" });
    }

    console.log("USER LOGIN (LEAVE REQUEST):", userId);
    console.log("SDM ID:", leave.sdmId);
    console.log("STATUS:", leave.status);
    console.log("Status Pengajuan Saat Ini:", leave?.status);

    if (!decisionNote || decisionNote.trim() === "") {
      return res.status(400).json({ message: "Alasan penolakan wajib diisi!" });
    }

    if (leave.status === "cancelled") {
      return res
        .status(400)
        .json({ message: "Pengajuan sudah dibatalkan oleh pengaju!" });
    }
    if (leave.managerStatus !== "approved" && role !== "admin") {
      return res
        .status(400)
        .json({ message: "Manager belum menyetujui pengajuan ini!" });
    }
    if (leave.sdmStatus !== "pending") {
      return res
        .status(400)
        .json({ message: "Pengajuan sudah diproses sebelumnya" });
    }

    if (dayjs().isAfter(dayjs(leave.expiryDate))) {
      return res
        .status(400)
        .json({ message: "Konfirmasi pengajuan sudah kedaluwarsa!" });
    }

    // // validasi hanya role sdm yang bisa setujui
    // if (userRole !== "Supervisor" && userRole !== "Admin") {
    //   return res.status(403).json({
    //     message:
    //       "Anda tidak memiliki akses sebagai supervisor untuk pengajuan ini!",
    //   });
    // }

    // OTORISASI SDM KHUSUS WASINTERN / ADMIN (Sama seperti Approve SDM)
    let isAuthorized = false;
    // if (["admin", "admin super"].includes(role)) {
    if (role === "admin") {
      isAuthorized = true;
    } else if (["manager", "supervisor"].includes(role)) {
      const currentUser = await User.findByPk(userId, {
        include: {
          model: Position,
          include: { model: Division, include: Department },
        },
      });
      const dept =
        currentUser?.position?.division?.department?.name?.toLowerCase() || "";
      if (dept.includes("subbag wasintern")) isAuthorized = true;
    }

    if (!isAuthorized)
      return res
        .status(403)
        .json({ message: "Hanya SDM/Wasintern yang bisa menolak ini!" });

    const leaveType = await LeaveType.findByPk(leave.leaveTypeId);
    const leaveSubtype = await LeaveSubType.findByPk(leave.leaveSubTypeId);
    if (!leaveType) {
      return res.status(400).json({ message: "Jenis pengajuan tidak valid!" });
    } else if (!leaveSubtype) {
      return res
        .status(400)
        .json({ message: "Sub jenis pengajuan tidak valid!" });
    }

    // if (leave.status === "expired") {
    //   return res.status(400).json({ message: "Pengajuan sudah kedaluwarsa!" });
    // }

    const t = await db.transaction();
    try {
      //   await leave.update(
      //     {
      //       sdmStatus: "rejected",
      //       sdmId: userId,
      //       sdmDecisionAt: new Date(),
      //       sdmDecisionNote: decisionNote,
      //       status: "rejected",
      //     },
      //     { transaction: t },
      //   );

      // PERBAIKAN: Gabungkan teks bypass dengan input alasan penolakan
      const finalNote =
        role === "admin"
          ? `[BYPASS SYSTEM] ${decisionNote.trim()}`
          : decisionNote.trim();

      // PERBAIKAN: Buat payload update serentak
      let updatePayload = {
        sdmStatus: "rejected",
        sdmId: userId,
        sdmDecisionAt: new Date(),
        sdmDecisionNote: finalNote,
        status: "rejected", // Update status utama menjadi rejected
      };

      // Jika Admin melakukan bypass saat status manager masih menggantung (pending)
      if (role === "admin" && leave.managerStatus === "pending") {
        updatePayload.managerStatus = "rejected";
        updatePayload.managerId = userId;
        updatePayload.managerDecisionNote = finalNote;
        updatePayload.managerDecisionAt = new Date();
      }
      await leave.update(updatePayload, { transaction: t });

      await UserActivity.create(
        {
          userId: leave.userId, // pengaju
          category: "leave",
          action: "rejected",
          referenceId: leave.id,
          title: `Pengajuan ${leaveType.name}`,
          //   description: `Pengajuan ${leaveType.name} Anda ditolak oleh SDM`,
          description:
            role === "admin"
              ? `Pengajuan Anda ditolak melalui Bypass sistem oleh Admin IT`
              : `Pengajuan ${leaveType.name} Anda ditolak oleh SDM`,
        },
        { transaction: t },
      );

      await t.commit();
      res.status(200).json({
        message:
          role === "admin"
            ? "Pengajuan berhasil ditolak Bypass oleh Admin IT"
            : "Pengajuan berhasil ditolak oleh SDM",
      });
    } catch (dbError) {
      await t.rollback();
      throw dbError;
    }
  } catch (e) {
    console.error("LEAVE SDM REJECT ERROR:", e);
    res.status(500).json({
      message: "Gagal menolak pengajuan SDM",
      error: e.message,
    });
  }
};
