import ReportHistory from "../models/ReportHistoriesModel.js";
import User from "../models/UserModel.js";

export const getAllHistory = async (req, res) => {
  try {
    const histories = await ReportHistory.findAll({
      order: [["createdAt", "DESC"]],
    });

    res.status(200).json({
      message: "Berhasil menampilkan riwayat laporan",
      success: true,
      data: histories,
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ success: false, message: "Gagal mengambil riwayat laporan" });
  }
};

export const createHistory = async (req, res) => {
  try {
    const { reportName, period, reportType, status } = req.body;
    const userId = req.user.id;

    let fileUrl = "";
    if (req.file) {
      //   fileUrl = `http://localhost:3000/uploads/reports/${req.file.filename}`;
      fileUrl = `/uploads/reports/${req.file.filename}`;
    }

    const newHistory = await ReportHistory.create({
      reportName,
      period,
      reportType,
      fileUrl,
      status: status || "Selesai",
      userId,
    });

    res.status(201).json({
      success: true,
      message: "Riwayat laporan berhasil disimpan",
      data: newHistory,
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ success: false, message: "Gagal menyimpan riwayat" });
  }
};
