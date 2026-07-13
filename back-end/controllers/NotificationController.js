import { Op } from "sequelize";
import ShiftExchange from "../models/ShiftExchangeModel.js";
import LeaveRequest from "../models/LeaveRequestModel.js";
import Users from "../models/UserModel.js";
import LeaveType from "../models/LeaveTypeModel.js";

export const getNotifications = async (req, res) => {
  try {
    const allowedRoles = ["Admin", "Supervisor", "Manager", "Super Admin"];

    if (!allowedRoles.includes(req.role)) {
      return res.status(200).json({
        message: "Tidak ada notifikasi manajemen",
        total: 0,
        data: [],
      });
    }

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const shiftResult = await ShiftExchange.findAndCountAll({
      where: {
        status: "pending",
        createdAt: {
          [Op.gte]: sevenDaysAgo,
        },
      },
      attributes: ["id", "status", "createdAt"],
      include: [
        {
          model: Users,
          as: "requester",
          attributes: ["id", "fullName"],
        },
      ],
      distinct: true,
      order: [["createdAt", "DESC"]],
      limit: 10,
    });

    const leaveResult = await LeaveRequest.findAndCountAll({
      where: {
        status: {
          [Op.in]: ["pending", "pending_manager"],
        },
        createdAt: {
          [Op.gte]: sevenDaysAgo,
        },
      },
      attributes: ["id", "status", "createdAt"],
      include: [
        {
          model: Users,
          as: "user",
          attributes: ["id", "fullName"],
        },
        {
          model: LeaveType,
          as: "leavetype",
          attributes: ["id", "name"],
        },
      ],
      distinct: true,
      order: [["createdAt", "DESC"]],
      limit: 10,
    });

    const shiftNotifications = shiftResult.rows.map((item) => ({
      id: `ex-${item.id}`,
      title: "Permintaan Tukar Shift",
      desc: `${item.requester?.fullName || "Karyawan"} ingin tukar shift`,
      time: item.createdAt,
      link: "/shift-exchanges",
    }));

    const leaveNotifications = leaveResult.rows.map((item) => ({
      id: `lv-${item.id}`,
      title: `Pengajuan ${item.leavetype?.name || "Izin"}`,
      desc: `${item.user?.fullName || "Karyawan"} mengajukan izin`,
      time: item.createdAt,
      link: "/leave-request-history",
    }));

    const notifications = [...shiftNotifications, ...leaveNotifications]
      .sort((a, b) => new Date(b.time) - new Date(a.time))
      .slice(0, 10);

    return res.status(200).json({
      message: "Berhasil mengambil notifikasi",
      total: Number(shiftResult.count) + Number(leaveResult.count),
      data: notifications,
    });
  } catch (error) {
    console.error("Gagal mengambil notifikasi:", error);

    return res.status(500).json({
      message: "Gagal mengambil notifikasi",
      error: error.message,
    });
  }
};
