// HANYA ADMIN DAN SUPERVISOR
import Position from "../models/PositionModel.js";
import Division from "../models/DivisionModel.js";
import User from "../models/UserModel.js";

export const getPositions = async (req, res) => {
  try {
    const { divisionId } = req.query;

    const whereCondition = {};
    if (divisionId) {
      whereCondition.divisionId = divisionId;
    }

    const positions = await Position.findAll({
      where: whereCondition,
      include: [
        {
          model: Division,
          attributes: ["id", "name"],
        },
      ],
    });

    if (positions.length === 0) {
      return res
        .status(404)
        .json({ message: "Posisi tidak ditemukan", data: [] });
    }

    res
      .status(200)
      .json({ message: "Berhasil menampilkan posisi", data: positions });
  } catch (e) {
    res
      .status(500)
      .json({ message: "Gagal menampilkan posisi", error: e.message });
  }
};

export const getPositionsAll = async (req, res) => {
  try {
    const positions = await Position.findAll({
      include: [
        {
          model: Division,
          attributes: ["id", "name"],
        },
      ],
    });

    if (positions.length === 0)
      return res
        .status(404)
        .json({ message: "Posisi tidak ditemukan", data: [] });
    res
      .status(200)
      .json({ message: "Berhasil menampilkan semua posisi", data: positions });
  } catch (e) {
    res
      .status(500)
      .json({ message: "Gagal menampilkan posisi", error: e.message });
  }
};

export const getPositionById = async (req, res) => {
  try {
    const position = await Position.findByPk(req.params.id);
    if (!position)
      return res
        .status(404)
        .json({ message: `Posisi dengan id ${req.params.id} tidak ditemukan` });
    res.status(200).json({
      message: `Berhasil menampilkan posisi dengan id ${req.params.id}`,
      data: position,
    });
  } catch (e) {
    res
      .status(500)
      .json({ message: "Gagal menampilkan posisi", error: e.message });
  }
};

export const createPosition = async (req, res) => {
  try {
    const { name, divisionId } = req.body;

    if (!name || name.trim() === "") {
      return res.status(400).json({
        message: "Nama posisi tidak boleh kosong!",
      });
    }

    if (!divisionId) {
      return res.status(400).json({
        message: "Division wajib diisi",
      });
    }

    const position = await Position.create(req.body);

    res
      .status(201)
      .json({ message: "Berhasil menambahkan posisi", data: position });
  } catch (e) {
    res
      .status(500)
      .json({ message: "Gagal menambahkan posisi", error: e.message });
  }
};

export const updatePosition = async (req, res) => {
  try {
    const [updated] = await Position.update(req.body, {
      where: { id: req.params.id },
    });
    if (updated === 0)
      return res
        .status(404)
        .json({ message: `Posisi dengan id ${req.params.id} tidak ditemukan` });
    const updatedPosition = await Position.findByPk(req.params.id);
    res.status(200).json({
      message: `Berhasil memperbarui posisi dengan id ${req.params.id}`,
      data: updatedPosition,
    });
  } catch (e) {
    res
      .status(500)
      .json({ message: "Gagal mengupdate posisi", error: e.message });
  }
};

export const deletePosition = async (req, res) => {
  //   try {
  //     const deleted = await Position.destroy({ where: { id: req.params.id } });
  //     if (deleted === 0)
  //       return res
  //         .status(404)
  //         .json({ message: `Posisi dengan id ${req.params.id} tidak ditemukan` });
  //     res.status(200).json({
  //       message: `Berhasil menghapus posisi dengan id ${req.params.id}`,
  //     });
  //   } catch (e) {
  //     res
  //       .status(500)
  //       .json({ message: "Gagal menghapus posisi", error: e.message });
  //   }

  try {
    const id = req.params.id;
    const userCount = await User.count({
      where: { positionId: id },
    });

    if (userCount > 0) {
      return res.status(400).json({
        message: "Posisi masih memiliki user!",
      });
    }

    // Jika aman → hapus
    const deleted = await Position.destroy({
      where: { id },
    });

    if (deleted === 0) {
      return res.status(404).json({
        message: `Posisi dengan id ${id} tidak ditemukan`,
      });
    }

    res.status(200).json({
      message: `Berhasil menghapus posisi dengan id ${id}`,
    });
  } catch (e) {
    res.status(500).json({
      message: "Gagal menghapus posisi",
      error: e.message,
    });
  }
};

// bisa diakses semua role kecuali user
// const allowedRoles = ["Admin", "Super Admin", "Supervisor", "Manager"];
// export const getPositions = async (req, res) => {
//   if (!allowedRoles.includes(req.role))
//     return res.status(403).json({ message: "Forbidden" });
//   try {
//     const positions = await Position.findAll();
//     if (positions.length === 0)
//       return res
//         .status(404)
//         .json({ message: "Posisi tidak ditemukan", data: [] });
//     res
//       .status(200)
//       .json({ message: "Berhasil menampilkan semua posisi", data: positions });
//   } catch (e) {
//     res
//       .status(500)
//       .json({ message: "Gagal menampilkan posisi", error: e.message });
//   }
// };

// export const getPositionById = async (req, res) => {
//   if (!allowedRoles.includes(req.role))
//     return res.status(403).json({ message: "Forbidden" });
//   try {
//     const position = await Position.findByPk(req.params.id);
//     if (!position)
//       return res
//         .status(404)
//         .json({ message: `Posisi dengan id ${req.params.id} tidak ditemukan` });
//     res.status(200).json({
//       message: `Berhasil menampilkan posisi dengan id ${req.params.id}`,
//       data: position,
//     });
//   } catch (e) {
//     res
//       .status(500)
//       .json({ message: "Gagal menampilkan posisi", error: e.message });
//   }
// };

// export const createPosition = async (req, res) => {
//   if (!allowedRoles.includes(req.role))
//     return res.status(403).json({ message: "Forbidden" });
//   try {
//     if (!req.body || Object.keys(req.body).length === 0)
//       return res
//         .status(400)
//         .json({ message: "Data posisi tidak boleh kosong" });
//     const position = await Position.create(req.body);
//     res
//       .status(201)
//       .json({ message: "Berhasil menambahkan posisi", data: position });
//   } catch (e) {
//     res
//       .status(500)
//       .json({ message: "Gagal menambahkan posisi", error: e.message });
//   }
// };

// export const updatePosition = async (req, res) => {
//   if (!allowedRoles.includes(req.role))
//     return res.status(403).json({ message: "Forbidden" });
//   try {
//     const [updated] = await Position.update(req.body, {
//       where: { id: req.params.id },
//     });
//     if (updated === 0)
//       return res
//         .status(404)
//         .json({ message: `Posisi dengan id ${req.params.id} tidak ditemukan` });
//     const updatedPosition = await Position.findByPk(req.params.id);
//     res.status(200).json({
//       message: `Berhasil memperbarui posisi dengan id ${req.params.id}`,
//       data: updatedPosition,
//     });
//   } catch (e) {
//     res
//       .status(500)
//       .json({ message: "Gagal mengupdate posisi", error: e.message });
//   }
// };

// export const deletePosition = async (req, res) => {
//   if (!allowedRoles.includes(req.role))
//     return res.status(403).json({ message: "Forbidden" });
//   try {
//     const deleted = await Position.destroy({ where: { id: req.params.id } });
//     if (deleted === 0)
//       return res
//         .status(404)
//         .json({ message: `Posisi dengan id ${req.params.id} tidak ditemukan` });
//     res.status(200).json({
//       message: `Berhasil menghapus posisi dengan id ${req.params.id}`,
//     });
//   } catch (e) {
//     res
//       .status(500)
//       .json({ message: "Gagal menghapus posisi", error: e.message });
//   }
// };

// TANPA VALIDASI
// import Position from "../models/PositionModel.js";

// export const getPositions = async (req, res) => {
//   try {
//     const response = await Position.findAll();
//     if (response.length === 0) {
//       res.status(404).json({ message: "Posisi tidak ditemukan", position: [] });
//     } else {
//       res.status(200).json({
//         message: "Berhasil menampilkan semua posisi",
//         position: response,
//       });
//     }
//   } catch (e) {
//     res
//       .status(500)
//       .json({ message: "Gagal menampilkan posisi", error: e.message });
//   }
// };

// export const getPositionById = async (req, res) => {
//   try {
//     const { response } = await Position.findByPk(req.params.id);
//     if (response === 0) {
//       return res
//         .status(404)
//         .json({ message: `Posisi dengan id ${req.params.id} tidak ditemukan` });
//     }
//     res.status(200).json({
//       message: `Berhasil menampilkan posisi dengan id ${req.params.id}`,
//       response,
//     });
//   } catch (e) {
//     res
//       .status(500)
//       .json({ message: `Posisi dengan id ${req.params.id} tidak ditemukan` });
//   }
// };

// export const createPosition = async (req, res) => {
//   try {
//     if (!req.body || Object.keys(req.body).length === 0) {
//       return res
//         .status(400)
//         .json({ message: "Data posisi tidak boleh kosong" });
//     }
//     const response = await Position.create(req.body);
//     res.status(201).json({
//       message: "Berhasil menambahkan posisi",
//       position: response,
//     });
//   } catch (e) {
//     res
//       .status(500)
//       .json({ message: "Gagal menambahkan posisi", error: e.message });
//   }
// };

// export const updatePosition = async (req, res) => {
//   try {
//     const [response] = await Position.update(req.body, {
//       where: {
//         id: req.params.id,
//       },
//     });
//     if (response === 0) {
//       return res
//         .status(404)
//         .json({ message: `Posisi dengan id ${req.params.id} tidak ditemukan` });
//     }
//     res.status(200).json({
//       message: `Berhasil memperbarui posisi dengan id ${req.params.id}`,
//       position: response,
//     });
//   } catch (e) {
//     res
//       .status(500)
//       .json({ message: "Gagal mengupdate posisi", error: e.message });
//   }
// };

// export const deletePosition = async (req, res) => {
//   try {
//     const response = await Position.destroy({
//       where: {
//         id: req.params.id,
//       },
//     });
//     if (response === 0) {
//       return res
//         .status(404)
//         .json({ message: `Posisi dengan id ${req.params.id} tidak ditemukan` });
//     }
//     res
//       .status(200)
//       .json({
//         message: `Berhasil menghapus posisi dengan id ${req.params.id}`,
//         position: response,
//       });
//   } catch (e) {
//     res
//       .status(500)
//       .json({ message: "Gagal menghapus posisi", error: e.message });
//   }
// };

// YANG LAMA
// export const getPositions = async (req, res) => {
//   if (
//     req.role === "Admin" ||
//     req.role === "Super Admin" ||
//     req.role === "Supervisor" ||
//     req.role === "Manager"
//   ) {
//     try {
//       const response = await Position.findAll();
//       if (response.length === 0) {
//         res
//           .status(404)
//           .json({ message: "Posisi tidak ditemukan", position: [] });
//       } else {
//         res.status(200).json({
//           message: "Berhasil menampilkan semua posisi",
//           position: response,
//         });
//       }
//     } catch (e) {
//       res
//         .status(500)
//         .json({ message: "Gagal menampilkan posisi", error: e.message });
//     }
//   } else {
//     // selain role di atas akan mendapatkan akses ditolak
//     res.status(403).json({ message: "Forbidden" });
//   }
// };

// export const getPositionById = async (req, res) => {
//   if (
//     req.role === "Admin" ||
//     req.role === "Super Admin" ||
//     req.role === "Supervisor" ||
//     req.role === "Manager"
//   ) {
//     try {
//       const { response } = await Position.findByPk(req.params.id);
//       if (response === 0) {
//         return res.status(404).json({
//           message: `Posisi dengan id ${req.params.id} tidak ditemukan`,
//         });
//       }
//       res.status(200).json({
//         message: `Berhasil menampilkan posisi dengan id ${req.params.id}`,
//         data: response,
//       });
//     } catch (e) {
//       res.status(500).json({
//         message: `Posisi dengan id ${req.params.id} tidak ditemukan`,
//       });
//     }
//   } else {
//     res.status(404).json({ message: "Forbidden" });
//   }
// };

// export const createPosition = async (req, res) => {
//   if (
//     req.role === "Admin" ||
//     req.role === "Super Admin" ||
//     req.role === "Supervisor" ||
//     req.role === "Manager"
//   ) {
//     try {
//       if (!req.body || Object.keys(req.body).length === 0) {
//         return res
//           .status(400)
//           .json({ message: "Data posisi tidak boleh kosong" });
//       }
//       const response = await Position.create(req.body);
//       res.status(201).json({
//         message: "Berhasil menambahkan posisi",
//         position: response,
//       });
//     } catch (e) {
//       res
//         .status(500)
//         .json({ message: "Gagal menambahkan posisi", error: e.message });
//     }
//   } else {
//     // selain role di atas akan mendapatkan akses ditolak
//     res.status(403).json({ message: "Forbidden" });
//   }
// };

// export const updatePosition = async (req, res) => {
//   if (
//     req.role === "Admin" ||
//     req.role === "Super Admin" ||
//     req.role === "Supervisor" ||
//     req.role === "Manager"
//   ) {
//     try {
//       const [response] = await Position.update(req.body, {
//         where: {
//           id: req.params.id,
//         },
//       });
//       if (response === 0) {
//         return res.status(404).json({
//           message: `Posisi dengan id ${req.params.id} tidak ditemukan`,
//         });
//       }
//       res.status(200).json({
//         message: `Berhasil memperbarui posisi dengan id ${req.params.id}`,
//         position: response,
//       });
//     } catch (e) {
//       res
//         .status(500)
//         .json({ message: "Gagal mengupdate posisi", error: e.message });
//     }
//   } else {
//     // selain role di atas akan mendapatkan akses ditolak
//     res.status(403).json({ message: "Forbidden" });
//   }
// };

// export const deletePosition = async (req, res) => {
//   if (
//     req.role === "Admin" ||
//     req.role === "Super Admin" ||
//     req.role === "Supervisor" ||
//     req.role === "Manager"
//   ) {
//     try {
//       const response = await Position.destroy({
//         where: {
//           id: req.params.id,
//         },
//       });
//       if (response === 0) {
//         return res.status(404).json({
//           message: `Posisi dengan id ${req.params.id} tidak ditemukan`,
//         });
//       }
//       res.status(200).json({
//         message: `Berhasil menghapus posisi dengan id ${req.params.id}`,
//         position: response,
//       });
//     } catch (e) {
//       res
//         .status(500)
//         .json({ message: "Gagal menghapus posisi", error: e.message });
//     }
//   } else {
//     // selain role di atas akan mendapatkan akses ditolak
//     res.status(403).json({ message: "Forbidden" });
//   }
// };
