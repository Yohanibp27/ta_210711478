//  HANYA ADMIN DAN SUPERVISOR
import Division from "../models/DivisionModel.js";
import Position from "../models/PositionModel.js";

export const getDivisions = async (req, res) => {
  try {
    const { departmentId } = req.query;
    const whereClause = departmentId ? { departmentId: departmentId } : {};

    const divisions = await Division.findAll({
      where: whereClause,
    });

    if (divisions.length === 0) {
      return res
        .status(404)
        .json({ message: "Divisi tidak ditemukan", data: [] });
    }

    res.status(200).json({
      message: "Berhasil menampilkan divisi",
      data: divisions,
    });
  } catch (e) {
    res
      .status(500)
      .json({ message: "Gagal menampilkan divisi", error: e.message });
  }
};

export const getDivisionsAll = async (req, res) => {
  try {
    const divisions = await Division.findAll();
    if (divisions.length === 0)
      return res
        .status(404)
        .json({ message: "Divisi tidak ditemukan", data: [] });
    res.status(200).json({
      message: "Berhasil menampilkan semua divisi",
      data: divisions,
    });
  } catch (e) {
    res
      .status(500)
      .json({ message: "Gagal menampilkan divisi", error: e.message });
  }
};

export const getDivisionById = async (req, res) => {
  try {
    const division = await Division.findByPk(req.params.id);
    if (!division)
      return res.status(404).json({
        message: `Divisi dengan id ${req.params.id} tidak ditemukan`,
      });
    res.status(200).json({
      message: `Berhasil menampilkan divisi dengan id ${req.params.id}`,
      data: division,
    });
  } catch (e) {
    res
      .status(500)
      .json({ message: "Gagal menampilkan divisi", error: e.message });
  }
};

export const createDivision = async (req, res) => {
  try {
    // if (!req.body || Object.keys(req.body).length === 0)
    //   return res
    //     .status(400)
    //     .json({ message: "Data divisi tidak boleh kosong!" });

    const { name, departmentId } = req.body;
    if (!name || name.trim() === "") {
      return res.status(400).json({
        message: "Nama divisi tidak boleh kosong!",
      });
    }

    if (!departmentId) {
      return res.status(400).json({
        message: "Departemen wajib diisi",
      });
    }

    const division = await Division.create(req.body);
    res
      .status(201)
      .json({ message: "Berhasil menambahkan divisi", data: division });
  } catch (e) {
    res
      .status(500)
      .json({ message: "Gagal menambahkan divisi", error: e.message });
  }
};

export const updateDivision = async (req, res) => {
  try {
    const [updated] = await Division.update(req.body, {
      where: { id: req.params.id },
    });
    if (updated === 0)
      return res.status(404).json({
        message: `Divisi dengan id ${req.params.id} tidak ditemukan`,
      });
    const updatedDivision = await Division.findByPk(req.params.id);
    res.status(200).json({
      message: `Berhasil mengupdate divisi dengan id ${req.params.id}`,
      data: updatedDivision,
    });
  } catch (e) {
    res
      .status(500)
      .json({ message: "Gagal mengupdate divisi", error: e.message });
  }
};

export const deleteDivision = async (req, res) => {
  try {
    const id = req.params.id;
    const positionCount = await Position.count({
      where: { divisionId: id },
    });

    if (positionCount > 0) {
      return res.status(400).json({
        message: "Divisi masih memiliki posisi!",
      });
    }

    // Jika aman → hapus
    const deleted = await Division.destroy({
      where: { id },
    });

    if (deleted === 0) {
      return res.status(404).json({
        message: `Divisi dengan id ${id} tidak ditemukan`,
      });
    }

    res.status(200).json({
      message: `Berhasil menghapus divisi dengan id ${id}`,
    });
  } catch (e) {
    res.status(500).json({
      message: "Gagal menghapus divisi",
      error: e.message,
    });
  }
};

// bisa diakses semua role
// const allowedRoles = ["Admin", "Super Admin", "Supervisor", "Manager"];

// export const getDivisions = async (req, res) => {
//   if (!allowedRoles.includes(req.role))
//     return res.status(403).json({ message: "Forbidden" });
//   try {
//     const divisions = await Division.findAll();
//     if (divisions.length === 0)
//       return res
//         .status(404)
//         .json({ message: "Divisi tidak ditemukan", data: [] });
//     res.status(200).json({
//       message: "Berhasil menampilkan semua divisi",
//       data: divisions,
//     });
//   } catch (e) {
//     res
//       .status(500)
//       .json({ message: "Gagal menampilkan divisi", error: e.message });
//   }
// };

// export const getDivisionById = async (req, res) => {
//   if (!allowedRoles.includes(req.role))
//     return res.status(403).json({ message: "Forbidden" });
//   try {
//     const division = await Division.findByPk(req.params.id);
//     if (!division)
//       return res.status(404).json({
//         message: `Divisi dengan id ${req.params.id} tidak ditemukan`,
//       });
//     res.status(200).json({
//       message: `Berhasil menampilkan divisi dengan id ${req.params.id}`,
//       data: division,
//     });
//   } catch (e) {
//     res
//       .status(500)
//       .json({ message: "Gagal menampilkan divisi", error: e.message });
//   }
// };

// export const createDivision = async (req, res) => {
//   if (!allowedRoles.includes(req.role))
//     return res.status(403).json({ message: "Forbidden" });
//   try {
//     if (!req.body || Object.keys(req.body).length === 0)
//       return res
//         .status(400)
//         .json({ message: "Data divisi tidak boleh kosong" });
//     const division = await Division.create(req.body);
//     res
//       .status(201)
//       .json({ message: "Berhasil menambahkan divisi", data: division });
//   } catch (e) {
//     res
//       .status(500)
//       .json({ message: "Gagal menambahkan divisi", error: e.message });
//   }
// };

// export const updateDivision = async (req, res) => {
//   if (!allowedRoles.includes(req.role))
//     return res.status(403).json({ message: "Forbidden" });
//   try {
//     const [updated] = await Division.update(req.body, {
//       where: { id: req.params.id },
//     });
//     if (updated === 0)
//       return res.status(404).json({
//         message: `Divisi dengan id ${req.params.id} tidak ditemukan`,
//       });
//     const updatedDivision = await Division.findByPk(req.params.id);
//     res.status(200).json({
//       message: `Berhasil mengupdate divisi dengan id ${req.params.id}`,
//       data: updatedDivision,
//     });
//   } catch (e) {
//     res
//       .status(500)
//       .json({ message: "Gagal mengupdate divisi", error: e.message });
//   }
// };

// export const deleteDivision = async (req, res) => {
//   if (!allowedRoles.includes(req.role))
//     return res.status(403).json({ message: "Forbidden" });
//   try {
//     const deleted = await Division.destroy({ where: { id: req.params.id } });
//     if (deleted === 0)
//       return res.status(404).json({
//         message: `Divisi dengan id ${req.params.id} tidak ditemukan`,
//       });
//     res.status(200).json({
//       message: `Berhasil menghapus divisi dengan id ${req.params.id}`,
//     });
//   } catch (e) {
//     res
//       .status(500)
//       .json({ message: "Gagal menghapus divisi", error: e.message });
//   }
// };
