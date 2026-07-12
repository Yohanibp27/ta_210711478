// HANYA ADMIN DAN SUPERVISOR
import WorkShift from "../models/WorkShiftModel.js";
import User from "../models/UserModel.js";

export const getWorkShifts = async (req, res) => {
  try {
    const response = await WorkShift.findAll();
    if (response.length === 0) {
      return res
        .status(404)
        .json({ message: "Work shift tidak ditemukan", workShift: [] });
    } else {
      res.status(200).json({
        message: "Berhasil menampilkan semua work shift",
        data: response,
      });
    }
  } catch (e) {
    res
      .status(500)
      .json({ message: "Gagal menampilkan work shift", error: e.message });
  }
};

export const getWorkShiftById = async (req, res) => {
  try {
    const response = await WorkShift.findByPk(req.params.id);
    if (!response) {
      return res.status(404).json({
        message: `Work shift dengan id ${req.params.id} tidak ditemukan`,
      });
    } else {
      res.status(200).json({
        message: `Berhasil menampilkan work shift dengan id ${req.params.id}`,
        data: response,
      });
    }
  } catch (e) {
    res
      .status(500)
      .json({ message: "Gagal menampilkan work shift", error: e.message });
  }
};

export const createWorkShift = async (req, res) => {
  try {
    // if (!req.body || Object.keys(req.body).length === 0) {
    //   return res
    //     .status(400)
    //     .json({ message: "Data work shift tidak boleh kosong" });
    // }

    const { name, startTime, endTime, tolerance } = req.body;

    if (!name || name.trim() === "") {
      return res.status(400).json({
        message: "Nama work shift tidak boleh kosong!",
      });
    }

    if (!startTime) {
      return res.status(400).json({
        message: "Jam masuk wajib diisi",
      });
    }
    if (!endTime) {
      return res.status(400).json({
        message: "Jam keluar wajib diisi",
      });
    }
    if (tolerance === null || tolerance === undefined) {
      return res.status(400).json({
        message: "Waktu toleransi wajib diisi",
      });
    }

    const response = await WorkShift.create(req.body);
    res.status(201).json({
      message: "Berhasil membuat work shift",
      workShift: response,
    });
  } catch (e) {
    res
      .status(500)
      .json({ message: "Gagal membuat work shift", error: e.message });
  }
};

export const updateWorkShift = async (req, res) => {
  try {
    const [updated] = await WorkShift.update(req.body, {
      where: {
        id: req.params.id,
      },
    });
    if (updated === 0) {
      return res.status(400).json({
        message: `Work shift dengan id ${req.params.id} tidak ditemukan`,
      });
    }
    const response = await WorkShift.findByPk(req.params.id);
    res.status(200).json({
      message: `Berhasil mengupdate work shift dengan id ${req.params.id}`,
      workShift: response,
    });
  } catch (e) {
    res
      .status(500)
      .json({ message: "Gagal mengupdate work shift", error: e.message });
  }
};

export const deleteWorkShift = async (req, res) => {
  //   try {
  //     const response = await WorkShift.destroy({
  //       where: {
  //         id: req.params.id,
  //       },
  //     });
  //     if (response === 0) {
  //       return res.status(404).json({
  //         message: `Work shift dengan id ${req.params.id} tidak ditemukan`,
  //       });
  //     } else {
  //       res.status(200).json({
  //         message: `Berhasil menghapus work shift dengan id ${req.params.id}`,
  //       });
  //     }
  //   } catch (e) {
  //     res
  //       .status(500)
  //       .json({ message: "Gagal menghapus work shift", error: e.message });
  //   }

  try {
    const id = req.params.id;
    const ShiftCount = await WorkShift.findByPk(id);
    if (!ShiftCount) {
      return res
        .status(404)
        .json({ message: `Work shift dengan id ${id} tidak ditemukan` });
    }

    const userCount = await User.count({
      where: { workShiftId: id },
    });

    if (userCount > 0) {
      return res.status(400).json({
        message: `Work shift tidak dapat dihapus karena sedang digunakan oleh ${userCount} user.`,
      });
    }

    await WorkShift.destroy({
      where: { id },
    });

    res.status(200).json({
      message: `Berhasil menghapus work shift dengan id ${id}`,
    });
  } catch (e) {
    res
      .status(500)
      .json({ message: "Gagal menghapus work shift", error: e.message });
  }
};
