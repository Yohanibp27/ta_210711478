import ShiftExchange from "../models/ShiftExchangeModel.js";
import User from "../models/UserModel.js";
import Position from "../models/PositionModel.js";
import Profession from "../models/ProfessionModel.js";
import ShiftAssignment from "../models/ShiftAssignmentModel.js";
import WorkShift from "../models/WorkShiftModel.js";
import { Op } from "sequelize";
import Division from "../models/DivisionModel.js";
import Department from "../models/DepartmentModel.js";
import db from "../config/Database.js";
import UserActivity from "../models/UserActivityModel.js";

import dayjs from "dayjs";
import utc from "dayjs/plugin/utc.js";
import timezone from "dayjs/plugin/timezone.js";
dayjs.extend(utc);
dayjs.extend(timezone);

/**
 * =========================
 * ADMIN SDM - Menampilkan semua pengajuan
 * =========================
 */
export const getAllShiftExchanges = async (req, res) => {
  try {
    const exchanges = await ShiftExchange.findAll({
      include: [
        {
          model: User,
          as: "requester",
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
          as: "partner",
          attributes: ["id", "titlePrefix", "fullName", "titleSuffix"],
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
          model: ShiftAssignment,
          as: "requesterShift",
          attributes: ["id", "userId", "workShiftId", "date"],
          include: [
            {
              model: WorkShift,
              as: "shiftDetail",
              attributes: ["name", "startTime", "endTime"],
            },
          ],
        },
        {
          model: ShiftAssignment,
          as: "partnerShift",
          attributes: ["id", "userId", "workShiftId", "date"],
          include: [
            {
              model: WorkShift,
              as: "shiftDetail",
              attributes: ["name", "startTime", "endTime"],
            },
          ],
        },
        {
          model: User,
          as: "manager",
          attributes: ["id", "titlePrefix", "fullName", "titleSuffix"],
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
          attributes: ["id", "titlePrefix", "fullName", "titleSuffix"],
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

    res.status(200).json({ data: exchanges });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Gagal memuat semua pertukaran shift", error });
  }
};

export const getShiftExchangeById = async (req, res) => {
  try {
    const response = await ShiftExchange.findOne({
      where: {
        id: req.params.id,
      },
      include: [
        {
          model: User,
          as: "requester",
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
          ],
        },
        {
          model: User,
          as: "partner",
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
          model: ShiftAssignment,
          as: "requesterShift",
          attributes: ["userId", "workShiftId", "date"],
          include: [
            {
              model: WorkShift,
              attributes: ["id", "name", "startTime", "endTime"],
            },
          ],
        },
        {
          model: ShiftAssignment,
          as: "partnerShift",
          attributes: ["userId", "workShiftId", "date"],
          include: [
            {
              model: WorkShift,
              attributes: ["id", "name", "startTime", "endTime"],
            },
          ],
        },
      ],
    });

    if (!response)
      return res.status(404).json({ message: "Data tidak ditemukan!" });
    res.status(200).json(response);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * =========================
 * REQUESTER
 * =========================
 */
export const requestShiftExchange = async (req, res) => {
  try {
    const { requesterShiftId, partnerShiftId, partnerId, reason } = req.body;
    const requesterId = req.user.id;

    const requesterShift = await ShiftAssignment.findOne({
      where: { id: requesterShiftId, userId: requesterId },
      include: [{ model: WorkShift }],
    });

    if (!requesterShift) {
      return res
        .status(404)
        .json({ message: "Shift pemohon tidak valid atau tidak ditemukan!" });
    }

    // VALIDASI PARTNER SHIFT WAJIB
    const partnerShift = await ShiftAssignment.findOne({
      where: { id: partnerShiftId, userId: partnerId },
      include: [{ model: WorkShift }],
    });

    if (!partnerShift) {
      return res.status(404).json({
        message: "Shift rekan tidak valid atau tidak ditemukan!",
      });
    }

    // cek apakah sudah ada request (request yang kebalik tetep masuk/ bikin error)
    // const existingRequest = await ShiftExchange.findOne({
    //   where: {
    //     requesterId,
    //     partnerId,
    //     requesterShiftId,
    //     partnerShiftId,
    //     status: ["Pending", "Approved"],
    //   },
    // });

    const existingRequest = await ShiftExchange.findOne({
      where: {
        status: { [Op.in]: ["pending", "approved"] },
        [Op.or]: [
          {
            requesterId,
            partnerId,
            requesterShiftId,
            partnerShiftId,
          },
          {
            requesterId: partnerId,
            partnerId: requesterId,
            requesterShiftId: partnerShiftId,
            partnerShiftId: requesterShiftId,
          },
        ],
      },
    });

    if (existingRequest) {
      return res.status(409).json({
        message:
          "Permintaan pertukaran shift sudah pernah diajukan dan dalam proses",
      });
    }

    // batas permintaan tukar shift di setejui oleh admin/manager/supervisor, lebih dari itu maka permintaan expired
    const expiry = new Date(requesterShift.date);
    expiry.setDate(expiry.getDate() - 1);
    expiry.setHours(18, 0, 0, 0);

    const exchange = await ShiftExchange.create({
      requesterId,
      partnerId,
      requesterShiftId,
      partnerShiftId,
      status: "pending",
      reason,
      expiryDate: expiry,
    });

    const partnerUser = await User.findByPk(partnerId);
    if (!partnerUser) {
      return res.status(404).json({
        message: "User rekan tidak ditemukan!",
      });
    }

    const partnerName = partnerUser.titlePrefix
      ? `${partnerUser.titlePrefix}. ${partnerUser.fullName}`
      : partnerUser.fullName;

    const requesterUser = await User.findByPk(requesterId);
    if (!requesterUser) {
      return res.status(404).json({
        message: "User pengaju tidak ditemukan!",
      });
    }
    const requesterName = requesterUser.titlePrefix
      ? `${requesterUser.titlePrefix}. ${requesterUser.fullName}`
      : requesterUser.fullName;

    await UserActivity.create({
      userId: requesterId,
      category: "shift_exchange",
      action: "submitted",
      referenceId: exchange.id,
      title: "Pengajuan Tukar Shift Terkirim ",
      description: `Pengajuan tukar shift dengan ${partnerName} telah dikirim`,
    });

    await UserActivity.create({
      userId: partnerId, // target orang yang diminta tukar
      category: "shift_exchange",
      action: "request_received",
      referenceId: exchange.id,
      title: "Permintaan Tukar Shift",
      description: `${requesterName} mengajukan tukar shift dengan Anda`,
    });

    res.status(201).json({
      message: "Permintaan pertukaran berhasil dibuat",
      data: exchange,
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Gagal membuat permintaan pertukaran", error });
  }
};

// BATALKAN OLEH YANG MENGAJUKAN
export const cancelShiftExchange = async (req, res) => {
  const t = await db.transaction();

  try {
    const { id } = req.params;
    const userId = req.user.id;

    const exchange = await ShiftExchange.findByPk(id);

    if (!exchange) {
      return res.status(404).json({
        success: false,
        message: "Data pertukaran tidak ditemukan!",
      });
    }

    // hanya pengaju yang boleh cancel
    if (exchange.requesterId !== userId) {
      return res.status(403).json({
        success: false,
        message: "Anda tidak memiliki akses untuk membatalkan pengajuan ini!",
      });
    }

    // hanya bisa cancel kalau masih pending
    if (exchange.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: "Pengajuan tidak dapat dibatalkan karena sudah dalam proses!",
      });
    }

    exchange.status = "cancelled";
    await exchange.save({ transaction: t });
    const partnerUser = await User.findByPk(exchange.partnerId);
    const requesterUser = await User.findByPk(exchange.requesterId);

    const partnerName = partnerUser
      ? `${partnerUser.titlePrefix ? partnerUser.titlePrefix + ". " : ""}${partnerUser.fullName}`
      : "Rekan";

    const requesterName = requesterUser
      ? `${requesterUser.titlePrefix ? requesterUser.titlePrefix + ". " : ""}${requesterUser.fullName}`
      : "Pengaju";

    await UserActivity.create(
      {
        userId: exchange.requesterId,
        category: "shift_exchange",
        action: "cancelled",
        referenceId: exchange.id,
        title: "Tukar Shift Dibatalkan",
        description: `Anda membatalkan pengajuan tukar shift dengan ${partnerName}`,
      },
      { transaction: t },
    );

    await UserActivity.create(
      {
        userId: exchange.partnerId,
        category: "shift_exchange",
        action: "cancelled",
        referenceId: exchange.id,
        title: "Tukar Shift Dibatalkan",
        description: `${requesterName} membatalkan pengajuan tukar shift dengan Anda `,
      },
      { transaction: t },
    );
    await t.commit();

    return res.status(200).json({
      success: true,
      message: "Pengajuan pertukaran shift berhasil dibatalkan",
      data: exchange,
    });
  } catch (e) {
    await t.rollback();
    console.error("CANCEL SHIFT ERROR:", e);
    return res.status(500).json({
      success: false,
      message: "Gagal membatalkan pengajuan pertukaran shift",
      error: e.message,
    });
  }
};

// tampil semua permintaan shift exchange oleh user yang login
export const getUserShiftExchanges = async (req, res) => {
  try {
    const userId = req.user.id; // user yang login
    const whereCondition =
      req.user.role === "Admin"
        ? {} // tampilkan semua
        : { [Op.or]: [{ requesterId: userId }, { partnerId: userId }] };

    const exchanges = await ShiftExchange.findAll({
      //   where: {
      //     // tampilkan yang dia request atau yang ditujukan ke dia
      //     // [Op.or]: [{ requesterId: userId }, { partnerId: userId }],
      //     where: whereCondition,
      //   },
      where: whereCondition,
      include: [
        {
          model: User,
          as: "requester",
          attributes: ["id", "titlePrefix", "fullName", "titleSuffix"],
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
          ],
        },
        {
          model: User,
          as: "partner",
          attributes: ["id", "titlePrefix", "fullName", "titleSuffix"],
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
          ],
        },
        {
          model: ShiftAssignment,
          as: "requesterShift",
          attributes: ["id", "userId", "workShiftId", "date"],
          include: [
            {
              model: WorkShift,
              as: "shiftDetail",
              attributes: ["name", "startTime", "endTime"],
            },
          ],
        },
        {
          model: ShiftAssignment,
          as: "partnerShift",
          attributes: ["id", "userId", "workShiftId", "date"],
          include: [
            {
              model: WorkShift,
              as: "shiftDetail",
              attributes: ["name", "startTime", "endTime"],
            },
          ],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    res.status(200).json({ data: exchanges });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Gagal memuat pertukaran shift", error });
  }
};

/**
 * =========================
 * PARTNER APPROVAL (partner → manager → SDM)
 * =========================
 */
export const approveByPartner = async (req, res) => {
  const t = await db.transaction();
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const exchange = await ShiftExchange.findByPk(id);

    if (!exchange) {
      return res.status(404).json({ message: "Data tidak ditemukan!" });
    } else if (exchange.partnerId !== userId) {
      return res
        .status(403)
        .json({ message: "Anda bukan partner tukar shift ini!" });
    }

    await exchange.update(
      {
        partnerStatus: "approved",
        partnerDecisionAt: new Date(),
      },
      { transaction: t },
    );

    const requesterId = exchange.requesterId;
    const requesterUser = await User.findByPk(requesterId);
    if (!requesterUser) {
      return res.status(404).json({
        message: "User pengaju tidak ditemukan!",
      });
    }
    const requesterName = requesterUser.titlePrefix
      ? `${requesterUser.titlePrefix}. ${requesterUser.fullName}`
      : requesterUser.fullName;

    await UserActivity.create(
      {
        userId: userId,
        category: "shift_exchange",
        action: "approved",
        referenceId: exchange.id,
        title: "Tukar Shift Disetujui",
        description: `Anda menyetujui permintaan tukar shift dari ${requesterName}`,
        isRead: false,
      },
      { transaction: t },
    );

    const partnerId = exchange.partnerId;
    const partnerUser = await User.findByPk(partnerId);
    if (!partnerUser) {
      return res.status(404).json({
        message: "User rekan tidak ditemukan!",
      });
    }
    const partnerName = partnerUser.titlePrefix
      ? `${partnerUser.titlePrefix}. ${partnerUser.fullName}`
      : partnerUser.fullName;

    await UserActivity.create({
      userId: exchange.requesterId,
      category: "shift_exchange",
      action: "partner_approved",
      referenceId: exchange.id,
      title: "Partner Menyetujui Tukar Shift",
      description: `${partnerName} menyetujui permintaan tukar shift`,
    });

    await t.commit();
    return res.json({
      message: "Permintaan tukar shift disetujui",
      data: exchange,
    });
  } catch (error) {
    await t.rollback();
    return res.status(500).json({ message: error.message });
  }
};

export const rejectByPartner = async (req, res) => {
  const t = await db.transaction();
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const userId = req.user.id;
    const exchange = await ShiftExchange.findByPk(id);

    if (!reason || reason.trim() === "") {
      return res.status(400).json({
        message: "Alasan penolakan wajib diisi!",
      });
    }

    if (!exchange) {
      return res.status(404).json({ message: "Data tidak ditemukan!" });
    } else if (exchange.partnerId !== userId) {
      return res
        .status(403)
        .json({ message: "Anda bukan partner tukar shift ini!" });
    }

    await exchange.update(
      {
        partnerStatus: "rejected",
        decisionNote: reason,
        status: "rejected",
        partnerDecisionAt: new Date(),
      },
      { transaction: t },
    );

    const requesterId = exchange.requesterId;
    const requesterUser = await User.findByPk(requesterId);
    if (!requesterUser) {
      return res.status(404).json({
        message: "User pengaju tidak ditemukan!",
      });
    }
    const requesterName = requesterUser.titlePrefix
      ? `${requesterUser.titlePrefix}. ${requesterUser.fullName}`
      : requesterUser.fullName;

    await UserActivity.create(
      {
        userId: userId,
        category: "shift_exchange",
        action: "rejected",
        referenceId: exchange.id,
        title: "Tukar Shift Ditolak",
        description: `Anda menolak permintaan tukar shift dari ${requesterName}`,
        isRead: false,
      },
      { transaction: t },
    );

    const partnerId = exchange.partnerId;
    const partnerUser = await User.findByPk(partnerId);
    if (!partnerUser) {
      return res.status(404).json({
        message: "User rekan tidak ditemukan!",
      });
    }

    const partnerName = partnerUser.titlePrefix
      ? `${partnerUser.titlePrefix}. ${partnerUser.fullName}`
      : partnerUser.fullName;

    await UserActivity.create({
      userId: requesterId,
      category: "shift_exchange",
      action: "request_received",
      referenceId: exchange.id,
      title: "Tukar Shift Ditolak",
      description: `${partnerName} menolak permintaan tukar shift`,
    });

    await t.commit();
    return res.json({
      message: "Permintaan tukar shift ditolak",
      data: exchange,
    });
  } catch (error) {
    await t.rollback();
    return res.status(500).json({ message: error.message });
  }
};

/**
 * =========================
 * MANAGER APPROVAL (partner → manager → SDM)
 * - Jika partner reject → manager auto reject
 * =========================
 */
export const getShiftByManager = async (req, res) => {
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
    const exchanges = await ShiftExchange.findAll({
      include: [
        {
          model: User,
          as: "requester",
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
          as: "partner",
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
        {
          model: ShiftAssignment,
          as: "requesterShift",
          attributes: ["id", "userId", "workShiftId", "date"],
          include: [
            {
              model: WorkShift,
              as: "shiftDetail",
              attributes: ["name", "startTime", "endTime"],
            },
          ],
        },
        {
          model: ShiftAssignment,
          as: "partnerShift",
          attributes: ["id", "userId", "workShiftId", "date"],
          include: [
            {
              model: WorkShift,
              as: "shiftDetail",
              attributes: ["name", "startTime", "endTime"],
            },
          ],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    // // Filter berdasarkan department (SUBBID/FUNGSI)
    // const filtered = exchanges.filter((ex) => {
    //   const dept = ex.requester?.position?.division?.department?.id;
    //   return dept === managerDept;
    // });

    let filtered = exchanges;
    // ❗ Kalo Manager bukan dari WASINTERN → filter berdasarkan department
    if (!isWasintern) {
      filtered = exchanges.filter((ex) => {
        const deptId = ex.requester?.position?.division?.department?.id;
        return deptId === managerDept;
      });
    }

    return res.status(200).json({
      message: "Berhasil menampilkan data tukar shift berdasarkan manager",
      isWasintern,
      total: filtered.length,
      data: filtered,
    });
  } catch (e) {
    console.error("GET SHIFT BY MANAGER ERROR:", e);
    res.status(500).json({
      message: "Gagal menampilkan data tukar shift berdasarkan manager",
      error: e.message,
    });
  }
};

// SEMUA ROLE MANAGER BISA APPROVED
// export const approveByManager = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { decisionNote } = req.body || {};
//     const userId = req.user.id;
//     const exchange = await ShiftExchange.findByPk(id);

//     console.log("USER LOGIN:", userId);
//     console.log("MANAGER ID:", exchange.managerId);
//     console.log("STATUS:", exchange.status);
//     console.log("PARTNER STATUS:", exchange.partnerStatus);

//     if (!exchange) {
//       return res.status(404).json({ message: "Pengajuan tidak ditemukan!" });
//     }

//     if (req.user.role !== "Manager") {
//       return res.status(403).json({
//         message: "Anda tidak memiliki akses sebagai manager!",
//       });
//     }

//     if (
//       exchange.status !== "pending" ||
//       exchange.partnerStatus !== "approved"
//     ) {
//       return res.status(400).json({
//         message: "Pengajuan belum bisa diproses oleh manager!",
//       });
//     }

//     await db.transaction(async (t) => {
//       await exchange.update(
//         {
//           managerStatus: "approved",
//           managerDecisionNote: decisionNote || null,
//           managerId: userId,
//           managerDecisionAt: new Date(),
//         },
//         { transaction: t },
//       );

//       const partnerUser = await User.findByPk(exchange.partnerId, {
//         transaction: t,
//       });
//       const partnerName = partnerUser?.titlePrefix
//         ? `${partnerUser.titlePrefix}. ${partnerUser.fullName}`
//         : partnerUser?.fullName;

//       await UserActivity.create(
//         {
//           userId: exchange.requesterId,
//           category: "shift_exchange",
//           action: "approved",
//           referenceId: exchange.id,
//           title: "Tukar Shift Disetujui",
//           description: `Permintaan tukar shift dengan ${partnerName} disetujui oleh Manager`,
//         },
//         { transaction: t },
//       );

//       const requesterUser = await User.findByPk(exchange.requesterId, {
//         transaction: t,
//       });
//       const requesterName = requesterUser?.titlePrefix
//         ? `${requesterUser.titlePrefix}. ${requesterUser.fullName}`
//         : requesterUser?.fullName;
//       await UserActivity.create(
//         {
//           userId: exchange.partnerId,
//           category: "shift_exchange",
//           action: "approved",
//           referenceId: exchange.id,
//           title: "Tukar Shift Disetujui",
//           description: `Tukar shift dengan ${requesterName} disetujui oleh Manager`,
//         },
//         { transaction: t },
//       );
//     });

//     return res.status(200).json({
//       message: "Pengajuan disetujui oleh manager",
//       data: exchange,
//     });
//   } catch (error) {
//     console.error("MANAGER APPROVE ERROR:", error);
//     return res.status(500).json({
//       message: "Gagal approve manager",
//       error: error.message,
//     });
//   }
// };

export const approveByManager = async (req, res) => {
  try {
    const { id } = req.params;
    const { decisionNote } = req.body || {};
    const userId = req.user.id;
    const userRole = req.user.role;
    const role = userRole?.toLowerCase();
    const exchange = await ShiftExchange.findByPk(id);

    if (!exchange) {
      return res.status(404).json({ message: "Pengajuan tidak ditemukan!" });
    }

    console.log("USER LOGIN (SHIFT EXCHANGE):", userId);
    console.log("MANAGER ID:", exchange.managerId);
    console.log("STATUS:", exchange.status);
    console.log("PARTNER STATUS:", exchange.partnerStatus);

    // if (userRole !== "Manager" && userRole !== "Admin") {
    //   return res
    //     .status(403)
    //     .json({ message: "Anda tidak memiliki akses sebagai manager!" });
    // }

    if (exchange.status === "cancelled") {
      return res
        .status(400)
        .json({ message: "Pengajuan sudah dibatalkan oleh pengaju!" });
    }
    if (exchange.partnerStatus !== "approved") {
      return res.status(400).json({
        message: "Rekan tukar shift belum menyetujui pertukaran ini!",
      });
    }
    if (exchange.status !== "pending") {
      return res
        .status(400)
        .json({ message: "Pengajuan sudah diproses sebelumnya!" });
    }
    if (dayjs().isAfter(dayjs(exchange.expiryDate))) {
      return res
        .status(400)
        .json({ message: "Konfirmasi pengajuan sudah kedaluwarsa!" });
    }

    // if (exchange.status === "expired") {
    //   return res.status(400).json({
    //     message: "Pengajuan sudah kedaluwarsa!",
    //   });
    // }

    // // CEK DEPARTEMEN KHUSUS UNTUK MANAGER
    // // Jika yang login adalah Admin, kita skip pengecekan ini (Bypass)
    // if (userRole === "Manager") {
    //   const manager = await User.findByPk(userId, {
    //     include: {
    //       model: Position,
    //       include: { model: Division, include: Department },
    //     },
    //   });

    //   const requester = await User.findByPk(exchange.requesterId, {
    //     include: {
    //       model: Position,
    //       include: { model: Division, include: Department },
    //     },
    //   });

    //   const managerDept = manager.position?.division?.department?.id;
    //   const requesterDept = requester.position?.division?.department?.id;
    //   if (managerDept !== requesterDept) {
    //     return res.status(403).json({
    //       message: "Anda tidak berhak memproses pengajuan dari fungsi lain!",
    //     });
    //   }
    // }

    // BLOK OTORISASI MANAGER (Mencakup Bypass Wasintern & Admin)
    let isAuthorized = false;
    // if (["admin", "admin super"].includes(role)) {
    // role Admin adalah karyawan IT, role Admin Super adalah untuk kepala rumah sakit
    if (role === "admin") {
      isAuthorized = true; // Bypass IT Admin
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
      //     isAuthorized = true; // Bypass Wasintern
      //   } else {
      //     // Jika Manager biasa, cek kesamaan departemen
      //     const requester = await User.findByPk(exchange.requesterId, {
      //       include: {
      //         model: Position,
      //         include: { model: Division, include: Department },
      //       },
      //     });
      //     const managerDept = currentUser?.position?.division?.department?.id;
      //     const requesterDept = requester?.position?.division?.department?.id;
      //     // if (managerDept === requesterDept && role === "manager")
      //     //       isAuthorized = true;

      //     if (
      //       managerDept === requesterDept &&
      //       ["manager", "supervisor"].includes(role)
      //     )
      //       isAuthorized = true;
      //   }

      // HANYA MANAGER / SUPERVISOR NON-WASINTERN YANG BISA APPROVE SESUAI DENGAN FUNGSI PENGAJU
      const currentUser = await User.findByPk(userId, {
        include: {
          model: Position,
          include: { model: Division, include: Department },
        },
      });
      const requester = await User.findByPk(exchange.requesterId, {
        include: {
          model: Position,
          include: { model: Division, include: Department },
        },
      });

      const managerDept = currentUser?.position?.division?.department?.id;
      const requesterDept = requester?.position?.division?.department?.id;

      if (managerDept && requesterDept && managerDept === requesterDept) {
        isAuthorized = true;
      }

      //   const deptName =
      //     currentUser?.position?.division?.department?.name?.toLowerCase() || "";
      //   const isWasintern = deptName.includes("subbag wasintern");
      //   const managerDept = currentUser?.position?.division?.department?.id;
      //   const requesterDept = requester?.position?.division?.department?.id;

      //   // PERBAIKAN: Manager/SPV hanya berhak jika departemennya SAMA dengan pengaju
      //   if (!isWasintern) {
      //     // Manager biasa → hanya kalau dept sama
      //     if (managerDept === requesterDept) {
      //       isAuthorized = true;
      //     }
      //   } else {
      //     // ❗ WASINTERN BOLEH APPROVE VIA MANAGER jika departemen sama dengan pengaju
      //     // (harus lewat SDM endpoint)
      //     if (managerDept === requesterDept) {
      //       // boleh akses sebagai manager
      //       isAuthorized = true;
      //     } else {
      //       // beda dept → TIDAK boleh approve sebagai manager
      //       isAuthorized = false;
      //     }
      //   }
    }

    if (!isAuthorized)
      return res
        .status(403)
        .json({ message: "Anda tidak berhak memproses pengajuan ini!" });

    const t = await db.transaction();
    try {
      await exchange.update(
        {
          managerStatus: "approved",
          managerDecisionNote: decisionNote || null,
          managerId: userId,
          managerDecisionAt: new Date(),
        },
        { transaction: t },
      );

      const partnerUser = await User.findByPk(exchange.partnerId, {
        transaction: t,
      });
      const partnerName = partnerUser?.titlePrefix
        ? `${partnerUser.titlePrefix}. ${partnerUser.fullName}`
        : partnerUser?.fullName;

      await UserActivity.create(
        {
          userId: exchange.requesterId,
          category: "shift_exchange",
          action: "approved",
          referenceId: exchange.id,
          title: "Tukar Shift Disetujui",
          description: `Permintaan tukar shift dengan ${partnerName} disetujui oleh Manager`,
        },
        { transaction: t },
      );

      const requesterUser = await User.findByPk(exchange.requesterId, {
        transaction: t,
      });
      const requesterName = requesterUser?.titlePrefix
        ? `${requesterUser.titlePrefix}. ${requesterUser.fullName}`
        : requesterUser?.fullName;

      await UserActivity.create(
        {
          userId: exchange.partnerId,
          category: "shift_exchange",
          action: "approved",
          referenceId: exchange.id,
          title: "Tukar Shift Disetujui",
          description: `Tukar shift dengan ${requesterName} disetujui oleh Manager`,
        },
        { transaction: t },
      );

      await t.commit();
      return res.status(200).json({
        message: "Pengajuan berhasil disetujui oleh manager",
        data: exchange,
      });
    } catch (dbError) {
      await t.rollback();
      throw dbError;
    }
  } catch (e) {
    console.error("MANAGER APPROVE ERROR:", e);
    return res
      .status(500)
      .json({ message: "Gagal approve manager", error: e.message });
  }
};

// SEMUA ROLE MANAGER BISA REJECTED
// export const rejectByManager = async (req, res) => {
//   const t = await db.transaction();
//   try {
//     const { id } = req.params;
//     const { decisionNote } = req.body;
//     const userId = req.user.id;
//     const exchange = await ShiftExchange.findByPk(id);

//     if (!decisionNote || decisionNote.trim() === "") {
//       return res.status(400).json({
//         message: "Alasan penolakan wajib diisi!",
//       });
//     }

//     if (!exchange) {
//       return res.status(404).json({ message: "Data tidak ditemukan!" });
//     }
//     if (req.user.role !== "Manager") {
//       return res.status(403).json({
//         message: "Anda tidak memiliki akses sebagai manager!",
//       });
//     }
//     if (exchange.status !== "pending") {
//       return res.status(400).json({
//         message: "Pengajuan sudah diproses sebelumnya!",
//       });
//     }
//     if (
//       exchange.status !== "pending" ||
//       exchange.partnerStatus !== "approved"
//     ) {
//       return res.status(400).json({
//         message: "Pengajuan belum bisa diproses oleh manager!",
//       });
//     }

//     await exchange.update(
//       {
//         managerStatus: "rejected",
//         managerDecisionNote: decisionNote,
//         managerDecisionAt: new Date(),
//         managerId: userId,
//         status: "rejected",
//       },
//       { transaction: t },
//     );

//     const partnerUser = await User.findByPk(exchange.partnerId);
//     const partnerName = partnerUser.titlePrefix
//       ? `${partnerUser.titlePrefix}. ${partnerUser.fullName}`
//       : partnerUser.fullName;
//     await UserActivity.create(
//       {
//         userId: exchange.requesterId, // pengaju
//         category: "shift_exchange",
//         action: "rejected",
//         referenceId: exchange.id,
//         title: "Tukar shift Ditolak",
//         description: `Permintaan tukar shift dengan ${partnerName} ditolak oleh Manager`,
//       },
//       { transaction: t },
//     );

//     const requesterUser = await User.findByPk(exchange.requesterId);
//     const requesterName = requesterUser.titlePrefix
//       ? `${requesterUser.titlePrefix}. ${requesterUser.fullName}`
//       : requesterUser.fullName;
//     await UserActivity.create({
//       userId: exchange.partnerId, // rekan
//       category: "shift_exchange",
//       action: "rejected",
//       referenceId: exchange.id,
//       title: "Tukar Shift Ditolak",
//       description: `Tukar shift dengan ${requesterName} ditolak oleh Manager`,
//     });

//     await t.commit();
//     return res.status(200).json({
//       message: "Pengajuan ditolak oleh manager",
//       data: exchange,
//     });
//   } catch (error) {
//     await t.rollback();
//     return res.status(500).json({ message: error.message });
//   }
// };

export const rejectByManager = async (req, res) => {
  try {
    const { id } = req.params;
    const { decisionNote } = req.body;
    const userId = req.user.id;
    const userRole = req.user.role;
    const role = userRole?.toLowerCase();
    const exchange = await ShiftExchange.findByPk(id);

    if (!exchange) {
      return res.status(404).json({ message: "Pengajuan tidak ditemukan!" });
    }

    console.log("USER LOGIN (SHIFT EXCHANGE):", userId);
    console.log("MANAGER ID:", exchange.managerId);
    console.log("STATUS:", exchange.status);
    console.log("PARTNER STATUS:", exchange.partnerStatus);

    // if (userRole !== "Manager" && userRole !== "Admin") {
    //   return res
    //     .status(403)
    //     .json({ message: "Anda tidak memiliki akses sebagai manager!" });
    // }

    if (!decisionNote || decisionNote.trim() === "") {
      return res.status(400).json({ message: "Alasan penolakan wajib diisi!" });
    }

    if (exchange.status === "cancelled") {
      return res
        .status(400)
        .json({ message: "Pengajuan sudah dibatalkan oleh pengaju!" });
    }
    if (exchange.partnerStatus !== "approved") {
      return res.status(400).json({
        message: "Rekan tukar shift belum menyetujui! pertukaran ini",
      });
    }
    if (exchange.status !== "pending") {
      return res
        .status(400)
        .json({ message: "Pengajuan sudah diproses sebelumnya!" });
    }
    if (dayjs().isAfter(dayjs(exchange.expiryDate))) {
      return res
        .status(400)
        .json({ message: "Konfirmasi pengajuan sudah kedaluwarsa!" });
    }

    // if (exchange.status === "expired") {
    //   return res.status(400).json({ message: "Pengajuan sudah kedaluwarsa!" });
    // }

    // // CEK DEPARTEMEN KHUSUS UNTUK MANAGER
    // // Jika yang login adalah Admin, kita skip pengecekan ini (Bypass)
    // if (userRole === "Manager") {
    //   const manager = await User.findByPk(userId, {
    //     include: {
    //       model: Position,
    //       include: { model: Division, include: Department },
    //     },
    //   });

    //   const requester = await User.findByPk(exchange.requesterId, {
    //     include: {
    //       model: Position,
    //       include: { model: Division, include: Department },
    //     },
    //   });

    //   const managerDept = manager.position?.division?.department?.id;
    //   const requesterDept = requester.position?.division?.department?.id;
    //   if (managerDept !== requesterDept) {
    //     return res.status(403).json({
    //       message: "Anda tidak berhak memproses pengajuan dari fungsi lain!",
    //     });
    //   }
    // }

    // BLOK OTORISASI MANAGER (Sama seperti approve)
    let isAuthorized = false;
    // if (["admin", "admin super"].includes(role)) {
    if (role === "admin") {
      isAuthorized = true;
    } else if (["manager", "supervisor"].includes(role)) {
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
      //     const requester = await User.findByPk(exchange.requesterId, {
      //       include: {
      //         model: Position,
      //         include: { model: Division, include: Department },
      //       },
      //     });
      //     // if (
      //     //   currentUser?.position?.division?.department?.id ===
      //     //     requester?.position?.division?.department?.id &&
      //     //   role === "manager"
      //     // ) {
      //     //   isAuthorized = true;
      //     // }
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
      const requester = await User.findByPk(exchange.requesterId, {
        include: {
          model: Position,
          include: { model: Division, include: Department },
        },
      });

      const managerDept = currentUser?.position?.division?.department?.id;
      const requesterDept = requester?.position?.division?.department?.id;

      if (managerDept && requesterDept && managerDept === requesterDept) {
        isAuthorized = true;
      }

      //   const deptName =
      //     currentUser?.position?.division?.department?.name?.toLowerCase() || "";
      //   const isWasintern = deptName.includes("subbag wasintern");
      //   const managerDept = currentUser?.position?.division?.department?.id;
      //   const requesterDept = requester?.position?.division?.department?.id;

      //   // PERBAIKAN: Manager/SPV hanya berhak jika departemennya SAMA dengan pengaju
      //   if (!isWasintern) {
      //     // Manager biasa → hanya kalau dept sama
      //     if (managerDept === requesterDept) {
      //       isAuthorized = true;
      //     }
      //   } else {
      //     // ❗ WASINTERN TIDAK BOLEH APPROVE VIA MANAGER
      //     // (harus lewat SDM endpoint)
      //     if (managerDept === requesterDept) {
      //       // boleh akses sebagai manager
      //       isAuthorized = true;
      //     } else {
      //       // beda dept → TIDAK boleh approve sebagai manager
      //       isAuthorized = false;
      //     }
      //   }
    }

    if (!isAuthorized)
      return res
        .status(403)
        .json({ message: "Anda tidak berhak menolak pengajuan ini!" });

    const t = await db.transaction();
    try {
      await exchange.update(
        {
          managerStatus: "rejected",
          managerDecisionNote: decisionNote,
          managerDecisionAt: new Date(),
          managerId: userId,
          status: "rejected",
        },
        { transaction: t },
      );

      const partnerUser = await User.findByPk(exchange.partnerId, {
        transaction: t,
      });
      const partnerName = partnerUser.titlePrefix
        ? `${partnerUser.titlePrefix}. ${partnerUser.fullName}`
        : partnerUser.fullName;

      await UserActivity.create(
        {
          userId: exchange.requesterId, // pengaju
          category: "shift_exchange",
          action: "rejected",
          referenceId: exchange.id,
          title: "Tukar shift Ditolak",
          description: `Permintaan tukar shift dengan ${partnerName} ditolak oleh Manager`,
        },
        { transaction: t },
      );

      const requesterUser = await User.findByPk(exchange.requesterId, {
        transaction: t,
      });
      const requesterName = requesterUser.titlePrefix
        ? `${requesterUser.titlePrefix}. ${requesterUser.fullName}`
        : requesterUser.fullName;

      await UserActivity.create(
        {
          userId: exchange.partnerId, // rekan
          category: "shift_exchange",
          action: "rejected",
          referenceId: exchange.id,
          title: "Tukar Shift Ditolak",
          description: `Tukar shift dengan ${requesterName} ditolak oleh Manager`,
        },
        { transaction: t },
      );
      await t.commit();
      return res.status(200).json({
        message: "Pengajuan berhasil ditolak oleh manager",
        data: exchange,
      });
    } catch (dbError) {
      await t.rollback();
      throw dbError;
    }
  } catch (e) {
    console.error("MANAGER REJECT ERROR:", e);
    return res
      .status(500)
      .json({ message: "Gagal reject manager", error: e.message });
  }
};

/**
 * =========================
 * SDM APPROVAL (FINAL) (partner → manager → SDM)
 * =========================
 * - Jika parner & manager approved → SDM bisa approved/rejected
 * - Jika partner reject → manager dan SDM auto reject
 * - Jika manager reject → SDM auto reject
 * - Jika manager tidak ada respon → SDM bisa approve langsung (salah)
 */
// export const approveBySDM = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { decisionNote } = req.body || {};
//     const userId = req.user.id;
//     const userRole = req.user.role;
//     const role = userRole?.toLowerCase();
//     const exchange = await ShiftExchange.findByPk(id);

//     console.log("USER LOGIN:", userId);
//     console.log("SDM ID:", exchange.sdmId);
//     console.log("STATUS:", exchange.status);
//     console.log("PARTNER:", exchange.partnerStatus);
//     console.log("MANAGER:", exchange.managerStatus);

//     if (!exchange) {
//       return res.status(404).json({ message: "Pengajuan tidak ditemukan!" });
//     }

//     // VALIDASI ROLE
//     let isAuthorized = false;
//     if (["admin", "supervisor", "admin super"].includes(role)) {
//       isAuthorized = true;
//     } else if (role === "manager") {
//       const currentUser = await User.findByPk(userId, {
//         include: {
//           model: Position,
//           include: {
//             model: Division,
//             include: Department,
//           },
//         },
//       });

//       const deptRaw = currentUser?.position?.division?.department?.name || "";
//       const dept = deptRaw.toLowerCase();
//       const isWasinternManager = dept.includes("subbag wasintern");
//       console.log("DEPT RAW:", deptRaw);
//       console.log("DEPT NORMALIZED:", dept);
//       console.log("IS WASINTERN:", isWasinternManager);

//       if (isWasinternManager) {
//         isAuthorized = true;
//       }
//     }

//     if (!isAuthorized) {
//       return res.status(403).json({
//         message: "Anda tidak memiliki akses sebagai SDM untuk approval ini!",
//       });
//     }

//     // VALIDASI STATUS
//     if (exchange.partnerStatus !== "approved") {
//       return res.status(400).json({ message: "Partner belum menyetujui!" });
//     }

//     if (exchange.managerStatus !== "approved") {
//       return res.status(400).json({ message: "Manager belum menyetujui!" });
//     }

//     if (exchange.status !== "pending") {
//       return res
//         .status(400)
//         .json({ message: "Pengajuan Sudah diproses sebelumnya!" });
//     }

//     // TRANSACTION HANYA UNTUK PROSES KRITIS
//     await db.transaction(async (t) => {
//       const requesterShift = await ShiftAssignment.findByPk(
//         exchange.requesterShiftId,
//         { transaction: t },
//       );

//       const partnerShift = await ShiftAssignment.findByPk(
//         exchange.partnerShiftId,
//         { transaction: t },
//       );

//       if (!requesterShift || !partnerShift) {
//         throw new Error("Data Shift tidak ditemukan!");
//       }

//       // swap
//       const temp = requesterShift.userId;
//       requesterShift.userId = partnerShift.userId;
//       partnerShift.userId = temp;

//       await requesterShift.save({ transaction: t });
//       await partnerShift.save({ transaction: t });
//       await exchange.update(
//         {
//           sdmStatus: "approved",
//           sdmDecisionNote: decisionNote || null,
//           sdmDecisionAt: new Date(),
//           sdmId: userId,
//           status: "approved",
//         },
//         { transaction: t },
//       );

//       const partnerUser = await User.findByPk(exchange.partnerId);
//       const partnerName = partnerUser.titlePrefix
//         ? `${partnerUser.titlePrefix}. ${partnerUser.fullName}`
//         : partnerUser.fullName;
//       await UserActivity.create(
//         {
//           userId: exchange.requesterId, // pengaju
//           category: "shift_exchange",
//           action: "approved",
//           referenceId: exchange.id,
//           title: "Tukar Shift Disetujui",
//           description: `Permintaan tukar shift dengan ${partnerName} disetujui oleh SDM`,
//         },
//         { transaction: t },
//       );

//       const requesterUser = await User.findByPk(exchange.requesterId);
//       const requesterName = requesterUser.titlePrefix
//         ? `${requesterUser.titlePrefix}. ${requesterUser.fullName}`
//         : requesterUser.fullName;
//       await UserActivity.create(
//         {
//           userId: exchange.partnerId, // partner
//           category: "shift_exchange",
//           action: "approved",
//           referenceId: exchange.id,
//           title: "Tukar Shift Disetujui",
//           description: `Tukar shift dengan ${requesterName} disetujui oleh SDM`,
//         },
//         { transaction: t },
//       );
//     });

//     // RE-FETCH DATA TERBARU UNTUK DIKIRIM KE FRONTEND
//     await exchange.reload();
//     return res.status(200).json({
//       message:
//         "Pertukaran shift berhasil disetujui dan jadwal shift telah diperbarui",
//       data: exchange,
//     });
//   } catch (error) {
//     console.error("SDM ERROR:", error);
//     return res.status(500).json({
//       message: "Gagal memproses persetujuan pertukaran shift",
//       error: error.message,
//     });
//   }
// };

export const approveBySDM = async (req, res) => {
  try {
    const { id } = req.params;
    const { decisionNote } = req.body || {};
    const userId = req.user.id;
    const userRole = req.user.role;
    const role = userRole?.toLowerCase();
    const exchange = await ShiftExchange.findByPk(id);

    if (!exchange) {
      return res.status(404).json({ message: "Pengajuan tidak ditemukan!" });
    }

    console.log("USER LOGIN (SHIFT EXCHANGE):", userId);
    console.log("SDM ID:", exchange.sdmId);
    console.log("STATUS:", exchange.status);
    console.log("PARTNER:", exchange.partnerStatus);
    console.log("MANAGER:", exchange.managerStatus);

    if (role === "admin" && (!decisionNote || decisionNote.trim() === "")) {
      return res.status(400).json({
        message:
          "Gagal memproses. Admin IT wajib menyertakan catatan alasan melakukan bypass sistem!",
      });
    }

    if (exchange.status === "cancelled") {
      return res
        .status(400)
        .json({ message: "Pengajuan sudah dibatalkan oleh pengaju!" });
    }
    // Validasi Mutlak: Bypass Admin tidak berlaku jika Partner belum setuju
    if (exchange.partnerStatus !== "approved") {
      return res.status(400).json({
        message: "Rekan tukar shift belum menyetujui pertukaran ini!",
      });
    }
    if (exchange.managerStatus !== "approved" && role !== "admin") {
      return res
        .status(400)
        .json({ message: "Manager belum menyetujui pengajuan ini!" });
    }
    if (exchange.status !== "pending") {
      return res
        .status(400)
        .json({ message: "Pengajuan Sudah diproses sebelumnya!" });
    }
    if (dayjs().isAfter(dayjs(exchange.expiryDate))) {
      return res
        .status(400)
        .json({ message: "Konfirmasi pengajuan sudah kedaluwarsa!" });
    }

    // VALIDASI ROLE
    // BLOK OTORISASI SDM (Hanya Admin atau Wasintern)
    let isAuthorized = false;
    // if (["admin", "supervisor", "admin super"].includes(role)) {
    //   isAuthorized = true;
    // } else if (role === "manager") {
    //   const currentUser = await User.findByPk(userId, {
    //     include: {
    //       model: Position,
    //       include: { model: Division, include: Department },
    //     },
    //   });

    //   const deptRaw = currentUser?.position?.division?.department?.name || "";
    //   const dept = deptRaw.toLowerCase();
    //   const isWasinternManager = dept.includes("subbag wasintern");
    //   console.log("DEPT RAW:", deptRaw);
    //   console.log("DEPT NORMALIZED:", dept);
    //   console.log("IS WASINTERN:", isWasinternManager);

    //   if (isWasinternManager) {
    //     isAuthorized = true;
    //   }
    // }

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
      const deptName =
        currentUser?.position?.division?.department?.name?.toLowerCase() || "";
      if (deptName.includes("subbag wasintern")) isAuthorized = true;
    }

    if (!isAuthorized) {
      return res.status(403).json({
        message: "Anda tidak memiliki akses sebagai SDM untuk pengajuan ini!",
      });
    }

    const t = await db.transaction();
    try {
      const requesterShift = await ShiftAssignment.findByPk(
        exchange.requesterShiftId,
        { transaction: t },
      );
      const partnerShift = await ShiftAssignment.findByPk(
        exchange.partnerShiftId,
        { transaction: t },
      );

      if (!requesterShift || !partnerShift) {
        throw new Error("Data Shift tidak ditemukan!");
      }

      // logika SWAP shift
      const temp = requesterShift.userId;
      requesterShift.userId = partnerShift.userId;
      partnerShift.userId = temp;

      await requesterShift.save({ transaction: t });
      await partnerShift.save({ transaction: t });

      // Injeksi label Bypass pada catatan
      const finalNote =
        role === "admin"
          ? `[BYPASS SYSTEM] ${decisionNote.trim()}`
          : decisionNote;

      //   await exchange.update(
      //     {
      //       sdmStatus: "approved",
      //       sdmDecisionNote: finalNote || null,
      //       sdmDecisionAt: new Date(),
      //       sdmId: userId,
      //       status: "approved",
      //     },
      //     { transaction: t },
      //   );

      let updatePayload = {
        sdmStatus: "approved",
        sdmDecisionNote: finalNote || null,
        sdmDecisionAt: new Date(),
        sdmId: userId,
        status: "approved",
      };

      // Sinkronisasi Manager Status jika di-bypass saat pending
      if (role === "admin" && exchange.managerStatus === "pending") {
        updatePayload.managerStatus = "approved";
        updatePayload.managerId = userId;
        updatePayload.managerDecisionNote = finalNote;
        updatePayload.managerDecisionAt = new Date();
      }
      await exchange.update(updatePayload, { transaction: t });

      const partnerUser = await User.findByPk(exchange.partnerId, {
        transaction: t,
      });
      const partnerName = partnerUser.titlePrefix
        ? `${partnerUser.titlePrefix}. ${partnerUser.fullName}`
        : partnerUser.fullName;

      await UserActivity.create(
        {
          userId: exchange.requesterId, // pengaju
          category: "shift_exchange",
          action: "approved",
          referenceId: exchange.id,
          title: "Tukar Shift Disetujui",
          description:
            role === "admin"
              ? `Permintaan tukar shift disetujui melalui Bypass sistem oleh Admin IT`
              : `Permintaan tukar shift dengan ${partnerName} disetujui oleh SDM`,
        },
        { transaction: t },
      );

      const requesterUser = await User.findByPk(exchange.requesterId, {
        transaction: t,
      });
      const requesterName = requesterUser.titlePrefix
        ? `${requesterUser.titlePrefix}. ${requesterUser.fullName}`
        : requesterUser.fullName;

      await UserActivity.create(
        {
          userId: exchange.partnerId, // partner
          category: "shift_exchange",
          action: "approved",
          referenceId: exchange.id,
          title: "Tukar Shift Disetujui",
          description:
            role === "admin"
              ? `Pertukaran shift disetujui melalui Bypass sistem oleh Admin IT`
              : `Pertukaran shift dengan ${requesterName} disetujui oleh SDM`,
        },
        { transaction: t },
      );

      await t.commit();
      await exchange.reload();
      return res.status(200).json({
        message:
          role === "admin"
            ? "Pertukaran shift berhasil disetujui melalui Bypass sistem oleh Admin IT"
            : "Pertukaran shift berhasil disetujui dan jadwal shift telah diperbarui",
        data: exchange,
      });
    } catch (dbError) {
      await t.rollback();
      throw dbError;
    }
  } catch (e) {
    console.error("SDM ERROR:", e);
    return res.status(500).json({
      message: "Gagal memproses persetujuan pertukaran shift",
      error: e.message,
    });
  }
};

// export const rejectBySDM = async (req, res) => {
//   const t = await db.transaction();
//   try {
//     const { id } = req.params;
//     const { decisionNote } = req.body || {};
//     const userId = req.user.id;
//     const userRole = req.user.role;
//     const role = userRole?.toLowerCase();
//     const exchange = await ShiftExchange.findByPk(id);

//     console.log("USER LOGIN:", userId);
//     console.log("SDM ID:", exchange.sdmId);
//     console.log("STATUS:", exchange.status);
//     console.log("PARTNER:", exchange.partnerStatus);
//     console.log("MANAGER:", exchange.managerStatus);

//     // VALIDASI NOTE DI AWAL
//     if (!decisionNote || decisionNote.trim() === "") {
//       await t.rollback();
//       return res.status(400).json({
//         message: "Alasan penolakan wajib diisi!",
//       });
//     }
//     if (!exchange) {
//       await t.rollback();
//       return res.status(404).json({
//         message: "Pengajuan tidak ditemukan!",
//       });
//     }

//     // VALIDASI ROLE
//     let isAuthorized = false;
//     if (["admin", "supervisor", "admin super"].includes(role)) {
//       isAuthorized = true;
//     } else if (role === "manager") {
//       const currentUser = await User.findByPk(userId, {
//         include: {
//           model: Position,
//           include: {
//             model: Division,
//             include: Department,
//           },
//         },
//       });

//       const deptRaw = currentUser?.position?.division?.department?.name || "";
//       const dept = deptRaw.toLowerCase();
//       const isWasinternManager = dept.includes("subbag wasintern");
//       console.log("DEPT RAW:", deptRaw);
//       console.log("DEPT NORMALIZED:", dept);
//       console.log("IS WASINTERN:", isWasinternManager);

//       if (isWasinternManager) {
//         isAuthorized = true;
//       }
//     }

//     if (!isAuthorized) {
//       await t.rollback();
//       return res.status(403).json({
//         message: "Anda tidak memiliki akses sebagai SDM untuk approval ini!",
//       });
//     }

//     // VALIDASI STATUS
//     if (exchange.partnerStatus !== "approved") {
//       await t.rollback();
//       return res.status(400).json({ message: "Partner belum approve!" });
//     }

//     if (exchange.managerStatus !== "approved") {
//       await t.rollback();
//       return res.status(400).json({ message: "Manager belum approve!" });
//     }

//     if (exchange.status !== "pending") {
//       await t.rollback();
//       return res.status(400).json({ message: "Sudah diproses!" });
//     }

//     // UPDATE
//     await exchange.update(
//       {
//         sdmStatus: "rejected",
//         sdmDecisionNote: decisionNote,
//         sdmDecisionAt: new Date(),
//         sdmId: userId,
//         status: "rejected",
//       },
//       { transaction: t },
//     );

//     const partnerUser = await User.findByPk(exchange.partnerId);
//     if (!partnerUser) {
//       return res.status(404).json({
//         message: "User rekan tidak ditemukan!",
//       });
//     }
//     const partnerName = partnerUser.titlePrefix
//       ? `${partnerUser.titlePrefix}. ${partnerUser.fullName}`
//       : partnerUser.fullName;
//     await UserActivity.create(
//       {
//         userId: exchange.requesterId, // pengaju
//         category: "shift_exchange",
//         action: "rejected",
//         referenceId: exchange.id,
//         title: "Tukar Shift Ditolak",
//         description: `Permintaan tukar shift dengan ${partnerName} ditolak oleh SDM`,
//       },
//       { transaction: t },
//     );

//     const requesterUser = await User.findByPk(exchange.requesterId);
//     if (!requesterUser) {
//       return res.status(404).json({
//         message: "User pengaju tidak ditemukan!",
//       });
//     }
//     const requesterName = requesterUser.titlePrefix
//       ? `${requesterUser.titlePrefix}. ${requesterUser.fullName}`
//       : requesterUser.fullName;
//     await UserActivity.create(
//       {
//         userId: exchange.partnerId, // rekan
//         category: "shift_exchange",
//         action: "rejected",
//         referenceId: exchange.id,
//         title: "Tukar Shift Ditolak",
//         description: `Tukar shift dengan ${requesterName} ditolak oleh SDM`,
//       },
//       { transaction: t },
//     );
//     await t.commit();

//     // RE-FETCH DATA TERBARU UNTUK DIKIRIM KE FRONTEND
//     await exchange.reload();
//     return res.status(200).json({
//       message: "Pengajuan shift berhasil ditolak oleh SDM",
//       data: exchange,
//     });
//   } catch (error) {
//     await t.rollback();
//     console.error(error);
//     return res.status(500).json({
//       message: "Gagal memproses penolakan pertukaran shift",
//       error: error.message,
//     });
//   }
// };

export const rejectBySDM = async (req, res) => {
  try {
    const { id } = req.params;
    const { decisionNote } = req.body || {};
    const userId = req.user.id;
    const userRole = req.user.role;
    const role = userRole?.toLowerCase();
    const exchange = await ShiftExchange.findByPk(id);

    if (!exchange) {
      return res.status(404).json({ message: "Pengajuan tidak ditemukan!" });
    }

    console.log("USER LOGIN (SHIFT EXCHANGE):", userId);
    console.log("SDM ID:", exchange.sdmId);
    console.log("STATUS:", exchange.status);
    console.log("PARTNER:", exchange.partnerStatus);
    console.log("MANAGER:", exchange.managerStatus);

    if (!decisionNote || decisionNote.trim() === "") {
      return res.status(400).json({ message: "Alasan penolakan wajib diisi!" });
    }

    if (exchange.status === "cancelled") {
      return res
        .status(400)
        .json({ message: "Pengajuan sudah dibatalkan oleh pengaju!" });
    }
    // Validasi mutlak: Ditolak di SDM berarti Partner sudah setuju sebelumnya
    if (exchange.partnerStatus !== "approved") {
      return res.status(400).json({
        message: "Rekan tukar shift belum menyetujui pertukaran ini!",
      });
    }
    if (exchange.managerStatus !== "approved" && role !== "admin") {
      return res
        .status(400)
        .json({ message: "Manager belum menyetujui pengajuan ini!" });
    }
    if (exchange.status !== "pending") {
      return res
        .status(400)
        .json({ message: "Pengajuan sudah diproses sebelumnya!" });
    }
    if (dayjs().isAfter(dayjs(exchange.expiryDate))) {
      return res
        .status(400)
        .json({ message: "Konfirmasi pengajuan sudah kedaluwarsa!" });
    }

    // VALIDASI ROLE
    // BLOK OTORISASI SDM (Sama seperti approve SDM)
    let isAuthorized = false;
    // if (["admin", "supervisor", "admin super"].includes(role)) {
    //   isAuthorized = true;
    // } else if (role === "manager") {
    //   const currentUser = await User.findByPk(userId, {
    //     include: {
    //       model: Position,
    //       include: { model: Division, include: Department },
    //     },
    //   });

    //   const deptRaw = currentUser?.position?.division?.department?.name || "";
    //   const dept = deptRaw.toLowerCase();
    //   const isWasinternManager = dept.includes("subbag wasintern");
    //   console.log("DEPT RAW:", deptRaw);
    //   console.log("DEPT NORMALIZED:", dept);
    //   console.log("IS WASINTERN:", isWasinternManager);

    //   if (isWasinternManager) {
    //     isAuthorized = true;
    //   }
    // }

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
      const deptName =
        currentUser?.position?.division?.department?.name?.toLowerCase() || "";
      if (deptName.includes("subbag wasintern")) isAuthorized = true;
    }

    if (!isAuthorized) {
      return res.status(403).json({
        message: "Anda tidak memiliki akses sebagai SDM untuk approval ini!",
      });
    }

    const t = await db.transaction();
    try {
      //   await exchange.update(
      //     {
      //       sdmStatus: "rejected",
      //       sdmDecisionNote: decisionNote,
      //       sdmDecisionAt: new Date(),
      //       sdmId: userId,
      //       status: "rejected",
      //     },
      //     { transaction: t },
      //   );

      const finalNote =
        role === "admin"
          ? `[BYPASS SYSTEM] ${decisionNote.trim()}`
          : decisionNote.trim();

      let updatePayload = {
        sdmStatus: "rejected",
        sdmDecisionNote: finalNote,
        sdmDecisionAt: new Date(),
        sdmId: userId,
        status: "rejected",
      };

      // Sinkronisasi status manager jika di-bypass saat masih pending
      if (role === "admin" && exchange.managerStatus === "pending") {
        updatePayload.managerStatus = "rejected";
        updatePayload.managerId = userId;
        updatePayload.managerDecisionNote = finalNote;
        updatePayload.managerDecisionAt = new Date();
      }
      await exchange.update(updatePayload, { transaction: t });

      const partnerUser = await User.findByPk(exchange.partnerId, {
        transaction: t,
      });
      const partnerName = partnerUser.titlePrefix
        ? `${partnerUser.titlePrefix}. ${partnerUser.fullName}`
        : partnerUser.fullName;

      await UserActivity.create(
        {
          userId: exchange.requesterId, // pengaju
          category: "shift_exchange",
          action: "rejected",
          referenceId: exchange.id,
          title: "Tukar Shift Ditolak",
          description:
            role === "admin"
              ? `Permintaan tukar shift ditolak melalui Bypass sistem oleh Admin IT`
              : `Permintaan tukar shift dengan ${partnerName} ditolak oleh SDM`,
        },
        { transaction: t },
      );

      const requesterUser = await User.findByPk(exchange.requesterId, {
        transaction: t,
      });
      const requesterName = requesterUser.titlePrefix
        ? `${requesterUser.titlePrefix}. ${requesterUser.fullName}`
        : requesterUser.fullName;

      await UserActivity.create(
        {
          userId: exchange.partnerId, // rekan
          category: "shift_exchange",
          action: "rejected",
          referenceId: exchange.id,
          title: "Tukar Shift Ditolak",
          description:
            role === "admin"
              ? `Permintaan tukar shift ditolak melalui Bypass sistem oleh Admin IT`
              : `Tukar shift dengan ${requesterName} ditolak oleh SDM`,
        },
        { transaction: t },
      );

      await t.commit();
      await exchange.reload();
      return res.status(200).json({
        message:
          role === "admin"
            ? "Pengajuan shift berhasil ditolak melalui Bypass sistem oleh Admin IT"
            : "Pengajuan shift berhasil ditolak oleh SDM",
        data: exchange,
      });
    } catch (dbError) {
      await t.rollback();
      throw dbError;
    }
  } catch (e) {
    console.error(e);
    return res.status(500).json({
      message: "Gagal memproses penolakan pertukaran shift",
      error: e.message,
    });
  }
};

// BATAS LOGIKA YANG TIDAK DIPAKAI ADA DIBAWAH
// export const approveShiftExchange = async (req, res) => {
//   const t = await db.transaction();
//   try {
//     const { id } = req.params;
//     const { decisionNote } = req.body;
//     const approvedBy = req.user.id;

//     // 1️⃣ Ambil data pertukaran
//     const exchange = await ShiftExchange.findByPk(id, {
//       transaction: t,
//     });
//     if (!exchange) {
//       await t.rollback();
//       return res
//         .status(404)
//         .json({ message: "Data pertukaran tidak ditemukan" });
//     }

//     if (exchange.status !== "pending") {
//       await t.rollback();
//       return res.status(400).json({
//         message: "Pertukaran sudah diproses sebelumnya",
//       });
//     }

//     const requesterShift = await ShiftAssignment.findByPk(
//       exchange.requesterShiftId,
//       { transaction: t },
//     );
//     const partnerShift = await ShiftAssignment.findByPk(
//       exchange.partnerShiftId,
//       { transaction: t },
//     );

//     if (!requesterShift || !partnerShift) {
//       await t.rollback();
//       return res.status(404).json({
//         message: "Shift tidak ditemukan",
//       });
//     }

//     // 3️⃣ Tukar userId antar shift
//     const tempUserId = requesterShift.userId;
//     requesterShift.userId = partnerShift.userId;
//     partnerShift.userId = tempUserId;

//     await requesterShift.save({ transaction: t });
//     await partnerShift.save({ transaction: t });

//     // 4️⃣ Update status pertukaran
//     exchange.status = "Disetujui";
//     exchange.approvedBy = approvedBy;
//     exchange.decisionNote = decisionNote || null;
//     await exchange.save({ transaction: t });

//     await t.commit();

//     // aktivitas untuk admin yang menyetujui
//     await UserActivity.create({
//       userId: approvedBy,
//       //   type: "shift_approved",
//       category: "shift_exchange",
//       action: "approved",
//       referenceId: exchange.id,
//       title: "Tukar Shift Disetujui",
//       //   description: `Pengajuan tukar shift dengan dr. Sarah telah disetujui ${exchange.id}`,
//     });

//     // aktivitas untuk requester (notifikasi aktivitas)
//     await UserActivity.create({
//       userId: exchange.requesterId,
//       //   type: "shift_approved",
//       category: "shift_exchange",
//       action: "approved",
//       referenceId: exchange.id,
//       description: `Pengajuan pertukaran shift telah disetujui`,
//     });

//     res.status(200).json({
//       message: "Pertukaran shift berhasil disetujui dan shift telah ditukar.",
//       data: exchange,
//     });
//   } catch (error) {
//     console.error(error);
//     await t.rollback();
//     res.status(500).json({
//       message: "Gagal memproses persetujuan pertukaran shift",
//       error: error.message,
//     });
//   }
// };

// export const rejectShiftExchange = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { decisionNote } = req.body;
//     const rejectedBy = req.user.id;

//     if (!decisionNote || !decisionNote.trim()) {
//       return res.status(400).json({
//         message: "Alasan penolakan wajib diisi!",
//       });
//     }

//     // Ambil data pertukaran
//     const exchange = await ShiftExchange.findByPk(id);
//     if (!exchange) {
//       return res.status(404).json({
//         message: "Data pertukaran tidak ditemukan",
//       });
//     }

//     if (exchange.status !== "pending") {
//       return res.status(400).json({
//         message: "Pertukaran sudah diproses sebelumnya",
//       });
//     }

//     // Update status
//     exchange.status = "Ditolak";
//     exchange.approvedBy = rejectedBy;
//     exchange.decisionNote = decisionNote;
//     await exchange.save();

//     // Tambah aktivitas untuk admin
//     await UserActivity.create({
//       userId: rejectedBy,
//       //   type: "shift_rejected",
//       category: "shift_exchange",
//       action: "rejected",
//       referenceId: exchange.id,

//       description: `Menolak pertukaran shift ID ${exchange.id}`,
//     });

//     // Aktivitas untuk requester
//     await UserActivity.create({
//       userId: exchange.requesterId,
//       //   type: "shift_rejected",
//       category: "shift_exchange",
//       action: "rejected",
//       referenceId: exchange.id,
//       description: `Pengajuan pertukaran shift kamu telah ditolak.`,
//     });

//     res.status(200).json({
//       message: "Pengajuan pertukaran shift berhasil ditolak.",
//       data: exchange,
//     });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({
//       message: "Gagal memproses penolakan pertukaran shift",
//       error: error.message,
//     });
//   }
// };

// // oleh admin/manager/supervisor
// export const createShiftExchange = async (req, res) => {
//   try {
//     const { requesterShiftId, partnerShiftId, partnerId, reason } = req.body;
//     const requesterId = req.body.requesterId;
//     const requesterShift = await ShiftAssignment.findOne({
//       where: { id: requesterShiftId },
//       include: [{ model: WorkShift }],
//     });

//     if (!requesterShift) {
//       return res
//         .status(404)
//         .json({ message: "Shift requester tidak ditemukan" });
//     }

//     const expiry = new Date(requesterShift.date);
//     expiry.setDate(expiry.getDate() - 1);
//     expiry.setHours(18, 0, 0, 0);
//     const exchange = await ShiftExchange.create({
//       requesterId,
//       partnerId,
//       requesterShiftId,
//       partnerShiftId,
//       status: "Dipending",
//       reason,
//       expiryDate: expiry,
//     });

//     // Tukar userId antar shift
//     const partnerShift = await ShiftAssignment.findByPk(partnerShiftId);
//     if (!partnerShift) {
//       return res.status(404).json({ message: "Shift partner tidak ditemukan" });
//     }

//     const tempUserId = requesterShift.userId;
//     requesterShift.userId = partnerShift.userId;
//     partnerShift.userId = tempUserId;
//     await requesterShift.save();
//     await partnerShift.save();

//     await UserActivity.create({
//       userId: req.user.id,
//       type: "shift_submission",
//       description: `Membuat pertukaran shift atas nama user ID ${requesterId}`,
//     });

//     res.status(201).json({
//       message: "Pertukaran shift berhasil dibuat dan dipending",
//       data: exchange,
//     });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: "Gagal membuat pertukaran shift", error });
//   }
// };

// // hanya admin
// export const deleteShiftExchange = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const adminId = req.user.id;

//     // Cek role admin
//     if (req.user.role !== "Admin") {
//       return res.status(403).json({
//         message: "Hanya admin yang dapat menghapus data pertukaran shift",
//       });
//     }

//     const exchange = await ShiftExchange.findByPk(id);

//     if (!exchange) {
//       return res.status(404).json({
//         message: "Data pertukaran shift tidak ditemukan",
//       });
//     }

//     // Tidak boleh hapus data pending
//     if (exchange.status === "Pending") {
//       return res.status(400).json({
//         message: "Tidak dapat menghapus pengajuan yang masih pending",
//       });
//     }

//     await exchange.destroy();

//     // Aktivitas admin
//     // await UserActivity.create({
//     //   userId: adminId,
//     //   type: "shift_deleted",
//     //   description: `Menghapus data pertukaran shift ID ${id}`,
//     // });
//     await UserActivity.create({
//       userId: adminId,
//       category: "shift_exchange",
//       action: "completed",
//       referenceId: id,
//       description: `Menghapus data pertukaran shift`,
//     });

//     res.status(200).json({
//       message: "Data pertukaran shift berhasil dihapus.",
//     });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({
//       message: "Gagal menghapus data pertukaran shift",
//       error: error.message,
//     });
//   }
// };
