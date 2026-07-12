// LANJUT TA (BELUM DIAPA-APAIN)
// HANYA ADMIN YANG ATUR

import LeaveSubType from "../models/LeaveSubtypeModel.js";
import LeaveType from "../models/LeaveTypeModel.js";

export const getLeaveSubTypes = async (req, res) => {
  try {
    const leaveSubTypes = await LeaveSubType.findAll({
      include: [
        {
          model: LeaveType,
          as: "leavetype",
          attributes: ["id", "name"],
        },
      ],
    });

    if (leaveSubTypes.length === 0)
      return res
        .status(404)
        .json({ message: "Jenis sub pengajuan tidak ditemukan", data: [] });

    res.status(200).json({
      message: "Berhasil menampilkan semua jenis sub pengajuan",
      data: leaveSubTypes,
    });
  } catch (e) {
    res.status(500).json({
      message: "Gagal menampilkan semua jenis sub pengajuan",
      error: e.message,
    });
  }
};

export const getLeaveSubTypeById = async (req, res) => {
  try {
    const leaveSubTypes = await LeaveSubType.findByPk(req.params.id, {
      include: [
        {
          model: LeaveType,
          as: "leavetype",
          attributes: ["id", "name"],
        },
      ],
    });

    if (!leaveSubTypes)
      return res.status(404).json({
        message: `Jenis sub pengajuan dengan id ${req.params.id} tidak ditemukan`,
      });

    res.status(200).json({
      message: `Berhasil menampilkan jenis sub pengajuan dengan id ${req.params.id}`,
      data: leaveSubTypes,
    });
  } catch (e) {
    res.status(500).json({
      message: "Gagal menampilkan jenis sub pengajuan",
      error: e.message,
    });
  }
};

export const createLeaveSubType = async (req, res) => {
  try {
    const {
      name,
      leaveTypeId,
      requireEvidence = false,
      allowSameDay = true,
      cutoffHour = 10,
    } = req.body;

    if (!name || !leaveTypeId) {
      return res.status(400).json({
        message: "Nama sub pengajuan dan jenis pengajuan wajib diisi!",
      });
    }

    const leaveType = await LeaveType.findByPk(leaveTypeId);
    if (!leaveType) {
      return res.status(400).json({
        message: "Jenis pengajuan tidak valid!",
      });
    }

    if (cutoffHour < 0 || cutoffHour > 23) {
      return res.status(400).json({
        message: "Batas jam pengajuan harus antara 0 - 23",
      });
    }

    const leaveSubType = await LeaveSubType.create({
      name,
      leaveTypeId,
      requireEvidence,
      allowSameDay,
      cutoffHour,
    });

    res.status(201).json({
      message: "Berhasil menambahkan jenis sub pengajuan",
      data: leaveSubType,
    });
  } catch (e) {
    res.status(500).json({
      message: "Gagal menambahkan jenis sub pengajuan",
      error: e.message,
    });
  }
};

export const updateLeaveSubType = async (req, res) => {
  try {
    const leaveSubType = await LeaveSubType.findByPk(req.params.id);
    if (!leaveSubType) {
      return res.status(404).json({
        message: `Jenis sub pengajuan dengan id ${req.params.id} tidak ditemukan`,
      });
    }

    await leaveSubType.update(req.body);

    res.status(200).json({
      message: "Berhasil mengupdate jenis sub pengajuan",
      data: leaveSubType,
    });
  } catch (e) {
    res.status(500).json({
      message: "Gagal mengupdate jenis sub pengajuan",
      error: e.message,
    });
  }
};

export const deleteLeaveSubType = async (req, res) => {
  try {
    const deleted = await LeaveSubType.destroy({
      where: { id: req.params.id },
    });
    if (deleted === 0)
      return res.status(404).json({
        message: `Jenis sub pengajuan dengan id ${req.params.id} tidak ditemukan`,
      });
    res.status(200).json({
      message: `Berhasil menghapus jenis sub pengajuan dengan id ${req.params.id}`,
    });
  } catch (e) {
    res.status(500).json({
      message: "Gagal menghapus jenis sub pengjuan",
      error: e.message,
    });
  }
};

// export const createLeaveSubType = async (req, res) => {
//   try {
//     if (!req.body || Object.keys(req.body).length === 0)
//       return res
//         .status(400)
//         .json({ message: "Data jenis sub pengajuan tidak boleh kosong" });
//     const leaveSubTypes = await LeaveSubType.create(req.body);
//     res.status(201).json({
//       message: "Berhasil menambahkan jenis sub pengajuan",
//       data: leaveSubTypes,
//     });
//   } catch (e) {
//     res.status(500).json({
//       message: "Gagal menambahkan jenis sub pengajuan",
//       error: e.message,
//     });
//   }
// };

// export const updateLeaveSubType = async (req, res) => {
//   try {
//     const [updated] = await LeaveSubType.update(req.body, {
//       where: { id: req.params.id },
//     });
//     if (updated === 0)
//       return res.status(404).json({
//         message: `Jenis sub pengajuan dengan id ${req.params.id} tidak ditemukan`,
//       });
//     const updatedLeaveSubType = await LeaveSubType.findByPk(req.params.id);
//     res.status(200).json({
//       message: `Berhasil mengupdate jenis sub pengajuan dengan id ${req.params.id}`,
//       data: updatedLeaveSubType,
//     });
//   } catch (e) {
//     res.status(500).json({
//       message: "Gagal mengupdate jenis sub pengajuan",
//       error: e.message,
//     });
//   }
// };
