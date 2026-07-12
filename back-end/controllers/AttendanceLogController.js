// GA DIPAKE SAMA SEKALI
import AttendanceLog from "../models/AttendanceLogModel.js";
import Attendances from "../models/AttendanceModel.js";

export const getAttendanceLogs = async (req, res) => {
  try {
    const response = await AttendanceLog.findAll({
      include: Attendances, // biar bisa lihat data attendance induknya juga
    });
    res.status(200).json({
      message: "Berhasil menampilkan data log presensi",
      data: response,
    });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

export const createAttendanceLog = async (req, res) => {
  try {
    const { checkType, checkTime } = req.body;
    const today = new Date().toISOString().split("T")[0];

    // cari attendance hari ini untuk user login
    let attendance = await Attendances.findOne({
      where: { userId: req.userId, date: today },
    });

    // kalau belum ada attendance hari ini → bikin dulu
    if (!attendance) {
      attendance = await Attendances.create({
        userId: req.userId,
        date: today,
        timeIn: checkTime, // misalnya langsung pakai sebagai jam masuk
        statusAttend: "Hadir",
      });
    }

    // buat log dengan attendanceId yg bener
    const response = await AttendanceLog.create({
      attendanceId: attendance.id,
      checkType,
      checkTime,
    });

    res.status(201).json({
      message: "Berhasil menambahkan data log presensi",
      data: response,
    });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Gagal menambahkan log", error: err.message });
  }
};
