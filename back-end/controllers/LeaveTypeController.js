// LANJUT TA (BELUM DIAPA-APAIN)
import Leavetype from "../models/LeaveTypeModel.js";

export const getLeaveTypes = async (req, res) => {
  try {
    const leaveTypes = await Leavetype.findAll();
    if (leaveTypes.length === 0)
      return res
        .status(404)
        .json({ message: "Jenis cuti tidak ditemukan", data: [] });
    res.status(200).json({
      message: "Berhasil menampilkan semua jenis cuti",
      data: leaveTypes,
    });
  } catch (e) {
    res
      .status(500)
      .json({ message: "Gagal menampilkan jenis cuti", error: e.message });
  }
};

export const getLeaveTypeById = async (req, res) => {
  try {
    const leaveTypes = await Leavetype.findByPk(req.params.id);
    if (!leaveTypes)
      return res.status(404).json({
        message: `Jenis cuti dengan id ${req.params.id} tidak ditemukan`,
      });
    res.status(200).json({
      message: `Berhasil menampilkan jenis cuti dengan id ${req.params.id}`,
      data: leaveTypes,
    });
  } catch (e) {
    res
      .status(500)
      .json({ message: "Gagal menampilkan jenis cuti", error: e.message });
  }
};

export const createLeaveType = async (req, res) => {
  try {
    const { name, active = true } = req.body;

    if (!name) {
      return res.status(400).json({
        message: "Nama jenis pengajuan wajib diisi",
      });
    }

    const leaveType = await Leavetype.create({
      name,
      active,
    });

    res.status(201).json({
      message: "Berhasil menambahkan jenis pengajuan",
      data: leaveType,
    });
  } catch (e) {
    res.status(500).json({
      message: "Gagal menambahkan jenis pengajuan",
      error: e.message,
    });
  }
};

export const updateLeaveType = async (req, res) => {
  try {
    const leaveType = await Leavetype.findByPk(req.params.id);

    if (!leaveType) {
      return res.status(404).json({
        message: `Jenis pengajuan dengan id ${req.params.id} tidak ditemukan`,
      });
    }

    await leaveType.update(req.body);

    res.status(200).json({
      message: "Berhasil mengupdate jenis pengajuan",
      data: leaveType,
    });
  } catch (e) {
    res.status(500).json({
      message: "Gagal mengupdate jenis pengajuan",
      error: e.message,
    });
  }
};

export const deleteLeaveType = async (req, res) => {
  try {
    const deleted = await Leavetype.destroy({ where: { id: req.params.id } });
    if (deleted === 0)
      return res.status(404).json({
        message: `Jenis pengajuan dengan id ${req.params.id} tidak ditemukan`,
      });
    res.status(200).json({
      message: `Berhasil menghapus jenis pegajuan dengan id ${req.params.id}`,
    });
  } catch (e) {
    res
      .status(500)
      .json({ message: "Gagal menghapus jenis pengajuan", error: e.message });
  }
};

// export const createLeaveType = async (req, res) => {
//   try {
//     if (!req.body || Object.keys(req.body).length === 0)
//       return res
//         .status(400)
//         .json({ message: "Data jenis pengajuan tidak boleh kosong" });
//     const leaveTypes = await LeaveType.create(req.body);
//     res.status(201).json({
//       message: "Berhasil menambahkan jenis pengajuan",
//       data: leaveTypes,
//     });
//   } catch (e) {
//     res
//       .status(500)
//       .json({ message: "Gagal menambahkan jenis pengajuan", error: e.message });
//   }
// };

// export const updateLeaveType = async (req, res) => {
//   try {
//     const [updated] = await LeaveType.update(req.body, {
//       where: { id: req.params.id },
//     });
//     if (updated === 0)
//       return res.status(404).json({
//         message: `Jenis pengajuan dengan id ${req.params.id} tidak ditemukan`,
//       });
//     const updatedLeaveType = await LeaveType.findByPk(req.params.id);
//     res.status(200).json({
//       message: `Berhasil mengupdate jenis pengajuan dengan id ${req.params.id}`,
//       data: updatedLeaveType,
//     });
//   } catch (e) {
//     res
//       .status(500)
//       .json({ message: "Gagal mengupdate jenis pengajuan", error: e.message });
//   }
// };
